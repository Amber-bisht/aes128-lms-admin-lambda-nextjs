"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Plus,
    PlayCircle,
    Loader2,
    ChevronLeft,
    Edit3,
    Video,
    Trash2,
    Save,
    Settings,
    Eye,
    ShieldCheck,
    Layout,
    ChevronRight,
    Type,
    FileText,
    Upload,
    GripVertical,
    Check,
    X,
    Image as ImageIcon,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import CourseEditModal from "@/components/CourseEditModal";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Reorder, AnimatePresence, motion } from "framer-motion";

export default function CourseManagementPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [availableVideos, setAvailableVideos] = useState<any[]>([]);

    // Upload States
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
    const [assetName, setAssetName] = useState("");

    const handleUpload = async () => {
        if (!file || !isAdmin) return;
        setUploading(true);
        setUploadStatus("uploading");
        setProgress(10);

        try {
            const urlRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload-url`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${appToken}`
                },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                    type: "lecture-video"
                })
            });

            if (!urlRes.ok) throw new Error("Failed to get upload URL");
            const { url, key } = await urlRes.json();
            setProgress(30);

            const uploadRes = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file
            });

            if (!uploadRes.ok) throw new Error("S3 Upload Failed");
            setProgress(70);
            setUploadStatus("processing");

            setTimeout(() => {
                setUploadStatus("success");
                setProgress(100);
                setUploading(false);
                fetchVideos(); // Refresh the asset library
            }, 3000);

        } catch (error) {
            console.error(error);
            setUploadStatus("error");
            setUploading(false);
        }
    };

    // Inline Creation States
    const [newSectionName, setNewSectionName] = useState("");
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [addingLectureToSection, setAddingLectureToSection] = useState<string | null>(null);
    const [newLectureTitle, setNewLectureTitle] = useState("");

    const isAdmin = (session?.user as any)?.role === 'ADMIN';
    const appToken = (session as any)?.appToken;

    const fetchCourse = useCallback(async () => {
        if (status === "authenticated" && isAdmin && appToken) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${slug}/full`, {
                    headers: { "Authorization": `Bearer ${appToken}` }
                });
                const data = await res.json();
                setCourse(data);
                if (data.lectures && data.lectures.length > 0 && !selectedLecture) {
                    setSelectedLecture(data.lectures[0]);
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }
    }, [slug, isAdmin, appToken, status, selectedLecture]);

    const fetchVideos = useCallback(async () => {
        if (status === "authenticated" && isAdmin && appToken) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/videos`, {
                    headers: { "Authorization": `Bearer ${appToken}` }
                });
                const data = await res.json();
                setAvailableVideos(data);
            } catch (err) {
                console.error(err);
            }
        }
    }, [isAdmin, appToken, status]);

    useEffect(() => {
        fetchCourse();
        fetchVideos();
    }, [fetchCourse, fetchVideos]);

    const handleUpdateLecture = async (updates: any = {}) => {
        if (!selectedLecture) return;
        setSaving(true);
        const dataToSave = { ...selectedLecture, ...updates };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/lectures/${selectedLecture.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${appToken}`
                },
                body: JSON.stringify(dataToSave)
            });

            if (res.ok) {
                const updated = await res.json();
                setCourse((prev: any) => ({
                    ...prev,
                    lectures: prev.lectures.map((l: any) => l.id === updated.id ? updated : l)
                }));
                setSelectedLecture(updated);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddSection = async () => {
        if (!newSectionName.trim()) {
            setIsAddingSection(false);
            return;
        }
        // Sections are virtual until a lecture is added with that section name
        // But for UX, we'll just open the lecture creation for this new section
        setAddingLectureToSection(newSectionName);
        setNewSectionName("");
        setIsAddingSection(false);
    };

    const handleAddLecture = async (sectionName: string, title: string) => {
        if (!title.trim()) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${course.id}/lectures`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${appToken}`
                },
                body: JSON.stringify({
                    title,
                    section: sectionName,
                    order: course.lectures.length
                })
            });

            if (res.ok) {
                const newLecture = await res.json();
                setCourse((prev: any) => ({
                    ...prev,
                    lectures: [...prev.lectures, newLecture]
                }));
                setSelectedLecture(newLecture);
                setAddingLectureToSection(null);
                setNewLectureTitle("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteLecture = async (id: string) => {
        if (!confirm("Are you sure you want to delete this lecture?")) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/lectures/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${appToken}` }
            });

            if (res.ok) {
                setCourse((prev: any) => ({
                    ...prev,
                    lectures: prev.lectures.filter((l: any) => l.id !== id)
                }));
                if (selectedLecture?.id === id) {
                    setSelectedLecture(null);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleReorder = async (newLectures: any[]) => {
        // Optimistic Update
        setCourse((prev: any) => ({ ...prev, lectures: newLectures }));

        // Backend Sync
        const updates = newLectures.map((l, index) => ({ id: l.id, order: index }));
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/lectures/reorder`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${appToken}`
                },
                body: JSON.stringify({ lectures: updates })
            });
        } catch (error) {
            console.error("Reorder failed:", error);
            // Revert on error?
        }
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedLecture) return;

        setSaving(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "lecture-image");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/upload-image`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${appToken}` },
                body: formData
            });

            if (res.ok) {
                const { imageUrl } = await res.json();
                handleUpdateLecture({ imageUrl });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600/20" />
            </div>
        );
    }

    if (!isAdmin || !course) return null;

    // Group lectures by section for display but we need flattened for sorting
    const sectionNames = Array.from(new Set(course.lectures.map((l: any) => l.section || "Uncategorized"))) as string[];
    // Ensure "Uncategorized" is handled or custom sections from states are included
    if (addingLectureToSection && !sectionNames.includes(addingLectureToSection)) {
        sectionNames.push(addingLectureToSection);
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans selection:bg-blue-100">
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-30 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-[0.015] z-0 pointer-events-none" />

            {/* Sidebar: Curriculum */}
            <div className="w-[420px] border-r border-gray-100 flex flex-col bg-white relative z-10">
                <div className="p-10 border-b border-gray-50">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mb-10 group">
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Admin Dashboard
                    </Link>
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                        <h1 className="text-2xl font-bold tracking-tighter text-gray-900 uppercase truncate pr-6 leading-none">{course.title}</h1>
                        <div className="p-2 bg-gray-50 rounded-none group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-gray-100">
                            <Settings className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-12 scrollbar-hide">
                    {sectionNames.map((sectionName) => (
                        <div key={sectionName} className="space-y-6">
                            <div className="px-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{sectionName}</h3>
                                </div>
                                <button
                                    onClick={() => setAddingLectureToSection(sectionName)}
                                    className="p-1.5 hover:bg-gray-50 rounded-none text-gray-300 hover:text-blue-600 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Lectures in this section */}
                            <Reorder.Group
                                axis="y"
                                values={course.lectures.filter((l: any) => (l.section || "Uncategorized") === sectionName)}
                                onReorder={(newOrder) => {
                                    // Merge back with lectures from other sections
                                    const others = course.lectures.filter((l: any) => (l.section || "Uncategorized") !== sectionName);
                                    handleReorder([...others, ...newOrder].sort((a, b) => a.order - b.order));
                                }}
                                className="space-y-3"
                            >
                                {course.lectures
                                    .filter((l: any) => (l.section || "Uncategorized") === sectionName)
                                    .sort((a: any, b: any) => a.order - b.order)
                                    .map((lecture: any) => (
                                        <Reorder.Item
                                            key={lecture.id}
                                            value={lecture}
                                            className="relative"
                                        >
                                            <button
                                                onClick={() => setSelectedLecture(lecture)}
                                                className={`w-full text-left p-4 rounded-none flex items-center gap-5 transition-all group border-l-4 ${selectedLecture?.id === lecture.id
                                                        ? 'bg-gray-50 border-l-blue-600'
                                                        : 'border-l-transparent hover:bg-gray-50'
                                                    }`}
                                            >
                                                <GripVertical className={`w-4 h-4 transition-colors cursor-grab active:cursor-grabbing ${selectedLecture?.id === lecture.id ? 'text-blue-600' : 'text-gray-200 group-hover:text-gray-300'}`} />
                                                <div className={`w-9 h-9 rounded-none flex items-center justify-center transition-all ${selectedLecture?.id === lecture.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300 group-hover:text-blue-600'}`}>
                                                    <Video className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <p className={`text-[10px] font-bold uppercase tracking-tight truncate ${selectedLecture?.id === lecture.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                                        {lecture.title}
                                                    </p>
                                                </div>
                                            </button>
                                        </Reorder.Item>
                                    ))
                                }
                            </Reorder.Group>

                            {/* Inline Lecture Addition */}
                            <AnimatePresence>
                                {addingLectureToSection === sectionName && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="px-4"
                                    >
                                        <div className="relative group">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newLectureTitle}
                                                onChange={(e) => setNewLectureTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddLecture(sectionName, newLectureTitle);
                                                    if (e.key === 'Escape') setAddingLectureToSection(null);
                                                }}
                                                className="w-full bg-white border border-gray-100 rounded-none px-6 py-4 text-[10px] font-bold uppercase text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all shadow-sm"
                                                placeholder="Lecture Title..."
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                                <button onClick={() => handleAddLecture(sectionName, newLectureTitle)} className="p-2 bg-gray-900 text-white rounded-none hover:bg-blue-600 transition-all">
                                                    <Check className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => setAddingLectureToSection(null)} className="p-2 bg-gray-50 text-gray-400 rounded-none hover:bg-red-50 hover:text-red-500 transition-all">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Inline Section Addition */}
                    <div className="px-4 pt-8 border-t border-gray-50">
                        {isAddingSection ? (
                            <div className="relative">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddSection();
                                        if (e.key === 'Escape') setIsAddingSection(false);
                                    }}
                                    className="w-full bg-white border border-gray-100 rounded-none px-6 py-4 text-[10px] font-bold uppercase text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all shadow-sm"
                                    placeholder="Section Name..."
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button onClick={handleAddSection} className="p-2 bg-gray-900 text-white rounded-none">
                                        <Check className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setIsAddingSection(false)} className="p-2 bg-gray-50 text-gray-400 rounded-none hover:bg-red-50 hover:text-red-500 transition-all">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingSection(true)}
                                className="w-full py-4 border-2 border-dashed border-gray-100 rounded-none flex items-center justify-center gap-4 text-gray-300 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-[10px] uppercase tracking-widest bg-gray-50/10 group"
                            >
                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Add Section
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col bg-white/30 relative z-10">
                {!selectedLecture ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                        <div className="w-24 h-24 bg-gray-50 rounded-none flex items-center justify-center mb-8 border border-gray-100 shadow-sm">
                            <Layout className="w-8 h-8 text-gray-200" />
                        </div>
                        <h2 className="text-3xl font-bold uppercase tracking-tighter text-gray-900 mb-4 leading-none">Select a <span className="text-blue-600">Lecture</span></h2>
                        <p className="text-gray-400 max-w-sm font-bold uppercase text-[10px] tracking-widest leading-relaxed">Select a lecture from the curriculum to begin editing.</p>
                    </div>
                ) : (
                    <>
                        {/* Editor Header */}
                        <div className="px-16 py-10 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-3xl z-20">
                            <div className="flex items-center gap-8">
                                <div className="w-16 h-16 bg-gray-900 text-white rounded-none flex items-center justify-center shadow-lg">
                                    <Edit3 className="w-6 h-6" />
                                </div>
                                <div className="max-w-md">
                                    <h2 className="text-2xl font-bold uppercase tracking-tighter text-gray-900 leading-none mb-2 truncate">{selectedLecture.title}</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-none">{selectedLecture.section || 'Uncategorized'}</span>
                                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">ID: {selectedLecture.id.split('-')[0]}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleDeleteLecture(selectedLecture.id)}
                                    className="w-12 h-12 bg-white border border-gray-100 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-none transition-all flex items-center justify-center group"
                                >
                                    <Trash2 className="w-5 h-5 transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleUpdateLecture()}
                                    disabled={saving}
                                    className="bg-gray-900 text-white px-10 py-4 rounded-none text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl shadow-gray-100 flex items-center gap-3"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Editor Sections */}
                        <div className="flex-1 overflow-y-auto p-16 space-y-24 scrollbar-hide pb-40">
                            {/* Detailed Info Panel: Meta */}
                            <section className="space-y-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="h-0.5 w-6 bg-blue-600" />
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">Lecture Details</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Lecture Title</label>
                                        <input
                                            type="text"
                                            value={selectedLecture.title}
                                            onChange={(e) => setSelectedLecture({ ...selectedLecture, title: e.target.value })}
                                            className="w-full bg-white border border-gray-100 rounded-none px-6 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all font-bold uppercase tracking-tight"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Section Name</label>
                                        <input
                                            type="text"
                                            value={selectedLecture.section || ''}
                                            onChange={(e) => setSelectedLecture({ ...selectedLecture, section: e.target.value })}
                                            className="w-full bg-white border border-gray-100 rounded-none px-6 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all font-bold uppercase tracking-tight"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Lecture Description (Markdown)</label>
                                    <textarea
                                        value={selectedLecture.description || ''}
                                        onChange={(e) => setSelectedLecture({ ...selectedLecture, description: e.target.value })}
                                        className="w-full bg-white border border-gray-100 rounded-none px-8 py-8 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all font-medium h-64 resize-none leading-relaxed"
                                        placeholder="Enter lecture description..."
                                    />
                                </div>
                            </section>

                            <section className="space-y-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="h-0.5 w-6 bg-blue-600" />
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">Video Asset</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                    {/* Active Video Status */}
                                    <div className="p-10 bg-white border border-gray-100 rounded-none space-y-8 transition-all shadow-sm relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-none flex items-center justify-center border border-gray-100">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            {selectedLecture.videoAssetId && (
                                                <div className="flex gap-2">
                                                    {(selectedLecture.videoAsset?.qualities || ['1080p', '480p']).map((q: string) => (
                                                        <span key={q} className="text-[8px] font-bold text-gray-400 border border-gray-100 px-2 py-0.5 bg-gray-50 rounded-none uppercase tracking-widest leading-none">
                                                            {q}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900 uppercase truncate leading-none mb-2">
                                                {selectedLecture.videoAsset?.name || "No Video"}
                                            </h4>
                                            {selectedLecture.videoAssetId && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Active Asset</p>
                                                </div>
                                            )}
                                        </div>
                                        {selectedLecture.videoAssetId && (
                                            <button
                                                onClick={() => setSelectedLecture({ ...selectedLecture, videoAssetId: null, videoAsset: null })}
                                                className="w-full py-4 bg-white border border-gray-100 font-bold text-[10px] uppercase tracking-widest text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 rounded-none transition-all"
                                            >
                                                Detach Video
                                            </button>
                                        )}
                                    </div>

                                    {/* Library Selection & Inline Upload */}
                                    <div className="p-10 bg-white border border-gray-100 rounded-none flex flex-col gap-8 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Video Management</p>
                                        </div>

                                        {/* Inline Upload Zone */}
                                        <div className={`p-8 border-2 border-dashed rounded-none flex flex-col items-center justify-center text-center transition-all min-h-[200px] ${uploadStatus === 'success' ? 'border-emerald-100 bg-emerald-50/20' : uploadStatus === 'error' ? 'border-red-100 bg-red-50/20' : 'border-gray-100 bg-gray-50/30'}`}>
                                            {uploadStatus === 'idle' && (
                                                <label className="cursor-pointer space-y-6 w-full group">
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
                                                    {!file ? (
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-12 h-12 bg-white border border-gray-100 rounded-none flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm">
                                                                <Upload className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900 mb-1">Upload Video</p>
                                                                <p className="text-[9px] text-gray-400 font-medium">MP4/MOV files supported</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full space-y-6">
                                                            <div className="bg-white p-4 border border-gray-100 rounded-none flex items-center gap-4 text-left">
                                                                <Video className="w-5 h-5 text-gray-300" />
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold text-gray-900 truncate uppercase">{file.name}</p>
                                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tabular-nums">{Math.round(file.size / 1024 / 1024)} MB</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); handleUpload(); }}
                                                                className="w-full bg-gray-900 text-white py-4 rounded-none font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-100"
                                                            >
                                                                Start Upload
                                                            </button>
                                                        </div>
                                                    )}
                                                </label>
                                            )}

                                            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                                                <div className="w-full py-8 flex flex-col items-center gap-6">
                                                    <div className="relative w-12 h-12">
                                                        <div className="absolute inset-0 border-2 border-gray-100 rounded-full" />
                                                        <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-gray-900 tracking-widest mb-1">{uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}</p>
                                                        <p className="text-[9px] text-blue-600 font-bold">{progress}%</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {uploadStatus === 'success' && (
                                                <div className="w-full py-8 flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-none flex items-center justify-center border border-emerald-100">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest mb-4">Upload Successful</p>
                                                        <button onClick={() => { setUploadStatus('idle'); setFile(null); }} className="text-[9px] font-bold uppercase text-gray-400 hover:text-blue-600 transition-colors tracking-widest underline underline-offset-4">Reset</button>
                                                    </div>
                                                </div>
                                            )}

                                            {uploadStatus === 'error' && (
                                                <div className="w-full py-8 flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-none flex items-center justify-center border border-red-100">
                                                        <AlertCircle className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase text-red-600 tracking-widest mb-4">Upload Failed</p>
                                                        <button onClick={() => setUploadStatus('idle')} className="text-[9px] font-bold uppercase text-gray-400 hover:text-red-600 transition-colors tracking-widest underline underline-offset-4">Retry</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-gray-50 w-full" />

                                        {/* Library List */}
                                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-hide py-2">
                                            {availableVideos.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No assets found</p>
                                                </div>
                                            ) : (
                                                availableVideos.map((video) => (
                                                    <button
                                                        key={video.id}
                                                        onClick={() => setSelectedLecture({ ...selectedLecture, videoAssetId: video.id, videoAsset: video })}
                                                        className="w-full p-4 bg-white border border-gray-100 rounded-none hover:border-blue-200 transition-all text-left flex items-center justify-between group shadow-sm"
                                                    >
                                                        <div className="flex flex-col truncate flex-1 pr-4">
                                                            <span className="text-[10px] font-bold text-gray-900 group-hover:text-blue-600 uppercase truncate tracking-widest mb-1 transition-colors">{video.name || video.id.split('-')[0]}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest tabular-nums">
                                                                    {new Date(video.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 bg-gray-50 group-hover:bg-gray-900 group-hover:text-white rounded-none transition-all flex items-center justify-center shrink-0">
                                                            <Plus className="w-4 h-4" />
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </div>

            <CourseEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                course={course}
                onUpdate={(updated) => setCourse({ ...course, ...updated })}
                appToken={appToken}
            />
        </div>
    );
}
