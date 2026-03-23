"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (course: any) => void;
}

export default function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const slug = formData.get("slug") as string;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any).appToken}`
                },
                body: JSON.stringify({ 
                    title, 
                    slug, 
                    description: "", 
                    imageUrl: "", 
                    price: "0", 
                    active: false 
                })
            });

            if (res.ok) {
                const course = await res.json();
                onSuccess(course);
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || "Failed to create course");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-white/80 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-white border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] rounded-none overflow-hidden"
                    >
                        <div className="p-8 md:p-12">
                            <div className="flex justify-between items-start mb-12">
                                <div>
                                    <h2 className="text-4xl font-bold uppercase tracking-tighter text-gray-900 leading-none">
                                        Add <span className="text-blue-600">Course</span>
                                    </h2>
                                </div>
                                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Course Identifier / Title</label>
                                    <input
                                        name="title"
                                        required
                                        autoFocus
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-6 py-6 text-gray-900 focus:outline-none focus:border-blue-600 transition-all placeholder:text-gray-300 font-bold uppercase tracking-tight"
                                        placeholder="E.G. WEB DEVELOPMENT + DEVOPS"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">URL Slug</label>
                                    <input
                                        name="slug"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-6 py-6 text-gray-900 focus:outline-none focus:border-blue-600 transition-all placeholder:text-gray-300 font-bold uppercase tracking-tight"
                                        placeholder="cohort-1-0"
                                    />
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                        This course will stay as a <span className="text-orange-500">Draft</span> by default.
                                    </p>
                                </div>

                                {error && (
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 p-4 border border-red-100">
                                        {error}
                                    </p>
                                )}

                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gray-900 text-white h-20 rounded-none font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl shadow-gray-100"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing Initialization...
                                            </>
                                        ) : "Confirm & Create Draft"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
