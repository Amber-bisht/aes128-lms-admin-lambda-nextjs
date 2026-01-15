
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import VideoPlayer from "@/components/VideoPlayer";
import { PlayCircle, Lock } from "lucide-react";

export default function CoursePlayer() {
    const { id } = useParams();
    const { data: session } = useSession();
    const [course, setCourse] = useState<any>(null);
    const [activeLecture, setActiveLecture] = useState<any>(null);

    useEffect(() => {
        if (session && id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`, {
                headers: { "Authorization": `Bearer ${(session as any).appToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    setCourse(data);
                    if (data.lectures && data.lectures.length > 0) {
                        setActiveLecture(data.lectures[0]);
                    }
                });
        }
    }, [id, session]);

    if (!course) return <div className="text-center py-20">Loading...</div>;

    return (
        <div className="container py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {activeLecture ? (
                        <>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden glass-card p-0">
                                {/* Pass Encryption Details */}
                                <VideoPlayer
                                    src={activeLecture.videoUrl || ""}
                                    encryptionKey={activeLecture.encryptionKey || ""}
                                    iv={activeLecture.iv || ""}
                                />
                            </div>
                            <h2 className="text-2xl font-bold">{activeLecture.title}</h2>
                        </>
                    ) : (
                        <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center">
                            <p className="text-muted-foreground">Select a lecture to play</p>
                        </div>
                    )}
                </div>

                <div className="glass-card p-0 overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h3 className="font-bold">Course Content</h3>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                        {course.lectures.map((lecture: any) => (
                            <button
                                key={lecture.id}
                                onClick={() => setActiveLecture(lecture)}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left ${activeLecture?.id === lecture.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''}`}
                            >
                                <PlayCircle className={`w-5 h-5 ${activeLecture?.id === lecture.id ? 'text-blue-400' : 'text-muted-foreground'}`} />
                                <span className={activeLecture?.id === lecture.id ? 'text-blue-100' : 'text-gray-400'}>
                                    {lecture.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
