import Link from "next/link";
import { Star, Globe, Clock, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function getCourses(token?: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
            next: { revalidate: 3600 },
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
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-40">
            <div className="max-w-[1240px] mx-auto px-6">
                <div className="mb-20">
                    <h1 className="text-7xl font-black uppercase tracking-tighter mb-4 italic">All Curriculums</h1>
                    <p className="text-gray-500 text-lg font-medium max-w-2xl">
                        Deep dive into our comprehensive collection of engineering courses.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course: any) => {
                    const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

                    return (
                        <Link
                            key={course.id}
                            href={isPurchased ? `/${course.slug}/play` : `/${course.slug}`}
                            className="group bg-[#111] border border-white/5 rounded-none overflow-hidden transition-all hover:border-white/20 shadow-2xl p-4"
                        >
                            <div className="aspect-video overflow-hidden relative rounded-none border border-white/5">
                                <img
                                    src={course.imageUrl || "/placeholder-course.jpg"}
                                    alt={course.title}
                                    className="w-full h-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0 duration-500"
                                />
                            </div>

                            <div className="pt-8 flex flex-col gap-8">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight italic">
                                    {course.title}
                                </h3>
                                <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-black text-white">₹{course.price}</span>
                                        <span className="text-lg text-gray-500 line-through font-bold">₹{Math.round(course.price / 0.66)}</span>
                                    </div>
                                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                        34% off
                                    </span>
                                </div>

                                <div className="w-full py-4 bg-white text-black rounded-none font-black text-center text-sm uppercase tracking-widest group-hover:bg-gray-200 transition-all">
                                    {isPurchased ? "Access Now" : "Buy Now"}
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
