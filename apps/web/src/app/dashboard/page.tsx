
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Play } from "lucide-react";

export default function Dashboard() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user) {
            // Fetch courses. Note: In real app, use the appToken in headers
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
        <div className="max-w-[1200px] mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-8">My Courses</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.filter(c => c.active).map(course => (
                    <Link href={`/${course.slug}/play`} key={course.id} className="group">
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-white/20 transition-all backdrop-blur-md flex flex-col h-full">
                            <div className="aspect-video relative overflow-hidden bg-white/5">
                                {course.imageUrl ? (
                                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        <Play className="w-12 h-12 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-12 h-12 text-white fill-white" />
                                </div>
                                <div className="absolute bottom-4 right-4 bg-black/50 border border-white/10 backdrop-blur-md rounded-lg px-3 py-1">
                                    <span className="text-[10px] font-black text-white">₹{course.price}</span>
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col">
                                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2 line-clamp-1">{course.title}</h3>
                                <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-6 flex-1 italic">
                                    {course.description || "No description provided."}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{course.lectures?.length || 0} Lectures</span>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Premium Access</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {courses.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    No courses available.
                </div>
            )}
        </div>
    );
}
