
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, PlayCircle } from "lucide-react";

export default function CourseDetails() {
    const { id } = useParams();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${id}`, {
            // Add Auth headers
        })
            .then(res => res.json())
            .then(data => {
                setCourse(data);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!course) return <div className="text-center py-20">Course not found</div>;

    return (
        <div className="container py-10">
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                    <p className="text-muted-foreground">{course.description}</p>
                </div>
                <button className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    Add Lecture
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Lectures</h2>
                {course.lectures.length === 0 ? (
                    <div className="glass-card text-center py-10 text-muted-foreground">
                        No lectures added yet.
                    </div>
                ) : (
                    course.lectures.map((lecture: any) => (
                        <div key={lecture.id} className="glass-card flex items-center gap-4 p-4">
                            <PlayCircle className="w-6 h-6 text-blue-400" />
                            <div>
                                <h4 className="font-semibold">{lecture.title}</h4>
                                <p className="text-sm text-muted-foreground">Video ID: {lecture.id}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
