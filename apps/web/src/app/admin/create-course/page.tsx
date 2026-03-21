
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
        <div className="max-w-2xl mx-auto px-6 py-20">
            <h1 className="text-5xl font-black tracking-tight mb-12 uppercase text-center">Create Course</h1>

            <form onSubmit={handleSubmit} className="p-8 md:p-12 bg-white/5 border border-white/10 rounded-none space-y-8 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Course Title</label>
                    <input
                        name="title"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-none p-4 text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder:text-gray-600 font-medium"
                        placeholder="e.g. 100x Full Stack Development"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Course Slug</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold px-1 py-0.5 bg-white/5 rounded text-[8px] tracking-tighter uppercase">URL</span>
                        <input
                            name="slug"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-none p-4 pl-12 text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder:text-gray-600 font-medium"
                            placeholder="e.g. full-stack-bootcamp"
                        />
                    </div>
                    <p className="text-[9px] text-gray-600 mt-2 uppercase tracking-tight font-bold ml-1">SEO friendly identifier for the course URL</p>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Description</label>
                    <textarea
                        name="description"
                        className="w-full bg-white/5 border border-white/10 rounded-none p-4 h-40 text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder:text-gray-600 font-medium resize-none"
                        placeholder="What will students learn in this premium curriculum?"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Pricing (INR)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                        <input
                            name="price"
                            type="number"
                            required
                            min="0"
                            className="w-full bg-white/5 border border-white/10 rounded-none p-4 pl-10 text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder:text-gray-600 font-medium"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 ml-1">Cover Image</label>
                    <div className="border-2 border-dashed border-white/5 rounded-none p-12 text-center hover:border-white/10 hover:bg-white/[0.02] transition-all cursor-pointer relative group/upload">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-none flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-gray-400 group-hover/upload:text-white transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 group-hover/upload:text-white transition-colors">
                            {file ? file.name : "Click or drag to upload artwork"}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-tight font-bold">PNG, JPG up to 10MB</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-none group/status">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Visibility Status</label>
                        <p className="text-[10px] text-gray-600 font-bold uppercase">{active ? "Curriculum is Public" : "Curriculum is Hidden"}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActive(!active)}
                        className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${active ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                        <div className={`w-6 h-6 rounded-full transition-all duration-300 transform ${active ? 'bg-black translate-x-6' : 'bg-gray-500 translate-x-0'}`} />
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white text-sm font-black uppercase tracking-widest py-5 rounded-none transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
                >
                    {loading ? "Initializing curriculum..." : "Launch Course"}
                </button>
            </form>
        </div>
    );
}
