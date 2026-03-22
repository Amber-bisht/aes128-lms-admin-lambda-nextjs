
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

                    // Manifest Sanitization: Remove #EXT-X-KEY so HLS.js doesn't fetch keys itself
                    if (context.url.includes('.m3u8')) {
                        const originalOnSuccess = callbacks.onSuccess;
                        callbacks.onSuccess = (response: any, stats: any, context: any) => {
                            if (response.data && typeof response.data === 'string') {
                                // Strip key tags to prevent HLS.js from trying to fetch them
                                response.data = response.data.replace(/#EXT-X-KEY:METHOD=AES-128,URI="[^"]+"(,[A-Z]+=[^,\n]+)*/g, '');
                            }
                            originalOnSuccess(response, stats, context);
                        };
                    }

                    // If it's a segment (ts) and we have keys, decrypt it
                    if (context.responseType === 'arraybuffer' && (context.url.includes('.ts') || context.url.endsWith('.ts'))) {
                        // Offload to Worker
                        const worker = new Worker('/decryption.worker.js');

                        worker.postMessage({
                            chunkUrl: context.url,
                            keyHex: encryptionKey,
                            ivHex: iv,
                            id: context.url
                        });

                        worker.onmessage = (e) => {
                            if (e.data.error) {
                                callbacks.onError({ code: 500, text: e.data.error }, context);
                            } else {
                                callbacks.onSuccess({
                                    url: context.url,
                                    data: e.data.decryptedBuffer
                                }, { trequest: performance.now(), tfirst: 0, tload: 0 }, context);
                            }
                            worker.terminate();
                        };

                        worker.onerror = (err) => {
                            callbacks.onError({ code: 500, text: "Worker Error" }, context);
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
                pLoader: CustomLoader as any,
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
        <div className="relative w-full aspect-video bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 group">
            {/* Background mesh for player area */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-10 z-0 pointer-events-none" />
            
            <video ref={videoRef} controls className="w-full h-full relative z-10" poster="/placeholder-video.jpg" />
            
            {/* Custom Quality Settings UI Overlay */}
            {levels.length > 1 && (
                <div className="absolute top-6 right-6 z-50 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-95 group-hover:scale-100 flex flex-col items-end">
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="bg-white/90 hover:bg-white backdrop-blur-xl px-4 py-2 text-gray-900 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] flex items-center gap-3 border border-gray-100 rounded-2xl transition-all active:scale-95"
                    >
                        <Settings className={`w-4 h-4 transition-transform duration-500 ${showSettings ? 'rotate-90 text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {currentLevel === -1 ? 'AUTO' : `${levels.find(l => l.id === currentLevel)?.height}p`}
                        </span>
                    </button>
                    
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="mt-4 bg-white/95 backdrop-blur-2xl border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] rounded-[2rem] flex flex-col w-48 overflow-hidden p-2"
                            >
                                <button
                                    onClick={() => handleQualitySelect(-1)}
                                    className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest transition-all rounded-xl mb-1 ${currentLevel === -1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                >
                                    Auto Resolution
                                </button>
                                {levels.map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => handleQualitySelect(level.id)}
                                        className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-between group/item ${currentLevel === level.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                    >
                                        <span>{level.height}p</span>
                                        <span className={`text-[8px] opacity-40 tabular-nums ${currentLevel === level.id ? 'text-white' : 'group-hover/item:text-blue-400'}`}>{(level.bitrate / 1000000).toFixed(1)} Mbps</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
