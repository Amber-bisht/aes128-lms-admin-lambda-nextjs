"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, PlayCircle, Loader2, ChevronLeft, Edit3 } from "lucide-react";
import CourseEditModal from "@/components/CourseEditModal";

export default function CourseDetails() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    useEffect(() => {
        if (status === "authenticated" && isAdmin) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${slug}`, {
                headers: {
                    "Authorization": `Bearer ${(session as any).appToken}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    setCourse(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
            setLoading(false);
        }
    }, [slug, session, status, isAdmin]);

    if (status === "loading" || (loading && isAdmin)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-32 text-center">
                <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Access Denied</h1>
                <p className="text-gray-400 font-medium">Elevated privileges required to manage this curriculum.</p>
                <Link href="/" className="inline-block mt-8 text-sm font-black text-white hover:underline underline-offset-8 uppercase tracking-widest transition-all">
                    Return to safety
                </Link>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-32 text-center">
                <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Curriculum Not Found</h1>
                <Link href="/admin" className="inline-block mt-8 text-sm font-black text-white hover:underline underline-offset-8 uppercase tracking-widest transition-all">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10">
            {/* Back Nav */}
            <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-xs font-black uppercase tracking-widest">Back to Dashboard</span>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${course.active ? 'bg-white text-black' : 'bg-white/10 text-gray-500 border border-white/10'}`}>
                            {course.active ? 'Public' : 'Hidden'}
                        </span>
                        <span className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest text-white">
                            ₹{course.price}
                        </span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight mb-4 uppercase leading-none">{course.title}</h1>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">URL SLUG:</span>
                        <code className="text-[11px] font-black text-white bg-white/5 px-2 py-0.5 rounded tracking-tighter uppercase">{course.slug}</code>
                    </div>
                    <p className="text-xl text-gray-400 font-medium max-w-3xl">{course.description}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95"
                    >
                        <Edit3 className="w-5 h-5" />
                        Edit Details
                    </button>
                    <button className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5 whitespace-nowrap active:scale-95">
                        <Plus className="w-5 h-5" />
                        Add Lecture
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Curriculum Structure</h2>
                    <span className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                        {course.lectures?.length || 0} Lectures
                    </span>
                </div>

                {course.lectures.length === 0 ? (
                    <div className="p-16 bg-white/5 border border-white/5 rounded-[2.5rem] text-center border-dashed group hover:border-white/10 transition-all">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <PlayCircle className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium italic">No lectures added to this curriculum yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {course.lectures.map((lecture: any, index: number) => (
                            <div
                                key={lecture.id}
                                className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between hover:bg-white/[0.07] hover:border-white/20 transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white text-gray-400 group-hover:text-black transition-all">
                                        <span className="text-xs font-black">{index + 1}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-white mb-1 uppercase tracking-tight">{lecture.title}</h4>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">ID: {lecture.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-3 text-gray-500 hover:text-white transition-colors">
                                        <PlayCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CourseEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                course={course}
                onUpdate={(updated) => {
                    setCourse({ ...course, ...updated });
                    if (updated.slug !== slug) {
                        router.push(`/admin/course/${updated.slug}`);
                    }
                }}
                appToken={(session as any).appToken}
            />
        </div>
    );
}
