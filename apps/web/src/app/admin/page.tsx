"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PlusCircle, Video, BookOpen, Loader2, Users, ChevronRight } from "lucide-react";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = (session?.user as any)?.role === 'ADMIN';

    useEffect(() => {
        if (status === "authenticated" && isAdmin) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
                headers: {
                    "Authorization": `Bearer ${(session as any).appToken}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    setCourses(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [status, isAdmin, session]);

    if (status === "loading" || (loading && isAdmin)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white relative">
                <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 relative z-10" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-white relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
                <div className="max-w-md mx-auto px-6 text-center relative z-10">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Users className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black mb-4 tracking-tight text-gray-900 uppercase">Access Denied</h1>
                    <p className="text-gray-500 font-medium">You do not have permission to view the administrative console.</p>
                    <Link href="/" className="inline-block mt-10 bg-gray-900 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-gray-200">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 relative selection:bg-blue-100 italic font-sans overflow-x-hidden">
            <div className="fixed inset-0 bg-gradient-mesh opacity-40 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-[0.02] z-0 pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 py-16 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="h-1 w-8 bg-blue-600 rounded-full" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Administration Console</p>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase text-gray-900 leading-none">
                            Curriculum <span className="text-blue-600 underline decoration-blue-100 decoration-8 underline-offset-8">Studio</span>
                        </h1>
                    </div>
                    <Link
                        href="/admin/create-course"
                        className="flex items-center gap-4 bg-gray-900 text-white hover:bg-blue-600 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:-translate-y-1 active:scale-95 group"
                    >
                        <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        Create New Course
                    </Link>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {[
                        { label: "Total Courses", value: courses.length, icon: BookOpen, color: "blue" },
                        { label: "Total Lectures", value: courses.reduce((acc, curr) => acc + (curr.lectures?.length || 0), 0), icon: Video, color: "emerald" },
                        { label: "User Access", value: "Manage", icon: Users, color: "purple", href: "/admin/users" }
                    ].map((stat, i) => {
                        const Content = (
                            <div className="p-10 bg-white border border-gray-100 rounded-[2.5rem] hover:border-blue-100 transition-all group shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 bg-${stat.color}-50 border border-${stat.color}-100 rounded-2xl flex items-center justify-center group-hover:bg-${stat.color}-600 transition-all duration-500`}>
                                        <stat.icon className={`w-7 h-7 text-${stat.color}-600 group-hover:text-white transition-colors duration-500`} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                        <h3 className="text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tabular-nums">{stat.value}</h3>
                                    </div>
                                </div>
                            </div>
                        );

                        return stat.href ? (
                            <Link key={i} href={stat.href}>{Content}</Link>
                        ) : (
                            <div key={i}>{Content}</div>
                        );
                    })}
                </div>

                {courses.length === 0 ? (
                    <div className="p-24 bg-white/50 backdrop-blur-sm border border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-inner">
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-700">
                            <BookOpen className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-black mb-4 text-gray-900 uppercase">Studio is Empty</h3>
                        <p className="text-gray-500 max-w-sm mb-12 font-medium leading-relaxed italic">
                            Your curriculum is waiting to be built. Create your first premium course and start delivering value.
                        </p>
                        <Link
                            href="/admin/create-course"
                            className="bg-blue-600 text-white px-12 py-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                        >
                            Build First Course
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/admin/course/${course.slug}`}
                                className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden hover:border-blue-200 transition-all group flex flex-col shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.1)] hover:-translate-y-3"
                            >
                                <div className="aspect-video bg-gray-50 relative overflow-hidden">
                                    {course.imageUrl ? (
                                        <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                            <BookOpen className="w-16 h-16 text-blue-200" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-all duration-700 flex items-center justify-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white border border-white/20 px-6 py-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">Edit Curriculum</span>
                                    </div>
                                    <div className="absolute top-6 left-6 flex gap-2">
                                        <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md ${course.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white/80 text-gray-400 border border-gray-100'}`}>
                                            {course.active ? 'Public' : 'Hidden'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-6 right-6 bg-white/90 border border-gray-100 shadow-sm backdrop-blur-md rounded-xl px-4 py-2">
                                        <span className="text-sm font-black text-gray-900 italic">₹{course.price}</span>
                                    </div>
                                </div>
                                <div className="p-10 flex-1 flex flex-col bg-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <code className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-tighter">{course.slug}</code>
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{course.lectures?.length || 0} Sessions</span>
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors mb-4 line-clamp-1">{course.title}</h3>
                                    <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-8 flex-1 italic leading-relaxed">
                                        {course.description || "No description provided for this architectural journey."}
                                    </p>
                                    <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Architectural Patterns</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
