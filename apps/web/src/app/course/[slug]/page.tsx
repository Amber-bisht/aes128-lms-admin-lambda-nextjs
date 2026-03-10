
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import VideoPlayer from "@/components/VideoPlayer";
import { PlayCircle, Lock, Loader2 } from "lucide-react";

export default function CoursePlayer() {
    const { slug } = useParams();
    const { data: session } = useSession();
    const [course, setCourse] = useState<any>(null);
    const [activeLecture, setActiveLecture] = useState<any>(null);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
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
    }, [slug, session]);

    const handleBuy = async () => {
        if (!session) return;
        setPurchasing(true);

        try {
            // 1. Create Order
            const orderRes = await fetch(`${process.env.NEXT_PUBLIC_STUDENT_API_URL}/payments/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any).appToken}`
                },
                body: JSON.stringify({ courseId: course.id })
            });
            const order = await orderRes.json();

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_5499292544", // Fallback for testing
                amount: order.amount,
                currency: "INR",
                name: "lms.amberbisht",
                description: `Enroll in ${course.title}`,
                order_id: order.id,
                handler: async (response: any) => {
                    // 3. Verify Payment
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
                        // Refresh to unlock content
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

    if (!course) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    );

    const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    <div className="aspect-video bg-black/40 rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl shadow-black/50">
                        {isPurchased ? (
                            activeLecture ? (
                                <VideoPlayer
                                    src={activeLecture.videoUrl || ""}
                                    encryptionKey={activeLecture.encryptionKey || ""}
                                    iv={activeLecture.iv || ""}
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-12">
                                    <PlayCircle className="w-16 h-16 text-white/10 mb-6" />
                                    <p className="text-gray-500 font-medium italic">Select a lecture to start your premium journey.</p>
                                </div>
                            )
                        ) : (
                            /* Paywall Overlay */
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-12 backdrop-blur-3xl bg-black/60">
                                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-10">
                                    <Lock className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-4xl font-black mb-4 uppercase tracking-tighter text-white">Unlock Your Full Potential</h3>
                                <p className="text-gray-400 text-lg mb-12 max-w-md font-medium leading-relaxed">
                                    Gain permanent access to the complete <span className="text-white">"{course.title}"</span> curriculum and master your craft.
                                </p>

                                <button
                                    onClick={handleBuy}
                                    disabled={purchasing}
                                    className="group relative bg-white text-black px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10 disabled:opacity-50"
                                >
                                    {purchasing ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span>Enroll Now — ₹{course.price}</span>
                                        </div>
                                    )}
                                </button>

                                <div className="mt-12 flex items-center gap-8 grayscale opacity-40">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Secure Payment by Razorpay</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest text-white/50">Premium Curriculum</span>
                            {!isPurchased && <span className="text-[10px] font-black bg-white text-black px-3 py-1 rounded-full uppercase tracking-widest">Locked</span>}
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tight text-white mb-6">
                            {activeLecture ? activeLecture.title : course.title}
                        </h2>
                        <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-2xl">
                            {activeLecture?.description || course.description}
                        </p>
                    </div>
                </div>

                <div className="border border-white/10 bg-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl shadow-black/20">
                    <div className="p-8 border-b border-white/10 bg-white/5">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Coming Next</h3>
                        <p className="text-lg font-black uppercase tracking-tight text-white">Curriculum Flow</p>
                    </div>
                    <div className="divide-y divide-white/5 overflow-y-auto custom-scrollbar">
                        {course.lectures.map((lecture: any, index: number) => (
                            <button
                                key={lecture.id}
                                disabled={!isPurchased}
                                onClick={() => setActiveLecture(lecture)}
                                className={`w-full p-8 flex items-center gap-6 hover:bg-white/5 transition-all text-left group disabled:opacity-40 disabled:grayscale ${activeLecture?.id === lecture.id ? 'bg-white text-black hover:bg-white' : ''}`}
                            >
                                <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xs font-black transition-all ${activeLecture?.id === lecture.id ? 'bg-black text-white' : 'bg-white/5 border border-white/10 text-gray-500 group-hover:bg-white group-hover:text-black'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-black uppercase tracking-tight mb-1 truncate ${activeLecture?.id === lecture.id ? 'text-black' : 'text-white'}`}>
                                        {lecture.title}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {!isPurchased && <Lock className="w-3 h-3 text-gray-600" />}
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${activeLecture?.id === lecture.id ? 'text-black/40' : 'text-gray-600'}`}>
                                            {isPurchased ? 'Unlocked' : 'Locked Content'}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
