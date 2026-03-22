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
                        className="fixed inset-0 bg-white/40 backdrop-blur-md z-[100]"
                    />

                    <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="w-full max-w-2xl bg-white border border-gray-100 rounded-none overflow-hidden shadow-2xl pointer-events-auto relative"
                        >
                            {/* Background mesh for modal */}
                            <div className="absolute inset-0 bg-gradient-mesh opacity-20 z-0 pointer-events-none" />
                            
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-3 rounded-none bg-gray-50 border border-transparent hover:border-gray-100 hover:bg-white text-gray-400 hover:text-red-500 transition-all z-20 group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>

                            <div className="p-12 md:p-16 relative z-10">
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="h-0.5 w-8 bg-blue-600" />
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">Admin Dashboard</h3>
                                    </div>
                                    <h2 className="text-4xl font-bold uppercase tracking-tighter text-gray-900 leading-none">Edit <span className="text-blue-600">Course</span></h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Course Title</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all font-bold uppercase tracking-tight"
                                                placeholder="e.g. FULL STACK DEVELOPMENT"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Url Slug</label>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all font-bold uppercase tracking-tight"
                                                placeholder="full-stack-bootcamp"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 py-6 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all font-medium h-40 resize-none leading-relaxed"
                                            placeholder="Enter course description..."
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Price (INR)</label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-none px-8 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all font-bold"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <label className="flex items-center gap-6 cursor-pointer group bg-gray-50 border border-gray-100 rounded-none px-8 py-6 w-full hover:bg-white hover:border-blue-600 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.active}
                                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                                    className="w-6 h-6 rounded-none accent-gray-900 cursor-pointer"
                                                />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Course is Visible</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Course Thumbnail</label>
                                        <div className="flex items-center gap-10">
                                            {formData.imageUrl && !imageFile && (
                                                <div className="relative group">
                                                    <img src={formData.imageUrl} alt="Thumbnail" className="w-28 h-28 rounded-none object-cover border border-gray-100 shadow-sm" />
                                                </div>
                                            )}
                                            {imageFile && (
                                                <div className="w-28 h-28 rounded-none bg-emerald-50 border border-emerald-100 border-dashed flex items-center justify-center text-[8px] font-bold uppercase text-emerald-600 text-center px-4 leading-relaxed">
                                                    New Image Selected
                                                </div>
                                            )}
                                            <div className="flex-1 relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                    className="w-full hidden"
                                                    id="course-image-upload-modal"
                                                />
                                                <label htmlFor="course-image-upload-modal" className="flex items-center justify-center gap-4 w-full h-20 border border-dashed border-gray-100 rounded-none cursor-pointer hover:bg-gray-50 hover:border-blue-600 transition-all group">
                                                    <Save className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-900">Upload Image</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gray-900 text-white h-20 rounded-none font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl shadow-gray-100"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
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
