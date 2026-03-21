"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PlusCircle, Video, BookOpen, Loader2, Users } from "lucide-react";

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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-32 text-center">
                <h1 className="text-4xl font-black mb-4">Access Denied</h1>
                <p className="text-gray-400">You do not have permission to view this page.</p>
                <Link href="/" className="inline-block mt-8 text-sm font-bold text-white hover:underline underline-offset-4">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Admin Dashboard</h1>
                    <p className="text-gray-400 font-medium">Manage your courses, content, and student access.</p>
                </div>
                <Link
                    href="/admin/create-course"
                    className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
                >
                    <PlusCircle className="w-5 h-5" />
                    Create Course
                </Link>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="p-8 bg-white/5 border border-white/10 rounded-none hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-none flex items-center justify-center group-hover:border-white/20 transition-all">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Courses</p>
                            <h3 className="text-3xl font-black text-white">{courses.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/5 border border-white/10 rounded-none hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-none flex items-center justify-center group-hover:border-white/20 transition-all">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Lectures</p>
                            <h3 className="text-3xl font-black text-white">
                                {courses.reduce((acc: number, curr: any) => acc + (curr.lectures?.length || 0), 0)}
                            </h3>
                        </div>
                    </div>
                </div>

                <Link href="/admin/users" className="p-8 bg-white/5 border border-white/10 rounded-none hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-none flex items-center justify-center group-hover:border-white/20 transition-all">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Users</p>
                            <h3 className="text-3xl font-black text-white">Manage</h3>
                        </div>
                    </div>
                </Link>
            </div>

            {courses.length === 0 ? (
                /* Empty State */
                <div className="p-16 bg-white/5 border border-white/10 rounded-none flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-none flex items-center justify-center mb-8 group-hover:border-white/20 transition-all">
                        <BookOpen className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">No courses yet</h3>
                    <p className="text-gray-400 max-w-sm mb-10 font-medium">
                        Your curriculum is empty. Start by building your first premium course and uploading secure content.
                    </p>
                    <Link
                        href="/admin/create-course"
                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-none text-sm font-black transition-all backdrop-blur-md"
                    >
                        Build First Course
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/admin/course/${course.slug}`}
                            className="bg-white/5 border border-white/10 rounded-none overflow-hidden hover:border-white/20 transition-all group flex flex-col"
                        >
                            <div className="aspect-video bg-white/5 relative overflow-hidden">
                                {course.imageUrl ? (
                                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="w-12 h-12 text-white/10" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white border border-white/20 px-4 py-2 rounded-full backdrop-blur-md">Manage Curriculum</span>
                                </div>
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest backdrop-blur-md ${course.active ? 'bg-white text-black' : 'bg-black/50 text-gray-400 border border-white/10'}`}>
                                        {course.active ? 'Public' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="absolute bottom-4 right-4 bg-black/50 border border-white/10 backdrop-blur-md rounded-lg px-3 py-1">
                                    <span className="text-[10px] font-black text-white">₹{course.price}</span>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2 line-clamp-1">{course.title}</h3>
                                <code className="text-[9px] font-black text-gray-500 uppercase tracking-tighter mb-4">{course.slug}</code>
                                <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-6 flex-1 italic">
                                    {course.description || "No description provided."}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{course.lectures?.length || 0} Lectures</span>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Premium</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )
            }
        </div >
    );
}
