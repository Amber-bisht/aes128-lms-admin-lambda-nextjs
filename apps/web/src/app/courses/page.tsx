import Link from "next/link";
import { Star, Globe, Clock, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function getCourses(token?: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
            cache: "no-store",
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.warn("Failed to fetch courses during build/runtime.", error);
        return [];
    }
}

export default async function CoursesPage() {
    const session = await getServerSession(authOptions);
    const courses = await getCourses((session as any)?.appToken);

    return (
        <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden font-sans selection:bg-gray-900 selection:text-white pt-8 pb-40">
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-80 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />

            <div className="max-w-[1240px] mx-auto px-6 relative z-10 pt-4">
                <div className="mb-12 text-left">
                    <h1 className="text-5xl md:text-[6.5rem] font-black tracking-tighter leading-none mb-4 uppercase italic">
                        <span className="text-emerald-800">ALL</span> <span className="text-emerald-500 whitespace-nowrap">COURSES</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {courses.map((course: any) => {
                        const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';
                        const originalPrice = Math.round(course.price / 0.66);

                        return (
                            <Link
                                key={course.id}
                                href={isPurchased ? `/${course.slug}/play` : `/${course.slug}`}
                                className="group relative flex flex-col bg-white border border-gray-100 rounded-none overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-200/50 p-4"
                            >
                                <div className="aspect-video overflow-hidden relative rounded-none border border-gray-100/50 bg-gray-50">
                                    <img
                                        src={course.imageUrl || "/placeholder-course.jpg"}
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>

                                <div className="px-4 pb-4 flex flex-col flex-1">
                                    <h3 className="text-2xl font-bold text-[#001B44] mt-8 leading-tight uppercase font-outfit text-left italic">
                                        {course.title}
                                    </h3>

                                    <div className="mt-8 space-y-8">
                                        <div className="flex items-center gap-6 border-b border-gray-50 pb-8">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-4xl font-bold text-[#001B44] tracking-tight tabular-nums font-lato">₹{course.price}</span>
                                                <span className="text-xl font-bold text-gray-400 tracking-tight line-through font-lato">₹{originalPrice}</span>
                                            </div>
                                            <span className="bg-[#E7F9EE] text-[#00C853] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                                34% off
                                            </span>
                                        </div>

                                        <div className="w-full py-5 bg-[#001B44] text-white rounded-none font-bold text-center group-hover:bg-[#002866] transition-colors text-lg uppercase tracking-widest">
                                            {isPurchased ? "Access Now" : "Enroll Now"}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export const revalidate = 3600;
