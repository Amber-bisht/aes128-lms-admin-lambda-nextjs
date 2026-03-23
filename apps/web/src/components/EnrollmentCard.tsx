"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Course } from "@/types";
import AuthModal from "./AuthModal";

interface EnrollmentCardProps {
    course: Course;
}

export default function EnrollmentCard({ course }: EnrollmentCardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

    const handleAction = async () => {
        if (status === "unauthenticated") {
            setShowAuthModal(true);
            return;
        }

        if (isPurchased) {
            router.push(`/${course.slug}/play`);
            return;
        }

        // Razorpay logic for non-paid users
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
                body: JSON.stringify({ courseId: course?.id })
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
            <div className="bg-white rounded-none shadow-2xl shadow-gray-200/50 p-4 border border-gray-100/50 flex flex-col group transition-all hover:shadow-3xl">
                {/* 1. Course Image */}
                <div className="aspect-[1.8/1] relative overflow-hidden rounded-none border border-gray-100/50">
                    <img
                        src={course.imageUrl || "/placeholder-course.jpg"}
                        alt={course.title}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    />
                </div>

                {/* 2. Content Section */}
                <div className="pt-10 pb-8 flex flex-col gap-8">
                    <div className="px-8 flex flex-col gap-8">
                        <div className="flex items-center gap-4 border-b border-gray-50 pb-8">
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-bold text-[#001B44] tracking-tight tabular-nums font-lato">₹{course.price}</span>
                                <span className="text-xl font-bold text-gray-400 tracking-tight line-through font-lato">₹8,999</span>
                            </div>
                            <div className="bg-emerald-50 text-emerald-500 px-3 py-1 rounded-full text-[12px] font-bold border border-emerald-100/30 whitespace-nowrap">
                                34% off
                            </div>
                        </div>
                    </div>

                    <div className="px-4">
                        <button
                            onClick={handleAction}
                            disabled={purchasing}
                            className="w-full bg-[#001030] text-white py-5 rounded-none font-bold text-lg text-center transition-all hover:bg-black hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-blue-900/10 flex items-center justify-center disabled:opacity-50"
                        >
                            {purchasing ? "Processing..." : isPurchased ? "Access Now" : "Enroll Now"}
                        </button>
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </>
    );
}
