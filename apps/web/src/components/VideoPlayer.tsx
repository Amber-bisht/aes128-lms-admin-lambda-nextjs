
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Settings, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPlayerProps {
    src: string; // URL to m3u8 (Method=NONE)
    courseId: string;
    lectureId: string;
    appToken: string;
    userEmail?: string;
}

export default function VideoPlayer({ src, courseId, lectureId, appToken, userEmail }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const [levels, setLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto
    const [showSettings, setShowSettings] = useState(false);
    const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' });

    // Watermark Movement Logic
    useEffect(() => {
        if (!userEmail) return;

        const moveWatermark = () => {
            const top = Math.floor(Math.random() * 70 + 10) + '%';
            const left = Math.floor(Math.random() * 70 + 10) + '%';
            setWatermarkPos({ top, left });
        };

        const interval = setInterval(moveWatermark, 45000); // Move every 45s
        return () => clearInterval(interval);
    }, [userEmail]);

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

                    // If it's a segment (ts), use our worker
                    if (context.responseType === 'arraybuffer' && (context.url.includes('.ts') || context.url.endsWith('.ts'))) {
                        if (!workerRef.current) {
                            workerRef.current = new Worker('/decryption.worker.js');
                            // Send initialization data once
                            workerRef.current.postMessage({
                                type: 'INIT',
                                config: {
                                    apiUrl: process.env.NEXT_PUBLIC_API_URL,
                                    courseId,
                                    lectureId,
                                    appToken
                                }
                            });
                        }

                        const worker = workerRef.current;
                        const requestId = context.url;

                        const handleMessage = (e: any) => {
                            if (e.data.id === requestId) {
                                if (e.data.error) {
                                    callbacks.onError({ code: 500, text: e.data.error }, context);
                                } else {
                                    callbacks.onSuccess({
                                        url: context.url,
                                        data: e.data.decryptedBuffer
                                    }, { trequest: performance.now(), tfirst: 0, tload: 0 }, context);
                                }
                                // We don't terminate the worker, we keep it for the session
                                worker.removeEventListener('message', handleMessage);
                            }
                        };

                        worker.addEventListener('message', handleMessage);
                        worker.postMessage({
                            type: 'DECRYPT_SEGMENT',
                            payload: {
                                chunkUrl: context.url,
                                id: requestId
                            }
                        });

                        this.abort = () => {
                            // worker.removeEventListener('message', handleMessage);
                        };
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
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [src, courseId, lectureId, appToken]);

    const shadowHostRef = useRef<HTMLDivElement>(null);
    const shadowRootRef = useRef<ShadowRoot | null>(null);
    const [securityViolation, setSecurityViolation] = useState(false);

    // Hardened Watermark Guard (Shadow DOM + MutationObserver)
    useEffect(() => {
        if (!userEmail || !shadowHostRef.current) return;

        // 1. Initialize Closed Shadow Root if not exists
        if (!shadowRootRef.current) {
            try {
                // 'closed' mode makes it unreachable from document.querySelector in standard scripts
                shadowRootRef.current = shadowHostRef.current.attachShadow({ mode: 'closed' });
            } catch (e) {
                // Already attached or unsupported
            }
        }

        const shadow = shadowRootRef.current;
        if (!shadow) return;

        // 2. Initial Render of Shadow Content
        const renderShadow = () => {
            shadow.innerHTML = `
                <style>
                    .watermark-wrapper {
                        position: absolute;
                        pointer-events: none;
                        user-select: none;
                        z-index: 9999;
                        transition: all 2s ease-in-out;
                        top: ${watermarkPos.top};
                        left: ${watermarkPos.left};
                        transform: translate(-50%, -50%);
                        opacity: 0.12;
                    }
                    .content {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        transform: rotate(-12deg);
                        font-family: sans-serif;
                    }
                        .email {
                            font-size: 10px;
                            font-weight: 900;
                            text-transform: uppercase;
                            letter-spacing: 0.2em;
                            color: rgba(255, 255, 255, 1);
                            white-space: nowrap;
                            text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
                        }
                        .id {
                            font-size: 8px;
                            font-weight: 700;
                            color: rgba(255, 255, 255, 0.8);
                            margin-top: 4px;
                            text-transform: uppercase;
                        }
                    </style>
                    <div class="watermark-wrapper">
                        <div class="content">
                            <span class="email">${userEmail}</span>
                            <span class="id">SECURE PLAYBACK ID: ${appToken.slice(-8)}</span>
                        </div>
                    </div>
                `;
            };

            renderShadow();

            // Handle Fullscreen visibility & Override
            const handleFullscreenChange = () => {
                const container = shadowHostRef.current?.parentElement;
                if (!container) return;

                // If the video element itself went full screen (native button), force it to the container instead
                if (document.fullscreenElement === videoRef.current) {
                    document.exitFullscreen().then(() => {
                        container.requestFullscreen();
                    });
                }

                if (document.fullscreenElement) {
                    shadowHostRef.current?.style.setProperty('z-index', '2147483647');
                }
            };
            document.addEventListener('fullscreenchange', handleFullscreenChange);

            // 3. Mutation Observer to detect Tampering
        const observer = new MutationObserver((mutations) => {
            let violation = false;
            mutations.forEach(mutation => {
                // If shadow host is removed or hidden
                if (mutation.type === 'childList') {
                    const hostFound = Array.from(shadowHostRef.current?.parentElement?.children || []).includes(shadowHostRef.current!);
                    if (!hostFound) violation = true;
                }
                if (mutation.type === 'attributes') {
                    const style = window.getComputedStyle(shadowHostRef.current!);
                    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.05) {
                        violation = true;
                    }
                }
            });

            if (violation) {
                setSecurityViolation(true);
                if (videoRef.current) videoRef.current.pause();
                console.warn('CRITICAL: Watermark manipulation detected. Playback suspended.');
            }
        });

        observer.observe(shadowHostRef.current, { attributes: true, childList: true });
        if (shadowHostRef.current.parentElement) {
            observer.observe(shadowHostRef.current.parentElement, { childList: true });
        }

        return () => observer.disconnect();
    }, [userEmail, watermarkPos, appToken]);

    const handleQualitySelect = (levelId: number) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelId;
            setCurrentLevel(levelId);
            setShowSettings(false);
        }
    };

    const toggleFullscreen = () => {
        const container = shadowHostRef.current?.parentElement;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div 
            className="relative w-full aspect-video bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 group"
            onDoubleClick={toggleFullscreen}
        >
            {/* Background mesh for player area */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-10 z-0 pointer-events-none" />
            
            {/* Security Violation Overlay */}
            {securityViolation && (
                <div className="absolute inset-0 z-[100] bg-gray-900 backdrop-blur-xl flex flex-center items-center justify-center p-12 text-center">
                    <div className="max-w-md">
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/20">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Security Violation</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            Playback has been suspended due to unexpected client-side manipulation. 
                            Please deactivate all browser extensions or DevTools scripts and refresh the page to continue.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-white text-gray-900 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                        >
                            Retry & Refresh
                        </button>
                    </div>
                </div>
            )}

            <video ref={videoRef} controls className="w-full h-full relative z-10" poster="/placeholder-video.jpg" />
            
            {/* Shadow Host for Watermark */}
            <div ref={shadowHostRef} className="absolute inset-0 pointer-events-none z-50 animate-shadow-host" />

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
