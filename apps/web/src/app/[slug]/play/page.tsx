
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import VideoPlayer from "@/components/VideoPlayer";
import { PlayCircle, Lock, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CoursePlayerPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [course, setCourse] = useState<any>(null);
    const [activeLecture, setActiveLecture] = useState<any>(null);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            // Unauthenticated users go back to landing page
            router.push(`/${slug}`);
            return;
        }

        if (session && slug) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`, {
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
    }, [slug, session, status, router]);

    const handleBuy = async () => {
        if (!session) return;
        setPurchasing(true);

        try {
            const orderRes = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL}/payments/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any).appToken}`
                },
                body: JSON.stringify({ courseId: course.id })
            });
            const order = await orderRes.json();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_5499292544",
                amount: order.amount,
                currency: "INR",
                name: "lms.amberbisht",
                description: `Enroll in ${course.title}`,
                order_id: order.id,
                handler: async (response: any) => {
                    const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL}/payments/verify-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${(session as any).appToken}`
                        },
                        body: JSON.stringify({
                            ...response,
                            courseId: course.id
                        })
                    });

                    if (verifyRes.ok) {
                        window.location.reload();
                    }
                },
                theme: { color: "#ffffff" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
        } finally {
            setPurchasing(false);
        }
    };

    if (status === "loading" || !course) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/20" />
        </div>
    );

    const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
            {/* Player Header */}
            <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href={`/${course.slug}`} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                        <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-white" />
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tight truncate max-w-md">
                            {course.title}
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">
                            {activeLecture?.title || "Course Introduction"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!isPurchased && (
                        <button
                            onClick={handleBuy}
                            disabled={purchasing}
                            className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            {purchasing ? "Processing..." : `Buy Course — ₹${course.price}`}
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left: Video Player */}
                <div className="flex-1 overflow-y-auto bg-black relative">
                    <div className="max-w-[1200px] mx-auto p-4 md:p-8">
                        <div className="aspect-video bg-[#111] rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative mb-10">
                            {isPurchased ? (
                                activeLecture ? (
                                    <VideoPlayer
                                        src={activeLecture.videoUrl || ""}
                                        encryptionKey={activeLecture.encryptionKey || ""}
                                        iv={activeLecture.iv || ""}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                        <PlayCircle className="w-16 h-16 text-white/5 mb-6" />
                                        <p className="text-gray-500 font-medium">Select a lecture from the curriculum to begin.</p>
                                    </div>
                                )
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-black/80 backdrop-blur-3xl">
                                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8">
                                        <Lock className="w-6 h-6 text-white/40" />
                                    </div>
                                    <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">Content Locked</h3>
                                    <p className="text-gray-400 text-sm mb-10 max-w-xs font-medium">
                                        Please enroll in the course to unlock high-quality lectures and premium resources.
                                    </p>
                                    <button
                                        onClick={handleBuy}
                                        className="bg-white text-black px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-white/10 hover:scale-105 transition-all"
                                    >
                                        Enroll Now — ₹{course.price}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="max-w-3xl">
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
                                {activeLecture?.title || course.title}
                            </h2>
                            <p className="text-gray-400 font-medium leading-relaxed">
                                {activeLecture?.description || course.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Curriculum Index */}
                <aside className="w-80 border-l border-white/5 bg-[#0d0d0d] hidden lg:flex flex-col">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">Curriculum</h3>
                        <p className="font-black uppercase tracking-tight text-white">Course Syllabus</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {course.lectures?.map((lecture: any, index: number) => (
                            <button
                                key={lecture.id}
                                disabled={!isPurchased}
                                onClick={() => setActiveLecture(lecture)}
                                className={`w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-all text-left group border-b border-white/[0.02] disabled:opacity-30 ${activeLecture?.id === lecture.id ? 'bg-white/5' : ''}`}
                            >
                                <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${activeLecture?.id === lecture.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-white/5 border border-white/10 text-gray-500'}`}>
                                    {(index + 1).toString().padStart(2, '0')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-xs font-black uppercase tracking-tight mb-1 truncate ${activeLecture?.id === lecture.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                        {lecture.title}
                                    </h4>
                                    {!isPurchased && (
                                        <div className="flex items-center gap-1.5 grayscale opacity-40">
                                            <Lock className="w-2.5 h-2.5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Locked</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>
            </main>
        </div>
    );
}
