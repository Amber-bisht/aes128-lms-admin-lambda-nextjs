
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
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">My Courses</h1>

            <div className="grid-cols-auto">
                {courses.map(course => (
                    <Link href={`/course/${course.id}`} key={course.id} className="block group">
                        <div className="glass-card h-full overflow-hidden hover:border-blue-500/50 transition-colors p-0">
                            <div className="aspect-video bg-gray-800 relative">
                                {course.imageUrl ? (
                                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-12 h-12 text-white fill-white" />
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
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
