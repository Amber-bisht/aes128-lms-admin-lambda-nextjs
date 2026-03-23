"use client";

import { useState } from "react";
import { ChevronDown, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lecture, Course } from "@/types";
import AuthModal from "./AuthModal";

interface SyllabusAccordionProps {
    groupedLectures: Record<string, Lecture[]>;
    course: Course;
}

export default function SyllabusAccordion({ groupedLectures, course }: SyllabusAccordionProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
        // Default only the first section to be open
        const initial: Record<string, boolean> = {};
        const firstSection = Object.keys(groupedLectures)[0];
        if (firstSection) initial[firstSection] = true;
        return initial;
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleAction = async () => {
        if (status === "unauthenticated") {
            setShowAuthModal(true);
            return;
        }

        if (isPurchased) {
            router.push(`/${course.slug}/play`);
            return;
        }

        handleBuy();
    };

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

            if (!orderRes.ok) throw new Error("Failed to create order");
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
                theme: { color: "#ffffff" },
                prefill: {
                    email: session.user?.email || "",
                    contact: "9999999999"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            alert("Payment failed to initialize. Please try again.");
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <>
            <div className="border border-gray-100 rounded-none bg-white shadow-sm overflow-hidden flex flex-col">
                {Object.entries(groupedLectures).map(([section, lectures], sIdx) => {
                    const isOpen = openSections[section];
                    
                    return (
                        <div key={section} className="border-b border-gray-50 last:border-b-0">
                            {/* Section Header */}
                            <button 
                                onClick={() => toggleSection(section)}
                                className="w-full p-6 bg-gray-50 flex items-center justify-between border-b border-gray-100 hover:bg-gray-100/50 transition-colors"
                            >
                                <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">
                                    {section}
                                </h3>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Lectures List with Animation */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="divide-y divide-gray-50">
                                            {lectures.map((lecture, lIdx) => (
                                                <div key={lecture.id} className="p-8 flex flex-col md:flex-row md:items-center gap-8 hover:bg-gray-50 transition-all group">
                                                    <div className="w-10 h-10 flex-shrink-0 bg-white border border-gray-100 rounded-none flex items-center justify-center text-[10px] font-bold text-gray-400 transition-all">
                                                        {(lIdx + 1).toString().padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-bold text-gray-900 mb-2 uppercase transition-colors">{lecture.title}</h4>
                                                        {lecture.description && (
                                                            <div className="text-sm text-gray-500 line-clamp-2 font-medium">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {lecture.description}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={handleAction}
                                                        disabled={purchasing}
                                                        className="flex items-center gap-3 text-gray-900 bg-gray-50 px-5 py-2.5 rounded-none border border-gray-100 transition-all hover:bg-gray-900 hover:text-white group-hover:border-gray-900 disabled:opacity-50"
                                                    >
                                                        <PlayCircle className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold">{purchasing ? "Processing..." : "Watch"}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <AuthModal 
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </>
    );
}
