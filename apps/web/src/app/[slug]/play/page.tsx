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
        <div className="min-h-screen bg-white text-gray-900 flex flex-col italic font-sans selection:bg-blue-100">
            {/* Player Header */}
            <header className="h-20 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-10 flex items-center justify-between sticky top-0 z-50 shadow-sm shadow-gray-100/50">
                <div className="flex items-center gap-8">
                    <Link href={`/${course.slug}`} className="p-3 hover:bg-gray-50 rounded-2xl transition-all group border border-transparent hover:border-gray-200">
                        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </Link>
                    <div className="h-6 w-px bg-gray-100" />
                    <div className="flex flex-col">
                        <h1 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 leading-none">
                            {course.title}
                        </h1>
                        <p className="text-lg font-black uppercase tracking-tight text-gray-900 truncate max-w-md leading-none">
                            {activeLecture?.title || "Course Introduction"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {!isPurchased && (
                        <button
                            onClick={handleBuy}
                            disabled={purchasing}
                            className="bg-gray-900 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl shadow-gray-200"
                        >
                            {purchasing ? "Processing..." : `Secure Access — ₹${course.price}`}
                        </button>
                    )}
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                        <span className="text-[10px] font-black">{session?.user?.name?.[0]}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Background Mesh & Grid */}
                <div className="fixed inset-0 bg-gradient-mesh opacity-20 z-0 pointer-events-none" />
                <div className="fixed inset-0 bg-grid opacity-[0.01] z-0 pointer-events-none" />

                {/* Left: Video Player */}
                <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto p-10 md:p-16">
                        <div className="aspect-video bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.1)] relative mb-16 ring-8 ring-white">
                            {isPurchased ? (
                                activeLecture ? (
                                    <VideoPlayer
                                        src={((activeLecture as any).videoAsset?.videoUrl || activeLecture.videoUrl || "").replace('https://lms.amberbisht.s3.amazonaws.com/', 'https://s3.eu-west-1.amazonaws.com/lms.amberbisht/')}
                                        encryptionKey={(activeLecture as any).videoAsset?.encryptionKey || (activeLecture as any).encryptionKey || ""}
                                        iv={(activeLecture as any).videoAsset?.iv || (activeLecture as any).iv || ""}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                        <PlayCircle className="w-20 h-20 text-gray-100 mb-8" />
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Select a module to begin</p>
                                    </div>
                                )
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-white/80 backdrop-blur-3xl">
                                    <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center justify-center mb-10 shadow-inner">
                                        <Lock className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-4xl font-black mb-4 uppercase tracking-tighter text-gray-900">Module Encrypted</h3>
                                    <p className="text-gray-500 text-sm mb-12 max-w-xs font-medium italic">
                                        Unlock the full premium experience and join hundreds of other architectural masters.
                                    </p>
                                    <button
                                        onClick={handleBuy}
                                        className="bg-gray-900 text-white px-12 py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-gray-300 hover:scale-105 hover:bg-blue-600 transition-all"
                                    >
                                        Enroll Now — ₹{course.price}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="max-w-5xl space-y-12">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Lecture Deep Dive</p>
                            </div>
                            <div>
                                <h2 className="text-5xl font-black uppercase tracking-tighter mb-6 text-gray-900 leading-none">
                                    {activeLecture?.title || course.title}
                                </h2>
                                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-300">
                                    <span className="flex items-center gap-2"><PlayCircle className="w-4 h-4" /> HD Masters</span>
                                    <span className="flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Lifetime Access</span>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 w-full" />

                            {activeLecture?.description ? (
                                <div className="prose prose-blue max-w-none bg-white/50 backdrop-blur-sm p-12 rounded-[2.5rem] border border-gray-100 font-medium leading-relaxed italic text-gray-500 shadow-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {activeLecture.description}
                                    </ReactMarkdown>
                                </div>
                            ) : course.description && (
                                <p className="text-gray-400 font-medium leading-relaxed text-xl max-w-3xl italic">
                                    "{course.description}"
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Curriculum Index */}
                <aside className="w-[400px] border-l border-gray-100 bg-white/50 backdrop-blur-xl hidden lg:flex flex-col relative z-20">
                    <div className="p-10 border-b border-gray-100 bg-white/50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 mb-2">Curriculum</h3>
                        <p className="text-xl font-black uppercase tracking-tight text-gray-900">Knowledge Index</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
                        {Object.entries(groupedLectures).map(([section, lectures], sIdx) => (
                            <div key={section} className="space-y-6">
                                <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                    {section}
                                </h4>
                                <div className="space-y-4">
                                    {lectures.map((lecture, lIdx) => (
                                        <button
                                            key={lecture.id}
                                            disabled={!isPurchased}
                                            onClick={() => setActiveLecture(lecture)}
                                            className={`w-full p-5 rounded-[2rem] flex items-center gap-5 transition-all text-left group disabled:opacity-40 ${activeLecture?.id === lecture.id ? 'bg-white shadow-[0_15px_40px_-10px_rgba(37,99,235,0.15)] border border-blue-100' : 'hover:bg-white border border-transparent hover:border-gray-100'}`}
                                        >
                                            <div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all ${activeLecture?.id === lecture.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-gray-50 border border-gray-100 text-gray-400 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600'}`}>
                                                {(lIdx + 1).toString().padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-[11px] font-black uppercase tracking-tight truncate ${activeLecture?.id === lecture.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                                                    {lecture.title}
                                                </h4>
                                                {!isPurchased && (
                                                    <div className="flex items-center gap-1.5 opacity-50 mt-1">
                                                        <Lock className="w-2.5 h-2.5 text-gray-400" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Restricted</span>
                                                    </div>
                                                )}
                                            </div>
                                            {activeLecture?.id === lecture.id && (
                                                <div className="w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                            )}
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
