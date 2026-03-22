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
        <div className="min-h-screen bg-white text-gray-900 relative selection:bg-blue-100 font-sans overflow-x-hidden">
            <div className="fixed inset-0 bg-gradient-mesh opacity-80 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 py-16 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="h-0.5 w-6 bg-blue-600" />
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">Admin Console</p>
                        </div>
                        <h1 className="text-5xl font-bold tracking-tighter uppercase text-gray-900 leading-none">
                            Admin <span className="text-blue-600">Dashboard</span>
                        </h1>
                    </div>
                    <Link
                        href="/admin/create-course"
                        className="flex items-center gap-4 bg-gray-900 text-white hover:bg-blue-600 px-8 py-4 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-gray-100 active:scale-95 group"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Add Course
                    </Link>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {[
                        { label: "Total Courses", value: courses.length, icon: BookOpen, color: "blue" },
                        { label: "Total Lectures", value: courses.reduce((acc, curr) => acc + (curr.lectures?.length || 0), 0), icon: Video, color: "emerald" },
                        { label: "User Management", value: "Manage", icon: Users, color: "purple", href: "/admin/users" }
                    ].map((stat, i) => {
                        const Content = (
                            <div className="p-8 bg-white border border-gray-100 rounded-none hover:border-blue-200 transition-all group shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 bg-gray-50 border border-gray-100 rounded-none flex items-center justify-center group-hover:bg-gray-900 transition-all duration-300`}>
                                        <stat.icon className={`w-6 h-6 text-gray-400 group-hover:text-white transition-colors`} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tabular-nums">{stat.value}</h3>
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
                    <div className="p-20 bg-white border border-gray-100 rounded-none flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-none flex items-center justify-center mb-8">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 uppercase">No Courses Found</h3>
                        <p className="text-gray-400 max-w-sm mb-10 font-medium leading-relaxed">
                            Start building your professional curriculum by adding your first course.
                        </p>
                        <Link
                            href="/admin/create-course"
                            className="bg-gray-900 text-white px-10 py-4 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-blue-600 shadow-xl shadow-gray-100"
                        >
                            Add Course
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/admin/course/${course.slug}`}
                                className="bg-white border border-gray-100 rounded-none overflow-hidden hover:border-blue-200 transition-all group flex flex-col shadow-sm"
                            >
                                <div className="aspect-video bg-gray-50 relative overflow-hidden">
                                    {course.imageUrl ? (
                                        <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover grayscale opacity-80 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            <BookOpen className="w-12 h-12 text-gray-200" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/5 transition-all duration-300" />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <span className={`text-[8px] font-bold px-3 py-1 rounded-none uppercase tracking-widest ${course.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                            {course.active ? 'Active' : 'Draft'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-white border border-gray-100 shadow-sm px-4 py-2">
                                        <span className="text-sm font-bold text-gray-900">₹{course.price}</span>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col bg-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <code className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-sm uppercase tracking-tighter">{course.slug}</code>
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{course.lectures?.length || 0} Modules</span>
                                    </div>
                                    <h3 className="text-xl font-bold uppercase tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors mb-4 line-clamp-1">{course.title}</h3>
                                    <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-8 flex-1 leading-relaxed">
                                        {course.description || "Course description not provided."}
                                    </p>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Engineering</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-blue-600 transition-all" />
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
