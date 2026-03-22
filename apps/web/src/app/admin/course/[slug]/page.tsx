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
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
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
        <div className="flex h-screen bg-white overflow-hidden italic font-sans selection:bg-blue-100 italic">
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-30 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-[0.015] z-0 pointer-events-none" />

            {/* Sidebar: Curriculum */}
            <div className="w-[450px] border-r border-gray-100 flex flex-col bg-white/50 backdrop-blur-2xl relative z-10 shadow-2xl shadow-gray-100">
                <div className="p-10 border-b border-gray-50">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mb-10 group">
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Infrastructure
                    </Link>
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                        <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase truncate pr-6 leading-none">{course.title}</h1>
                        <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-gray-100">
                            <Settings className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-12 scrollbar-hide">
                    {sectionNames.map((sectionName) => (
                        <div key={sectionName} className="space-y-6">
                            <div className="px-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{sectionName}</h3>
                                </div>
                                <button
                                    onClick={() => setAddingLectureToSection(sectionName)}
                                    className="p-1.5 hover:bg-blue-50 rounded-xl text-gray-300 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
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
                                                className={`w-full text-left p-5 rounded-[2rem] flex items-center gap-5 transition-all group border ${selectedLecture?.id === lecture.id
                                                        ? 'bg-white border-blue-100 shadow-[0_15px_40px_-10px_rgba(37,99,235,0.1)] ring-4 ring-blue-50/50'
                                                        : 'border-transparent hover:bg-white hover:border-gray-100 hover:shadow-xl hover:shadow-gray-100/50'
                                                    }`}
                                            >
                                                <GripVertical className={`w-4 h-4 transition-colors cursor-grab active:cursor-grabbing ${selectedLecture?.id === lecture.id ? 'text-blue-200' : 'text-gray-200 group-hover:text-gray-300'}`} />
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${selectedLecture?.id === lecture.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-300 group-hover:bg-white group-hover:border group-hover:border-blue-100 group-hover:text-blue-600 shadow-inner'}`}>
                                                    <Video className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <p className={`text-[11px] font-black uppercase tracking-tight truncate ${selectedLecture?.id === lecture.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                                        {lecture.title}
                                                    </p>
                                                    {selectedLecture?.id === lecture.id && (
                                                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-1 block">Active Asset</span>
                                                    )}
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
                                                className="w-full bg-white border border-blue-100 rounded-[1.5rem] px-6 py-4 text-[10px] font-black uppercase text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all shadow-xl shadow-blue-100/20"
                                                placeholder="Asset Title..."
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                                <button onClick={() => handleAddLecture(sectionName, newLectureTitle)} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:scale-105 transition-all">
                                                    <Check className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => setAddingLectureToSection(null)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
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
                                    className="w-full bg-white border border-gray-200 rounded-[2rem] px-8 py-6 text-[10px] font-black uppercase text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-600 transition-all shadow-2xl shadow-gray-200"
                                    placeholder="Section Name (e.g. Masterclass)..."
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    <button onClick={handleAddSection} className="p-2.5 bg-blue-600 text-white rounded-[1rem] shadow-xl shadow-blue-200">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIsAddingSection(false)} className="p-2.5 bg-gray-50 text-gray-400 rounded-[1rem] hover:bg-red-50 hover:text-red-500 transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingSection(true)}
                                className="w-full py-6 border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center gap-4 text-gray-300 hover:text-blue-600 hover:border-blue-200 transition-all font-black text-[10px] uppercase tracking-widest bg-gray-50/30 hover:bg-blue-50/50 group"
                            >
                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Add Curriculum Section
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col bg-white/30 relative z-10">
                {!selectedLecture ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                        <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center mb-10 border border-gray-100 shadow-2xl shadow-gray-200/50 ring-8 ring-gray-50">
                            <Layout className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-gray-900 mb-6 leading-none">Awaiting <span className="text-blue-600">Selection</span></h2>
                        <p className="text-gray-400 max-w-sm font-black uppercase text-[10px] tracking-[0.3em] leading-relaxed italic">Select an architectural module from the curriculum to begin refined curation.</p>
                    </div>
                ) : (
                    <>
                        {/* Editor Header */}
                        <div className="px-16 py-12 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-3xl z-20 shadow-sm shadow-gray-100/50">
                            <div className="flex items-center gap-8">
                                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200 ring-8 ring-blue-50">
                                    <Edit3 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-3">{selectedLecture.title}</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg">{selectedLecture.section || 'Uncategorized'}</span>
                                        <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic tracking-[0.2em]">Asset Index: {selectedLecture.id.split('-')[0]}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => handleDeleteLecture(selectedLecture.id)}
                                    className="w-14 h-14 bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center group"
                                >
                                    <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleUpdateLecture()}
                                    disabled={saving}
                                    className="bg-gray-900 text-white px-12 py-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-4 disabled:opacity-50 shadow-2xl shadow-gray-200"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Commit Changes
                                </button>
                            </div>
                        </div>

                        {/* Editor Sections */}
                        <div className="flex-1 overflow-y-auto p-16 space-y-24 scrollbar-hide pb-40">
                            {/* Detailed Info Panel: Image + Meta */}
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                                <div className="lg:col-span-1 space-y-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Visual Identity</h3>
                                    </div>
                                    <div className="aspect-video bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] relative overflow-hidden group shadow-inner ring-8 ring-gray-50">
                                        {selectedLecture.imageUrl ? (
                                            <>
                                                <img src={selectedLecture.imageUrl} alt="Lecture" className="w-full h-full object-cover p-3 rounded-[2.5rem] grayscale group-hover:grayscale-0 transition-all duration-700" />
                                                <div className="absolute inset-0 bg-white/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center p-12 text-center">
                                                    <label className="cursor-pointer bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Refine Visual</label>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                                                    <ImageIcon className="w-8 h-8 text-gray-200" />
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-8 leading-relaxed italic">The canvas is currently devoid of imagery</p>
                                                <label className="cursor-pointer bg-white border border-gray-100 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">Upload Matrix</label>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUploadImage} />
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Core Metadata</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Asset Nomenclature</label>
                                            <div className="relative group">
                                                <Type className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={selectedLecture.title}
                                                    onChange={(e) => setSelectedLecture({ ...selectedLecture, title: e.target.value })}
                                                    className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-16 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-black tracking-tight"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Contextual Section</label>
                                            <div className="relative group">
                                                <Layout className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={selectedLecture.section || ''}
                                                    onChange={(e) => setSelectedLecture({ ...selectedLecture, section: e.target.value })}
                                                    className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-16 py-6 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-black tracking-tight"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Content Manifesto (Markdown)</label>
                                        <div className="relative group">
                                            <FileText className="absolute left-6 top-8 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                            <textarea
                                                value={selectedLecture.description || ''}
                                                onChange={(e) => setSelectedLecture({ ...selectedLecture, description: e.target.value })}
                                                className="w-full bg-white border border-gray-100 rounded-[2.5rem] px-16 py-10 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all font-medium h-64 resize-none leading-relaxed italic"
                                                placeholder="Imprint your detailed knowledge here..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Video Integration</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                    {/* Active Video Status */}
                                    <div className="p-12 bg-white border border-gray-100 rounded-[3rem] space-y-10 transition-all shadow-xl shadow-gray-100 relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100%] opacity-20 -mr-10 -mt-10" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-200 ring-8 ring-blue-50">
                                                <Video className="w-6 h-6" />
                                            </div>
                                            {selectedLecture.videoAssetId && (
                                                <div className="flex gap-2">
                                                    {(selectedLecture.videoAsset?.qualities || ['1080p', '480p']).map((q: string) => (
                                                        <span key={q} className="text-[8px] font-black text-blue-600 border border-blue-100 px-3 py-1 bg-blue-50 rounded-lg uppercase tracking-widest leading-none">
                                                            {q}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative z-10">
                                            <h4 className="text-2xl font-black text-gray-900 uppercase truncate leading-none mb-3">
                                                {selectedLecture.videoAsset?.name || "Unlinked Nexus"}
                                            </h4>
                                            {selectedLecture.videoAssetId && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] italic">Active Synchronized Asset</p>
                                                </div>
                                            )}
                                        </div>
                                        {selectedLecture.videoAssetId && (
                                            <button
                                                onClick={() => setSelectedLecture({ ...selectedLecture, videoAssetId: null, videoAsset: null })}
                                                className="w-full py-5 bg-red-50 border border-red-100 font-black text-[10px] uppercase tracking-[0.2em] text-red-400 hover:bg-red-500 hover:text-white rounded-[1.5rem] transition-all relative z-10"
                                            >
                                                Sever Connection
                                            </button>
                                        )}
                                    </div>

                                    {/* Library Selection & Inline Upload */}
                                    <div className="p-12 bg-white border border-gray-100 rounded-[3rem] flex flex-col gap-10 shadow-xl shadow-gray-100">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Resource Ingestion</p>
                                        </div>

                                        {/* Inline Upload Zone */}
                                        <div className={`p-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all min-h-[200px] ${uploadStatus === 'success' ? 'border-emerald-200 bg-emerald-50/50' : uploadStatus === 'error' ? 'border-red-200 bg-red-50/50' : 'border-gray-100 hover:border-blue-200 bg-gray-50/30'}`}>
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
                                                        <div className="flex flex-col items-center gap-6">
                                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                <Upload className="w-6 h-6 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900 mb-2">Initialize Upload</p>
                                                                <p className="text-[10px] text-gray-400 font-medium italic">High-Fidelity Cinema Only</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full space-y-8">
                                                            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center gap-6">
                                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                                                                    <Video className="w-6 h-6 text-gray-300" />
                                                                </div>
                                                                <div className="text-left flex-1 min-w-0">
                                                                    <p className="text-sm font-black text-gray-900 truncate leading-none mb-1">{file.name}</p>
                                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest tabular-nums italic">{Math.round(file.size / 1024 / 1024)} MB Net Weight</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); handleUpload(); }}
                                                                className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl shadow-gray-200"
                                                            >
                                                                Initiate Sequence
                                                            </button>
                                                        </div>
                                                    )}
                                                </label>
                                            )}

                                            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                                                <div className="w-full py-8 flex flex-col items-center gap-8">
                                                    <div className="relative w-20 h-20">
                                                        <div className="absolute inset-0 border-4 border-blue-50 rounded-full" />
                                                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Loader2 className="w-6 h-6 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-gray-900 tracking-[0.4em] mb-2">{uploadStatus === 'uploading' ? 'Streaming Matrix' : 'Refactoring Signal'}</p>
                                                        <p className="text-[10px] text-blue-600 font-black tracking-widest italic">{progress}% Cohesion</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {uploadStatus === 'success' && (
                                                <div className="w-full py-8 flex flex-col items-center gap-6">
                                                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
                                                        <CheckCircle2 className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.4em] mb-4">Ingestion Complete</p>
                                                        <button onClick={() => { setUploadStatus('idle'); setFile(null); }} className="text-[10px] font-black uppercase text-gray-400 hover:text-blue-600 transition-colors tracking-widest underline underline-offset-8">New Ingestion</button>
                                                    </div>
                                                </div>
                                            )}

                                            {uploadStatus === 'error' && (
                                                <div className="w-full py-8 flex flex-col items-center gap-8">
                                                    <div className="w-20 h-20 bg-red-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-200">
                                                        <AlertCircle className="w-10 h-10" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-red-600 tracking-[0.4em] mb-4">Sequence Aborted</p>
                                                        <button onClick={() => setUploadStatus('idle')} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-600 transition-colors tracking-widest underline underline-offset-8">Retry Logic</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-gray-50 w-full" />

                                        {/* Library List */}
                                        <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-4 scrollbar-hide py-2">
                                            {availableVideos.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-10 italic">
                                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Vault is Currently Empty</p>
                                                </div>
                                            ) : (
                                                availableVideos.map((video) => (
                                                    <button
                                                        key={video.id}
                                                        onClick={() => setSelectedLecture({ ...selectedLecture, videoAssetId: video.id, videoAsset: video })}
                                                        className="w-full p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left flex items-center justify-between group shadow-sm"
                                                    >
                                                        <div className="flex flex-col truncate flex-1 pr-6">
                                                            <span className="text-xs font-black text-gray-900 group-hover:text-blue-600 uppercase truncate tracking-tight mb-2 leading-none transition-colors">{video.name || video.id.split('-')[0]}</span>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex gap-1.5">
                                                                    {(video.qualities || ['1080p', '480p']).map((q: string) => (
                                                                        <span key={q} className="text-[7px] font-black text-gray-400 border border-gray-100 px-2 py-0.5 rounded-md uppercase tracking-widest leading-none bg-white">
                                                                            {q}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest tabular-nums italic">
                                                                    {new Date(video.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-10 h-10 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all flex items-center justify-center shrink-0">
                                                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
