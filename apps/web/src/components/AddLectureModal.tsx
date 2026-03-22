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
                        className="fixed inset-0 bg-white/40 backdrop-blur-md z-[100]"
                    />

                    <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="w-full max-w-2xl bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] pointer-events-auto relative italic"
                        >
                            {/* Background mesh for modal */}
                            <div className="absolute inset-0 bg-gradient-mesh opacity-20 z-0 pointer-events-none" />
                            
                            <button
                                onClick={onClose}
                                className="absolute top-10 right-10 p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-100 hover:bg-white text-gray-400 hover:text-red-500 transition-all z-20 group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>

                            <div className="p-16 relative z-10">
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Lecture Ingestion</h3>
                                    </div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 leading-none">New Asset <span className="text-blue-600">Creation</span></h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Asset Nomenclature</label>
                                            <div className="relative group">
                                                <Video className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-14 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-black tracking-tight"
                                                    placeholder="e.g. Intro to Architecture"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Curriculum Section</label>
                                            <input
                                                type="text"
                                                value={formData.section}
                                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-8 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-black tracking-tight"
                                                placeholder="e.g. Foundational Phase"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Asset Manifesto (Markdown)</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-[2rem] px-8 py-6 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-medium h-40 resize-none leading-relaxed italic"
                                            placeholder="Document the core concepts of this asset..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">External Signal (Video URL)</label>
                                            <input
                                                type="text"
                                                value={formData.videoUrl}
                                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-8 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-black"
                                                placeholder="https://..."
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Sequential Batch Order</label>
                                            <input
                                                type="number"
                                                value={formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] px-8 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-black"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gray-900 text-white h-20 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-gray-200"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <Plus className="w-5 h-5" />
                                                    Initialize Asset
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
