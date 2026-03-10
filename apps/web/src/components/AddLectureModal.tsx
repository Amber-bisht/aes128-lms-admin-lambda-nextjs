"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Plus, Video } from "lucide-react";
import { useState } from "react";

interface AddLectureModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    onAdd: (lecture: any) => void;
    appToken: string;
}

export default function AddLectureModal({ isOpen, onClose, courseId, onAdd, appToken }: AddLectureModalProps) {
    const [formData, setFormData] = useState({
        title: "",
        section: "",
        description: "",
        videoUrl: "",
        order: 0,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${courseId}/lectures`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${appToken}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const newLecture = await res.json();
                onAdd(newLecture);
                setFormData({ title: "", section: "", description: "", videoUrl: "", order: 0 });
                onClose();
            } else {
                console.error("Failed to add lecture");
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
                                <h2 className="text-3xl font-black mb-10 uppercase tracking-tight">Add New Lecture</h2>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Lecture Title</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                                placeholder="e.g. Introduction to LMS"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Section Heading</label>
                                            <input
                                                type="text"
                                                value={formData.section}
                                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                                placeholder="e.g. Getting Started"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Description (Markdown Supported)</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium h-32 resize-none"
                                            placeholder="Lecture details, links, or notes..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Video URL (Optional)</label>
                                            <input
                                                type="text"
                                                value={formData.videoUrl}
                                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                                placeholder="https://..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Sort Order</label>
                                            <input
                                                type="number"
                                                value={formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium"
                                                placeholder="0"
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
                                                    <Plus className="w-5 h-5" />
                                                    Create Lecture
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
