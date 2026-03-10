
import { Suspense } from "react";
import Link from "next/link";
import { PlayCircle, Lock, Star, Users, Clock, ChevronRight } from "lucide-react";

async function getCourse(slug: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`, {
        next: { revalidate: 3600 } // SSG: Revalidate every hour
    });
    if (!res.ok) return null;
    return res.json();
}

export async function generateStaticParams() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`);
    const courses = await res.json();
    return courses.map((course: any) => ({
        slug: course.slug,
    }));
}

export default async function CourseLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const course = await getCourse(slug);

    if (!course) {
        return <div className="min-h-screen flex items-center justify-center text-white">Course not found</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">

                            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
                                {course.title}
                            </h1>

                            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-xl">
                                {course.description}
                            </p>


                            <div className="flex items-center gap-6 pt-4">
                                <Link
                                    href={`/${course.slug}/play`}
                                    className="bg-white text-black px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all transform active:scale-95 shadow-xl shadow-white/5"
                                >
                                    Eroll Now — ₹{course.price}
                                </Link>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Permanent Access</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-x-0 -bottom-10 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
                            <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
                                <img
                                    src={course.imageUrl || "/placeholder-course.jpg"}
                                    alt={course.title}
                                    className="w-full aspect-[4/5] object-cover grayscale-[0.2] transition-all group-hover:grayscale-0 group-hover:scale-105 duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Curriculum Section */}
            <section className="py-32 bg-black">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Curriculum</p>
                            <h2 className="text-5xl font-black uppercase tracking-tighter">What you'll master</h2>
                        </div>
                        <p className="text-gray-400 font-medium max-w-sm mb-2 text-sm leading-relaxed">
                            A carefully curated flow designed to take you from absolute zero to architectural mastery.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-w-3xl">
                        {course.lectures?.map((lecture: any, index: number) => (
                            <div
                                key={lecture.id}
                                className="group flex items-center gap-8 p-8 bg-white/5 border border-white/5 rounded-3xl hover:border-white/20 transition-all"
                            >
                                <span className="text-4xl font-black text-white/10 group-hover:text-white/40 transition-colors w-12">
                                    {(index + 1).toString().padStart(2, '0')}
                                </span>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black uppercase tracking-tight mb-1">{lecture.title}</h4>
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-3 h-3 text-gray-500" />
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-40 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl z-0" />
                <div className="relative z-10 max-w-2xl mx-auto px-6">
                    <h2 className="text-6xl font-black uppercase tracking-tighter mb-8 leading-none">
                        Ready to level code?
                    </h2>
                    <p className="text-gray-400 mb-12 font-medium text-lg">
                        Master engineering patterns and build products that users actually love.
                    </p>
                    <Link
                        href={`/${course.slug}/play`}
                        className="inline-block bg-white text-black px-16 py-6 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
                    >
                        Enroll Now for ₹{course.price}
                    </Link>
                </div>
            </section>
        </div>
    );
}

export const revalidate = 3600; // SSG fallback
