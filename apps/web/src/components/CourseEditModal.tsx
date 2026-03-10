"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

interface CourseEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: any;
    onUpdate: (updatedCourse: any) => void;
    appToken: string;
}

export default function CourseEditModal({ isOpen, onClose, course, onUpdate, appToken }: CourseEditModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        price: 0,
        active: true,
        imageUrl: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (course) {
            setFormData({
                title: course.title || "",
                slug: course.slug || "",
                description: course.description || "",
                price: course.price || 0,
                active: course.active ?? true,
                imageUrl: course.imageUrl || "",
            });
            setImageFile(null);
        }
    }, [course, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrl = formData.imageUrl;

            // 1. Upload new image if selected
            if (imageFile) {
                const imgData = new FormData();
                imgData.append("file", imageFile);
                imgData.append("type", "course-image");

                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload-image`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${appToken}`,
                    },
                    body: imgData,
                });

                if (uploadRes.ok) {
                    const { imageUrl } = await uploadRes.json();
                    finalImageUrl = imageUrl;
                }
            }

            // 2. Update Course
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${course.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${appToken}`,
                },
                body: JSON.stringify({
                    ...formData,
                    imageUrl: finalImageUrl,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                onUpdate(updated);
                onClose();
            } else {
                console.error("Failed to update course");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-[#161616] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto relative"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-12">
                                <h2 className="text-3xl font-black mb-10 uppercase tracking-tight">Edit Curriculum</h2>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Course Title</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                                placeholder="Enter course title"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">URL Slug</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                                placeholder="course-slug"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium h-32 resize-none"
                                            placeholder="Course description..."
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Price (INR)</label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-end pb-1">
                                            <label className="flex items-center gap-4 cursor-pointer group bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full hover:bg-white/[0.07] transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.active}
                                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                    className="w-5 h-5 rounded-lg accent-white cursor-pointer"
                                                />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Visible to Public</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Course Thumbnail</label>
                                        <div className="flex items-center gap-6">
                                            {formData.imageUrl && !imageFile && (
                                                <img src={formData.imageUrl} alt="Thumbnail" className="w-24 h-24 rounded-2xl object-cover border border-white/10" />
                                            )}
                                            {imageFile && (
                                                <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/20 flex items-center justify-center text-[10px] font-bold uppercase text-gray-400 text-center px-2">
                                                    New Image Selected
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                className="block w-full text-sm text-gray-400
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-xs file:font-black file:uppercase file:tracking-widest
                                                    file:bg-white/5 file:text-white
                                                    hover:file:bg-white/10 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-white text-black h-16 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all transform active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
