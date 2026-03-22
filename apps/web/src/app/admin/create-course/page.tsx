
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
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-20 z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-grid opacity-10 z-0 pointer-events-none" />

            <div className="max-w-2xl mx-auto px-6 py-24 relative z-10">
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <span className="h-0.5 w-8 bg-blue-600" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">Course Creation</h3>
                        <span className="h-0.5 w-8 bg-blue-600" />
                    </div>
                    <h1 className="text-6xl font-bold uppercase tracking-tighter text-gray-900 leading-[0.8]">New <br /><span className="text-blue-600">Course</span></h1>
                </div>

                <form onSubmit={handleSubmit} className="p-12 md:p-16 bg-white border border-gray-100 rounded-none space-y-12 shadow-sm relative">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Course Title</label>
                        <input
                            name="title"
                            required
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 py-6 text-gray-900 focus:outline-none focus:border-blue-600 transition-all placeholder:text-gray-300 font-bold uppercase tracking-tight"
                            placeholder="e.g. FULL STACK DEVELOPMENT"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Url Slug</label>
                        <div className="relative group">
                            <input
                                name="slug"
                                required
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 py-6 text-gray-900 focus:outline-none focus:border-blue-600 transition-all placeholder:text-gray-300 font-bold uppercase tracking-tight"
                                placeholder="full-stack-bootcamp"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Description</label>
                        <textarea
                            name="description"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 py-6 h-48 text-gray-700 focus:outline-none focus:border-blue-600 transition-all placeholder:text-gray-300 font-medium resize-none leading-relaxed"
                            placeholder="Enter course description..."
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Price (INR)</label>
                        <div className="relative">
                            <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                            <input
                                name="price"
                                type="number"
                                required
                                min="0"
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 pl-14 py-6 text-gray-900 focus:outline-none focus:border-blue-600 transition-all placeholder:text-gray-300 font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Course Image</label>
                        <div className="border-2 border-dashed border-gray-100 rounded-none p-16 text-center hover:border-blue-200 transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="w-16 h-16 bg-white border border-gray-100 rounded-none flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors px-4 uppercase tracking-tight">
                                {file ? file.name : "Select Image"}
                            </p>
                            <p className="text-[10px] text-gray-300 mt-3 uppercase tracking-widest font-bold">PNG, JPG up to 10MB</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-gray-50 border border-gray-100 rounded-none">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Visibility</label>
                            <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-emerald-600' : 'text-orange-500'}`}>
                                {active ? "Course is Public" : "Course is Hidden"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setActive(!active)}
                            className={`w-14 h-8 rounded-none p-1 transition-all duration-300 flex items-center ${active ? 'bg-gray-900 shadow-lg' : 'bg-gray-200'}`}
                        >
                            <div className={`w-6 h-6 rounded-none bg-white transition-all duration-300 transform ${active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white h-20 rounded-none font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl shadow-gray-100"
                        >
                            {loading ? (
                                <span className="flex items-center gap-4">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : "Create Course"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
