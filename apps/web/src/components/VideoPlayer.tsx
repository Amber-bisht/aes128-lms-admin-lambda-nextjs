
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Settings, ShieldAlert, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/video-controls.css";

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

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-hide controls logic
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        video.addEventListener("timeupdate", updateTime);
        video.addEventListener("loadedmetadata", updateDuration);
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);

        return () => {
            video.removeEventListener("timeupdate", updateTime);
            video.removeEventListener("loadedmetadata", updateDuration);
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
        };
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setIsMuted(val === 0);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ":" : ""}${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
    };

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
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div 
            className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 group video-container"
            onDoubleClick={toggleFullscreen}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
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

            {/* Video Element (Direct interaction handled by container) */}
            <video 
                ref={videoRef} 
                onClick={togglePlay}
                className="w-full h-full cursor-pointer"
                poster="/placeholder-video.jpg"
                playsInline
            />
            
            {/* Shadow Host for Watermark */}
            <div ref={shadowHostRef} className="absolute inset-0 pointer-events-none z-50" />

            {/* Premium Custom Control Bar */}
            <AnimatePresence>
                {showControls && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 z-50 p-6 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-4 pointer-events-none"
                    >
                        {/* Progress Bar */}
                        <div className="flex items-center gap-4 pointer-events-auto">
                            <input 
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="progress-slider"
                            />
                        </div>

                        {/* Main Controls Row */}
                        <div className="flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-6">
                                <button onClick={togglePlay} className="control-btn text-white">
                                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                                </button>
                                
                                <button onClick={() => {
                                    if (videoRef.current) videoRef.current.currentTime -= 10;
                                }} className="control-btn text-white/60 hover:text-white">
                                    <RotateCcw className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-3">
                                    <button onClick={() => setIsMuted(!isMuted)} className="text-white">
                                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolume}
                                        className="volume-slider"
                                    />
                                </div>

                                <span className="text-[10px] font-black text-white/50 tabular-nums uppercase tracking-widest">
                                    {formatTime(currentTime)} <span className="mx-1 text-white/20">/</span> {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Settings (Quality) */}
                                {levels.length > 1 && (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowSettings(!showSettings)}
                                            className="video-controls px-4 py-2 text-white flex items-center gap-2 rounded-xl transition-all"
                                        >
                                            <Settings className={`w-4 h-4 ${showSettings ? 'rotate-90 text-blue-400' : 'text-white/60'}`} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {currentLevel === -1 ? 'AUTO' : `${levels.find(l => l.id === currentLevel)?.height}P`}
                                            </span>
                                        </button>

                                        {showSettings && (
                                            <div className="absolute bottom-full right-0 mb-4 video-controls p-2 rounded-2xl flex flex-col w-40">
                                                <button
                                                    onClick={() => handleQualitySelect(-1)}
                                                    className={`px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest rounded-xl mb-1 ${currentLevel === -1 ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/5'}`}
                                                >
                                                    Auto Resolution
                                                </button>
                                                {levels.map((level) => (
                                                    <button
                                                        key={level.id}
                                                        onClick={() => handleQualitySelect(level.id)}
                                                        className={`px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center justify-between ${currentLevel === level.id ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/5'}`}
                                                    >
                                                        <span>{level.height}P</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button onClick={toggleFullscreen} className="video-controls p-2 text-white rounded-xl">
                                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
