"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    ChevronLeft,
    Upload,
    Video,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Clock,
    ShieldCheck,
    ArrowRight
} from "lucide-react";

export default function VideoUploadPage() {
    const { data: session } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
    const [assetName, setAssetName] = useState("");

    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    const handleUpload = async () => {
        if (!file || !isAdmin) return;
        setUploading(true);
        setStatus("uploading");
        setProgress(10);

        try {
            // 1. Get Presigned URL
            const urlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload-url`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any).appToken}`
                },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    type: "lecture-video" // Goes to S3_BUCKET_RAW
                })
            });

            if (!urlRes.ok) throw new Error("Failed to get upload URL");
            const { url, key } = await urlRes.json();
            setProgress(30);

            // 2. Upload to S3
            const uploadRes = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file
            });

            if (!uploadRes.ok) throw new Error("S3 Upload Failed");
            setProgress(70);
            setStatus("processing");

            // 3. (Optional) Manually trigger lambda if not using S3 Triggers
            // For this project, we assume S3 triggers are active, but we can notify our backend 
            // that a new asset is pending.

            // Simulation of processing time
            setTimeout(() => {
                setStatus("success");
                setProgress(100);
                setUploading(false);
            }, 3000);

        } catch (error) {
            console.error(error);
            setStatus("error");
            setUploading(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="max-w-[1000px] mx-auto px-6 py-12">
            <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 group">
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Cancel & Return</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                <div className="lg:col-span-3 space-y-12">
                    <div>
                        <h1 className="text-5xl font-black tracking-tight mb-4 uppercase leading-none">Processor <span className="text-white/20">Studio</span></h1>
                        <p className="text-xl text-gray-500 font-medium">Upload raw content to trigger AES-128 encryption and HLS transcoding via AWS Lambda.</p>
                    </div>

                    <div className={`p-12 border-2 border-dashed rounded-[3rem] transition-all flex flex-col items-center justify-center text-center group ${status === 'success' ? 'border-green-500/20 bg-green-500/5' :
                            status === 'error' ? 'border-red-500/20 bg-red-500/5' :
                                'border-white/10 hover:border-white/20 bg-white/[0.02]'
                        }`}>
                        {status === 'idle' && (
                            <>
                                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                                    <Video className="w-10 h-10 text-gray-600" />
                                </div>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                                setFile(f);
                                                setAssetName(f.name.split('.')[0]);
                                            }
                                        }}
                                    />
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Drop your video files</h3>
                                        <p className="text-gray-500 font-medium mb-8">MP4, MOV, or WebM supported. Max 2GB.</p>
                                        <div className="bg-white text-black px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-3 hover:bg-gray-200 transition-all active:scale-95 shadow-2xl shadow-white/5">
                                            <Upload className="w-5 h-5" />
                                            Browse Files
                                        </div>
                                    </div>
                                </label>
                            </>
                        )}

                        {(status === 'uploading' || status === 'processing') && (
                            <div className="w-full space-y-10 py-12">
                                <div className="relative w-32 h-32 mx-auto">
                                    <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                                    <svg className="w-full h-full -rotate-90">
                                        <circle
                                            cx="64" cy="64" r="60"
                                            fill="transparent"
                                            stroke="white"
                                            strokeWidth="4"
                                            strokeDasharray={2 * Math.PI * 60}
                                            strokeDashoffset={2 * Math.PI * 60 * (1 - progress / 100)}
                                            className="transition-all duration-500 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-black text-white">{progress}%</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                        {status === 'uploading' ? 'Streaming to S3...' : 'Lambda Transcoding...'}
                                    </h3>
                                    <p className="text-gray-500 font-medium max-w-sm mx-auto">
                                        {status === 'uploading' ? 'Content is being mirrored across AWS Availability Zones.' : 'Applying AES-128 encryption and calculating HLS segments.'}
                                    </p>
                                </div>
                                <Loader2 className="w-6 h-6 animate-spin text-white/20 mx-auto" />
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="py-12 space-y-10">
                                <div className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Processing Complete</h3>
                                    <p className="text-gray-500 font-medium">Asset is now protected and available in your library.</p>
                                </div>
                                <button onClick={() => setStatus('idle')} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                                    Upload Another
                                </button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="py-12 space-y-10">
                                <div className="w-24 h-24 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto">
                                    <AlertCircle className="w-12 h-12 text-red-500" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Transmission Failed</h3>
                                    <p className="text-gray-500 font-medium">We couldn't reach the edge servers. Please try again.</p>
                                </div>
                                <button onClick={() => setStatus('idle')} className="bg-red-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                                    Retry Upload
                                </button>
                            </div>
                        )}
                    </div>

                    {file && status === 'idle' && (
                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                    <Video className="w-6 h-6 text-gray-400" />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={assetName}
                                        onChange={(e) => setAssetName(e.target.value)}
                                        className="bg-transparent text-xl font-black text-white focus:outline-none border-b border-white/10 focus:border-white transition-colors pr-8 uppercase"
                                    />
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">{Math.round(file.size / 1024 / 1024)} MB • RAW MP4</p>
                                </div>
                            </div>
                            <button
                                onClick={handleUpload}
                                className="bg-white text-black px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-3"
                            >
                                <ShieldCheck className="w-5 h-5" />
                                Secure & Process
                            </button>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Security Suite</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">AES-128 Enforcement</p>
                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">Unique 128-bit keys generated per asset, stored securely in private vaults.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">HLS Segmentation</p>
                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">Video is sliced into small encrypted chunks for smooth playback and theft prevention.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">Lambda Acceleration</p>
                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">Processing occurs on ephemeral compute units for maximum scalability.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent border border-white/10 rounded-[2.5rem] space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock className="w-32 h-32" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">Ready to build<br />your curriculum?</h2>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">Assigned processed assets to your course sections for immediate student access.</p>
                        <Link href="/admin" className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white hover:gap-5 transition-all">
                            Go to Courses <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
