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
    Image as ImageIcon
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
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden font-sans">
            {/* Sidebar: Curriculum */}
            <div className="w-[420px] border-r border-white/5 flex flex-col bg-[#0f0f0f]">
                <div className="p-8 border-b border-white/5">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group">
                        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Exit Editor</span>
                    </Link>
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
                        <h1 className="text-xl font-black tracking-tight text-white uppercase truncate pr-4">{course.title}</h1>
                        <Settings className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                    {sectionNames.map((sectionName) => (
                        <div key={sectionName} className="space-y-3">
                            <div className="px-4 flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">{sectionName}</h3>
                                <button
                                    onClick={() => setAddingLectureToSection(sectionName)}
                                    className="p-1 hover:bg-white/5 rounded text-gray-600 hover:text-white transition-all"
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
                                className="space-y-1"
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
                                                className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all group border ${selectedLecture?.id === lecture.id
                                                        ? 'bg-white/5 border-white/10'
                                                        : 'border-transparent hover:bg-white/[0.02] hover:border-white/5'
                                                    }`}
                                            >
                                                <GripVertical className="w-4 h-4 text-gray-800 group-hover:text-gray-600 cursor-grab active:cursor-grabbing" />
                                                <div className={`p-2 rounded-lg ${selectedLecture?.id === lecture.id ? 'bg-white text-black' : 'bg-white/5 text-gray-500 group-hover:text-white'} transition-all`}>
                                                    <Video className="w-3 h-3" />
                                                </div>
                                                <div className="flex-1 truncate">
                                                    <p className={`text-xs font-black uppercase tracking-tight truncate ${selectedLecture?.id === lecture.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
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
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="px-4 py-2"
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
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all"
                                                placeholder="Enter Video Name..."
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                <button onClick={() => handleAddLecture(sectionName, newLectureTitle)} className="p-1 hover:bg-green-500/20 text-gray-600 hover:text-green-500 rounded transition-all">
                                                    <Check className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => setAddingLectureToSection(null)} className="p-1 hover:bg-red-500/20 text-gray-600 hover:text-red-500 rounded transition-all">
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
                    <div className="px-4 pt-4 border-t border-white/5">
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
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[10px] font-black uppercase text-white placeholder:text-gray-700 focus:outline-none focus:border-white/20 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                    placeholder="Section Name (e.g. Advanced JS)..."
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button onClick={handleAddSection} className="p-1.5 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20">
                                        <Check className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setIsAddingSection(false)} className="p-1.5 bg-white/5 text-gray-500 rounded-lg border border-white/10">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingSection(true)}
                                className="w-full py-5 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-white/20 transition-all font-black text-[10px] uppercase tracking-widest bg-white/[0.01]"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Section
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
                {!selectedLecture ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5">
                            <Layout className="w-10 h-10 text-gray-800" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4">Select to Edit</h2>
                        <p className="text-gray-600 max-w-sm font-bold uppercase text-[10px] tracking-widest leading-relaxed">Choose content from the sidebar to refine your curriculum assets and metadata.</p>
                    </div>
                ) : (
                    <>
                        {/* Editor Header */}
                        <div className="px-12 py-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-3xl z-20">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                                    <Edit3 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-white">{selectedLecture.title}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{selectedLecture.section || 'Uncategorized'}</span>
                                        <div className="w-1 h-1 bg-gray-800 rounded-full" />
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lecture ID: {selectedLecture.id.split('-')[0]}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleDeleteLecture(selectedLecture.id)}
                                    className="p-4 text-gray-700 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => handleUpdateLecture()}
                                    disabled={saving}
                                    className="bg-white text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 shadow-2xl shadow-white/5"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Editor Sections */}
                        <div className="flex-1 overflow-y-auto p-12 space-y-20 scrollbar-hide">
                            {/* Detailed Info Panel: Image + Meta */}
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-1 h-6 bg-white rounded-full" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Lecture Image</h3>
                                    </div>
                                    <div className="aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                                        {selectedLecture.imageUrl ? (
                                            <>
                                                <img src={selectedLecture.imageUrl} alt="Lecture" className="w-full h-full object-cover p-2 rounded-[2.5rem]" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Change Image</label>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                                <ImageIcon className="w-8 h-8 text-gray-800 mb-4" />
                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">No Preview Image</p>
                                                <label className="mt-4 cursor-pointer bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Upload Image</label>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUploadImage} />
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-1 h-6 bg-white rounded-full" />
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Metadata</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Title</label>
                                            <div className="relative group">
                                                <Type className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                                <input
                                                    type="text"
                                                    value={selectedLecture.title}
                                                    onChange={(e) => setSelectedLecture({ ...selectedLecture, title: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-14 py-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-bold tracking-tight"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Section</label>
                                            <div className="relative group">
                                                <Layout className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                                <input
                                                    type="text"
                                                    value={selectedLecture.section || ''}
                                                    onChange={(e) => setSelectedLecture({ ...selectedLecture, section: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-14 py-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-bold tracking-tight"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Description (Markdown)</label>
                                        <div className="relative">
                                            <FileText className="absolute left-6 top-6 w-4 h-4 text-gray-700" />
                                            <textarea
                                                value={selectedLecture.description || ''}
                                                onChange={(e) => setSelectedLecture({ ...selectedLecture, description: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-3xl px-14 py-8 text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-all font-medium h-48 resize-none leading-relaxed"
                                                placeholder="Write detailed notes..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-1 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Video Asset (AES-128 Protected)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Active Video */}
                                    <div className={`p-10 border rounded-[3rem] space-y-8 transition-all ${selectedLecture.videoAssetId
                                            ? 'bg-blue-500/5 border-blue-500/20'
                                            : 'bg-white/5 border-white/10'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className={`p-4 rounded-3xl border ${selectedLecture.videoAssetId
                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                    : 'bg-white/5 border-white/10 text-gray-600'
                                                }`}>
                                                <Video className="w-6 h-6" />
                                            </div>
                                            {selectedLecture.videoAssetId && (
                                                <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">AES-128 Active</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Live Asset</p>
                                            <h4 className="text-2xl font-black text-white uppercase truncate">
                                                {selectedLecture.videoAsset?.name || "No Video Assigned"}
                                            </h4>
                                            {selectedLecture.videoAssetId && (
                                                <p className="text-[10px] text-blue-500/50 font-bold uppercase mt-2 tracking-widest">TRANSCODING COMPLETE • HLS SECURE</p>
                                            )}
                                        </div>
                                        {selectedLecture.videoAssetId && (
                                            <button
                                                onClick={() => setSelectedLecture({ ...selectedLecture, videoAssetId: null, videoAsset: null })}
                                                className="w-full py-5 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-red-500 transition-all"
                                            >
                                                Detach Asset
                                            </button>
                                        )}
                                    </div>

                                    {/* Library Selection */}
                                    <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] flex flex-col">
                                        <div className="flex items-center justify-between mb-8">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Asset Library</p>
                                            <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-white uppercase tracking-tighter">{availableVideos.length} Ready</span>
                                        </div>
                                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-2 scrollbar-hide">
                                            {availableVideos.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                                                    <Loader2 className="w-6 h-6 animate-spin text-white/10 mb-4" />
                                                    <p className="text-[10px] font-black text-gray-700 uppercase">Awaiting Lambda...</p>
                                                </div>
                                            ) : (
                                                availableVideos.map((video) => (
                                                    <button
                                                        key={video.id}
                                                        onClick={() => setSelectedLecture({ ...selectedLecture, videoAssetId: video.id, videoAsset: video })}
                                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-left flex items-center justify-between group"
                                                    >
                                                        <div className="flex flex-col truncate flex-1">
                                                            <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase truncate">{video.name || video.id.split('-')[0]}</span>
                                                            <span className="text-[8px] text-gray-700 font-bold uppercase mt-1 tracking-widest">{new Date(video.createdAt).toDateString()}</span>
                                                        </div>
                                                        <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus className="w-4 h-4 text-white" />
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                        <Link href="/admin/upload" className="mt-6 w-full py-4 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/20 transition-all group">
                                            <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-1" /> Open Processor Studio
                                        </Link>
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
