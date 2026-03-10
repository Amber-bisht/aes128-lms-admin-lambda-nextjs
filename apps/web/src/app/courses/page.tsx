
import Link from "next/link";
import { Star, Globe, Clock, ChevronRight } from "lucide-react";

async function getCourses() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.warn("Failed to fetch courses during build/runtime.", error);
        return [];
    }
}

export default async function CoursesPage() {
    const courses = await getCourses();

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
                    {courses.map((course: any) => (
                        <Link
                            key={course.id}
                            href={`/${course.slug}`}
                            className="group bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all hover:border-white/20 shadow-2xl"
                        >
                            <div className="aspect-video overflow-hidden relative">
                                <img
                                    src={course.imageUrl || "/placeholder-course.jpg"}
                                    alt={course.title}
                                    className="w-full h-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0 duration-500"
                                />
                            </div>

                            <div className="p-8">
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-blue-500 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-gray-500 text-sm font-medium line-clamp-2 mb-6 italic opacity-70">
                                    {course.description}
                                </p>

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Price</p>
                                        <p className="text-xl font-black">₹{course.price}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export const revalidate = 3600;
