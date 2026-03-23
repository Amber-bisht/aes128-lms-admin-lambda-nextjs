"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Play, BookOpen, Clock, ChevronRight } from "lucide-react";

export default function Dashboard() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user) {
            setLoading(true);
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/purchased`, {
                headers: {
                    "Authorization": `Bearer ${(session as any).appToken}`
                }
            })
                .then(res => res.json())
                .then(setCourses)
                .catch(console.error)
                .finally(() => setLoading(false));
        } else if (session === null) {
            setLoading(false);
        }
    }, [session]);

    return (
        <div className="min-h-screen bg-white text-gray-900 relative selection:bg-gray-900 selection:text-white font-sans">
            
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-80 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 py-16 relative z-10">
                <div className="mb-16">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="h-0.5 w-6 bg-gray-900" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-900">Dashboard</p>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tighter uppercase text-gray-900 leading-none">
                        My <span className="text-gray-900">Courses</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        // Skeleton Loaders
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex flex-col bg-white border border-gray-100 rounded-none overflow-hidden animate-pulse">
                                <div className="aspect-video bg-gray-100" />
                                <div className="p-8 space-y-4">
                                    <div className="h-6 bg-gray-100 w-3/4" />
                                    <div className="h-4 bg-gray-100 w-full" />
                                    <div className="h-4 bg-gray-100 w-1/2" />
                                    <div className="pt-6 border-t border-gray-50 flex justify-between">
                                        <div className="h-3 bg-gray-100 w-20" />
                                        <div className="h-4 bg-gray-100 w-4 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        courses.filter(c => c.active).map(course => (
                            <Link href={`/${course.slug}/play`} key={course.id} className="group relative flex flex-col bg-white border border-gray-100 rounded-none overflow-hidden transition-all hover:border-gray-900">
                                <div className="aspect-video relative overflow-hidden bg-gray-50">
                                    {course.imageUrl ? (
                                        <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover grayscale opacity-80 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                            <Play className="w-12 h-12 text-gray-200" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/5 transition-all duration-300 flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-300">
                                            <Play className="w-5 h-5 text-gray-900 fill-gray-900" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="text-[8px] font-bold px-3 py-1 bg-gray-900 text-white border-gray-900">Enrolled</span>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col bg-white">
                                    <h3 className="text-xl font-bold uppercase tracking-tight text-gray-900 group-hover:text-gray-900 transition-colors mb-4 line-clamp-1 leading-none">{course.title}</h3>
                                    <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-8 flex-1 leading-relaxed">
                                        {course.description || "Access your course modules and continue learning."}
                                    </p>
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 text-[9px] font-bold uppercase tracking-widest text-gray-300">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5">Engineering Module</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-900 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {!loading && courses.length === 0 && (
                    <div className="py-24 bg-white border border-gray-100 rounded-none flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-none flex items-center justify-center mb-8">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 uppercase">No Courses Found</h3>
                        <p className="text-gray-400 max-w-sm mb-10 font-medium leading-relaxed">
                            You haven't enrolled in any courses yet. Browse our programs to get started.
                        </p>
                        <Link href="/courses" className="bg-gray-900 text-white px-10 py-4 rounded-none text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-gray-100">
                            Browse Courses
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
