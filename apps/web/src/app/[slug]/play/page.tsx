"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import VideoPlayer from "@/components/VideoPlayer";
import { PlayCircle, Lock, Loader2, ChevronLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Course, Lecture } from "@/types";

export default function CoursePlayerPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
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
                body: JSON.stringify({ courseId: course?.id })
            });
            const order = await orderRes.json();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_5499292544",
                amount: order.amount,
                currency: "INR",
                name: "lms.amberbisht",
                description: `Enroll in ${course?.title}`,
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
                            courseId: course?.id
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
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600/20" />
        </div>
    );

    const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

    // Grouping logic for sections
    const groupedLectures: Record<string, Lecture[]> = {};
    course.lectures?.forEach((lecture) => {
        const section = lecture.section || "Curriculum";
        if (!groupedLectures[section]) {
            groupedLectures[section] = [];
        }
        groupedLectures[section].push(lecture);
    });

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100">
            {/* Player Header */}
            <header className="h-20 border-b border-gray-100 bg-white/60 backdrop-blur-2xl px-10 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-10">
                    <Link href="/" className="font-bold text-xl tracking-tight text-gray-900 leading-none">
                        lms.<span className="text-amber-500">amberbisht</span>
                    </Link>
                    <div className="h-6 w-px bg-gray-100" />
                    <Link href={`/${course.slug}`} className="p-2 hover:bg-gray-50 rounded-none transition-all group">
                        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 leading-none">
                            {course.title}
                        </h1>
                        <p className="text-lg font-bold uppercase tracking-tight text-gray-900 truncate max-w-md leading-none">
                            {activeLecture?.title || "Overview"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {!isPurchased && (
                        <button
                            onClick={handleBuy}
                            disabled={purchasing}
                            className="bg-gray-900 text-white px-8 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl shadow-gray-100"
                        >
                            {purchasing ? "Processing..." : `Enroll — ₹${course.price}`}
                        </button>
                    )}
                    <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-none flex items-center justify-center border border-gray-100">
                        <span className="text-[10px] font-bold uppercase tracking-widest">{session?.user?.name?.[0]}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Background Mesh & Grid */}
                <div className="fixed inset-0 bg-gradient-mesh opacity-80 z-0 pointer-events-none" />
                <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />

                {/* Left: Video Player */}
                <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto p-10 md:p-16">
                        <div className="aspect-video bg-gray-50 rounded-none overflow-hidden border border-gray-100 shadow-2xl relative mb-16 ring-1 ring-gray-100">
                            {isPurchased ? (
                                activeLecture ? (
                                    <VideoPlayer
                                        src={((activeLecture as any).videoAsset?.videoUrl || activeLecture.videoUrl || "").replace('https://lms.amberbisht.s3.amazonaws.com/', 'https://s3.eu-west-1.amazonaws.com/lms.amberbisht/')}
                                        encryptionKey={(activeLecture as any).videoAsset?.encryptionKey || (activeLecture as any).encryptionKey || ""}
                                        iv={(activeLecture as any).videoAsset?.iv || (activeLecture as any).iv || ""}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                        <PlayCircle className="w-16 h-16 text-gray-100 mb-8" />
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Select a module to begin</p>
                                    </div>
                                )
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-white/95 backdrop-blur-sm">
                                    <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-none flex items-center justify-center mb-10">
                                        <Lock className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4 uppercase tracking-tighter text-gray-900">Enrollment Required</h3>
                                    <p className="text-gray-500 text-sm mb-12 max-w-xs font-medium">
                                        Please enroll in the course to access this professional lecture.
                                    </p>
                                    <button
                                        onClick={handleBuy}
                                        className="bg-gray-900 text-white px-10 py-5 rounded-none text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-gray-100 hover:bg-blue-600 transition-all"
                                    >
                                        Enroll Now — ₹{course.price}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="max-w-5xl space-y-12">
                            <div>
                                <h2 className="text-5xl font-bold uppercase tracking-tighter mb-6 text-gray-900 leading-none">
                                    {activeLecture?.title || course.title}
                                </h2>
                            </div>

                            <div className="h-px bg-gray-100 w-full" />

                            {activeLecture?.description ? (
                                <div className="prose prose-blue max-w-none bg-white p-12 border border-gray-100 font-medium leading-relaxed text-gray-600 shadow-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {activeLecture.description}
                                    </ReactMarkdown>
                                </div>
                            ) : course.description && (
                                <p className="text-gray-400 font-medium leading-relaxed text-xl max-w-3xl">
                                    {course.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Curriculum Index */}
                <aside className="w-[380px] border-l border-gray-100 bg-white hidden lg:flex flex-col relative z-20">
                    <div className="p-8 border-b border-gray-100">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Curriculum</h3>
                        <p className="text-xl font-bold uppercase tracking-tight text-gray-900">Course Index</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-10">
                        {Object.entries(groupedLectures).map(([section, lectures], sIdx) => (
                            <div key={section} className="space-y-6">
                                <div className="px-3">
                                    <div className="flex items-start gap-4 mb-2">
                                        <span className="text-xl font-bold text-gray-900 leading-none">
                                            {(sIdx + 1).toString().padStart(2, '0')}
                                        </span>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight leading-tight">
                                            {section}
                                        </h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-10">
                                        {lectures.length} {lectures.length === 1 ? 'Lesson' : 'Lessons'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    {lectures.map((lecture, lIdx) => (
                                        <button
                                            key={lecture.id}
                                            disabled={!isPurchased}
                                            onClick={() => setActiveLecture(lecture)}
                                            className={`w-full py-4 px-3 rounded-none flex items-center gap-4 transition-all text-left group disabled:opacity-40 ${activeLecture?.id === lecture.id ? 'bg-gray-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                                        >
                                            <div className="w-6 flex-shrink-0 flex items-center justify-center">
                                                <PlayCircle className={`w-4 h-4 ${activeLecture?.id === lecture.id ? 'text-blue-600' : 'text-gray-300 group-hover:text-blue-600'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-[11px] font-bold uppercase tracking-tight truncate ${activeLecture?.id === lecture.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                                    {lecture.title}
                                                </h4>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </main>
        </div>
    );
}
