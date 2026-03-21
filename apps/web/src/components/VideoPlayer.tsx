
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Settings } from "lucide-react";

interface VideoPlayerProps {
    src: string; // URL to m3u8 (Method=NONE)
    encryptionKey: string; // Hex
    iv: string; // Hex
}

export default function VideoPlayer({ src, encryptionKey, iv }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (Hls.isSupported() && videoRef.current) {
            // Custom Loader Class
            class CustomLoader extends Hls.DefaultConfig.loader {
                constructor(config: any) {
                    super(config);
                }

                load(context: any, config: any, callbacks: any) {
                    // Inherit CloudFront query parameters from the parent `.m3u8` source URL dynamically
                    const cfSignatureParams = src.includes('CloudFront-') || src.includes('Policy=') ? src.split('?')[1] : null;

                    if (cfSignatureParams && !context.url.includes('Policy=')) {
                        context.url = `${context.url}${context.url.includes('?') ? '&' : '?'}${cfSignatureParams}`;
                    }

                    // If it's a segment (ts) and we have keys, decrypt it
                    if (context.responseType === 'arraybuffer' && (context.url.includes('.ts') || context.url.endsWith('.ts'))) {
                        // Offload to Worker
                        const worker = new Worker('/decryption.worker.js');

                        // Pass the fully signed custom-policy key URL if needed
                        let safeKeyUrl = `${src.replace(/[^/]+$/, 'enc.key')}`;
                        if (cfSignatureParams && !safeKeyUrl.includes('Policy=')) {
                            safeKeyUrl = `${safeKeyUrl}?${cfSignatureParams}`;
                        }

                        worker.postMessage({
                            chunkUrl: context.url,
                            keyHex: encryptionKey,
                            ivHex: iv,
                            id: context.url
                        });

                        worker.onmessage = (e) => {
                            if (e.data.error) {
                                callbacks.onError({ code: 500, text: e.data.error });
                            } else {
                                callbacks.onSuccess({
                                    url: context.url,
                                    data: e.data.decryptedBuffer
                                }, { trequest: performance.now(), tfirst: 0, tload: 0 });
                            }
                            worker.terminate();
                        };

                        worker.onerror = (err) => {
                            callbacks.onError({ code: 500, text: "Worker Error" });
                            worker.terminate();
                        }

                        // Cancel handler
                        this.abort = () => worker.terminate();
                    } else {
                        // Default behavior for playlist/manifest
                        super.load(context, config, callbacks);
                    }
                }
            }

            const hls = new Hls({
                fLoader: CustomLoader as any,
                // debug: true
            });

            hls.loadSource(src);
            hls.attachMedia(videoRef.current);
            hlsRef.current = hls;

            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                // Extract video qualities
                const availableLevels = data.levels.map((level, idx) => ({
                    id: idx,
                    height: level.height,
                    bitrate: level.bitrate
                })).sort((a, b) => b.height - a.height); // Sort highest quality first
                
                setLevels(availableLevels);
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                if (hls.autoLevelEnabled) {
                    setCurrentLevel(-1);
                } else {
                    setCurrentLevel(data.level);
                }
            });

        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Doesn't easily expose manual quality toggle without external library)
            videoRef.current.src = src;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src, encryptionKey, iv]);

    const handleQualitySelect = (levelId: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelId;
            setCurrentLevel(levelId);
            setShowSettings(false);
        }
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-none overflow-hidden glass-card p-0 group">
            <video ref={videoRef} controls className="w-full h-full" poster="/placeholder-video.jpg" />
            
            {/* Custom Quality Settings UI Overlay */}
            {levels.length > 1 && (
                <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end">
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="bg-black/60 hover:bg-black/80 backdrop-blur-sm px-3 py-2 text-white shadow-xl flex items-center gap-2 border border-white/10"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {currentLevel === -1 ? 'AUTO' : `${levels.find(l => l.id === currentLevel)?.height}p`}
                        </span>
                    </button>
                    
                    {showSettings && (
                        <div className="mt-2 bg-black/90 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col w-36">
                            <button
                                onClick={() => handleQualitySelect(-1)}
                                className={`px-4 py-3 text-left text-xs font-black uppercase tracking-widest transition-all ${currentLevel === -1 ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                Auto
                            </button>
                            {levels.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => handleQualitySelect(level.id)}
                                    className={`px-4 py-3 text-left text-xs font-black uppercase tracking-widest transition-all ${currentLevel === level.id ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                >
                                    {level.height}p
                                    <span className="ml-2 text-[9px] opacity-50 block mt-0.5">{(level.bitrate / 1000000).toFixed(1)} Mbps</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
