
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Upload } from "lucide-react";

export default function CreateCourse() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [active, setActive] = useState(true);

    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    if (status === "loading") return null;

    if (!isAdmin) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-32 text-center">
                <h1 className="text-4xl font-black mb-4">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this page.</p>
                <Link href="/" className="inline-block mt-8 text-sm font-bold text-white hover:underline underline-offset-4">
                    Return Home
                </Link>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const slug = formData.get("slug") as string;
        const description = formData.get("description") as string;
        const price = formData.get("price") as string;

        try {
            let imageUrl = "";

            // 1. Upload Image to Backend (which then uploads to S3)
            if (file) {
                const uploadData = new FormData();
                uploadData.append("file", file);
                uploadData.append("type", "course-image");

                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload-image`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${(session as any).appToken}`
                    },
                    body: uploadData
                });

                if (!uploadRes.ok) throw new Error("Failed to upload image");

                const data = await uploadRes.json();
                imageUrl = data.imageUrl;
            }

            // 2. Create Course in Backend
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any).appToken}`
                },
                body: JSON.stringify({ title, slug, description, imageUrl, price, active })
            });

            if (res.ok) {
                const course = await res.json();
                router.push(`/admin/course/${course.id}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create course");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white relative overflow-hidden italic">
            {/* Background patterns */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-20 z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-grid opacity-10 z-0 pointer-events-none" />

            <div className="max-w-2xl mx-auto px-6 py-24 relative z-10">
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className="h-1 w-10 bg-blue-600 rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600">Curriculum Initiation</h3>
                        <span className="h-1 w-10 bg-blue-600 rounded-full" />
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter text-gray-900 leading-[0.8]">Forge <br /><span className="text-blue-600">New Module</span></h1>
                </div>

                <form onSubmit={handleSubmit} className="p-12 md:p-16 bg-white/40 backdrop-blur-3xl border border-gray-100 rounded-[3rem] space-y-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] group relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-emerald-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Asset Nomenclature</label>
                        <input
                            name="title"
                            required
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-8 py-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-gray-300 font-black tracking-tight"
                            placeholder="e.g. 100x Full Stack Development"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">URL Identifier (Slug)</label>
                        <div className="relative group/input">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[8px] tracking-tighter uppercase group-focus-within/input:text-blue-600 group-focus-within/input:border-blue-100 transition-all">URL</span>
                            <input
                                name="slug"
                                required
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-8 pl-16 py-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-gray-300 font-black tracking-tight"
                                placeholder="full-stack-bootcamp"
                            />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-3 uppercase tracking-widest font-black ml-1 opacity-50 italic">Semantic SEO identifier for indexing</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Contextual Description</label>
                        <textarea
                            name="description"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-[2rem] px-8 py-6 h-48 text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-gray-300 font-medium resize-none leading-relaxed italic"
                            placeholder="Elaborate on the module curriculum and learning outcomes..."
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Module Valuation (INR)</label>
                        <div className="relative">
                            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">₹</span>
                            <input
                                name="price"
                                type="number"
                                required
                                min="0"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-8 pl-14 py-6 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-gray-300 font-black"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Cover Manifesto (Artwork)</label>
                        <div className="border-2 border-dashed border-gray-100 rounded-[2.5rem] p-16 text-center hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer relative group/upload shadow-inner">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="w-20 h-20 bg-white border border-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover/upload:scale-110 group-hover/upload:rotate-6 shadow-lg shadow-gray-100 transition-all duration-500">
                                <Upload className="w-8 h-8 text-gray-300 group-hover/upload:text-blue-600 transition-colors" />
                            </div>
                            <p className="text-sm font-black text-gray-400 group-hover/upload:text-gray-900 transition-colors px-4">
                                {file ? file.name : "Synchronize visual asset"}
                            </p>
                            <p className="text-[10px] text-gray-300 mt-3 uppercase tracking-widest font-black opacity-50">PNG, JPG up to 10MB</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] group/status hover:bg-white/80 transition-all">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Visibility Protocol</label>
                            <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'text-emerald-600' : 'text-orange-500'}`}>
                                {active ? "Module is Publicly Available" : "Module is Sequestered"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActive(!active)}
                            className={`w-16 h-10 rounded-full p-1.5 transition-all duration-500 flex items-center ${active ? 'bg-emerald-500 shadow-xl shadow-emerald-100' : 'bg-gray-200'}`}
                        >
                            <div className={`w-7 h-7 rounded-full bg-white shadow-sm transition-all duration-500 transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white h-24 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 hover:bg-blue-600 transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-gray-200"
                        >
                            {loading ? (
                                <span className="flex items-center gap-4">
                                    <div className="w-5 h-5 border-4 border-white-40/50 border-t-white rounded-full animate-spin" />
                                    Synchronizing...
                                </span>
                            ) : "Launch Module"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
