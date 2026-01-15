
"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
    src: string; // URL to m3u8 (Method=NONE)
    encryptionKey: string; // Hex
    iv: string; // Hex
}

export default function VideoPlayer({ src, encryptionKey, iv }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        if (Hls.isSupported() && videoRef.current) {
            // Custom Loader Class
            class CustomLoader extends Hls.DefaultConfig.loader {
                constructor(config: any) {
                    super(config);
                }

                load(context: any, config: any, callbacks: any) {
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

        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (doesn't support custom decryption easily without Service Worker)
            videoRef.current.src = src;
            // Note: For Safari/Native, we'd strictly need a Service Worker to intercept requests 
            // OR standard HLS encryption. Since user asked for "Web Worker", we assume Custom Player (hls.js).
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src, encryptionKey, iv]);

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden glass-card p-0">
            <video ref={videoRef} controls className="w-full h-full" poster="/placeholder-video.jpg" />
        </div>
    );
}
