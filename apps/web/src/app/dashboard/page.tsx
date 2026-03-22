"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Play, BookOpen, Clock, ChevronRight } from "lucide-react";

export default function Dashboard() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
                headers: {
                    "Authorization": `Bearer ${(session as any).appToken}`
                }
            })
                .then(res => res.json())
                .then(setCourses)
                .catch(console.error);
        }
    }, [session]);

    return (
        <div className="min-h-screen bg-white text-gray-900 relative selection:bg-blue-100 italic font-sans">
            
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-40 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-[0.02] z-0 pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 py-16 relative z-10">
                <div className="mb-16">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="h-1 w-8 bg-blue-600 rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Student Dashboard</p>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase text-gray-900 leading-none">
                        Your <span className="text-blue-600">Learning</span> Journey
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {courses.filter(c => c.active).map(course => (
                        <Link href={`/${course.slug}/play`} key={course.id} className="group relative flex flex-col bg-white border border-gray-100 rounded-[3rem] overflow-hidden transition-all hover:border-blue-200 hover:-translate-y-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.1)]">
                            <div className="aspect-video relative overflow-hidden bg-gray-50">
                                {course.imageUrl ? (
                                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                        <Play className="w-16 h-16 text-blue-200 fill-blue-200" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-all duration-700 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500">
                                        <Play className="w-6 h-6 text-blue-600 fill-blue-600" />
                                    </div>
                                </div>
                                <div className="absolute top-6 left-6">
                                    <span className="text-[8px] font-black px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-widest border border-emerald-100">Premium Access</span>
                                </div>
                            </div>
                            <div className="p-10 flex-1 flex flex-col bg-white">
                                <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors mb-4 line-clamp-1 leading-none">{course.title}</h3>
                                <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-8 flex-1 italic leading-relaxed">
                                    {course.description || "Continue your architectural masters journey."}
                                </p>
                                <div className="flex items-center justify-between pt-8 border-t border-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-300">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> {course.lectures?.length || 0} Lectures</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> 20h Left</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {courses.length === 0 && (
                    <div className="py-32 bg-white/50 backdrop-blur-sm border border-gray-100 rounded-[3.5rem] flex flex-col items-center justify-center text-center shadow-inner">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 text-gray-900 uppercase">No Courses Found</h3>
                        <p className="text-gray-500 max-w-sm mb-10 font-medium leading-relaxed italic">
                            You haven't enrolled in any courses yet. Explore our curriculum to start your journey.
                        </p>
                        <Link href="/#courses" className="bg-gray-900 text-white px-10 py-5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-gray-200">
                            Browse Curriculum
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
