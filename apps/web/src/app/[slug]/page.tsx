
import { Suspense } from "react";
import Link from "next/link";
import { PlayCircle, Lock, Star, Users, Clock, ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Course, Lecture } from "@/types";

async function getCourse(slug: string): Promise<Course | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`, {
            next: { revalidate: 3600 }, // SSG: Revalidate every hour
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.warn(`Failed to fetch course ${slug} during build/runtime. API might be unreachable.`, error);
        return null;
    }
}

export async function generateStaticParams() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) return [];
        const courses = await res.json();
        return courses.map((course: any) => ({
            slug: course.slug,
        }));
    } catch (error) {
        console.warn("Failed to fetch courses for generateStaticParams during build. API might be unreachable.", error);
        return [];
    }
}

export default async function CourseLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const course = await getCourse(slug);

    if (!course) {
        return <div className="min-h-screen flex items-center justify-center text-white">Course not found</div>;
    }

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
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black font-sans pb-32">
            
            <div className="max-w-[1240px] mx-auto px-6 pt-24">
                {/* Breadcrumb */}
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-12 font-medium">
                    <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
                        <span>&larr;</span> Back to Home
                    </Link>
                    <span>•</span>
                    <span>Explore Courses</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
                    
                    {/* LEFT COLUMN: Content */}
                    <div className="lg:col-span-8 flex flex-col gap-12">
                        
                        {/* Title & Description */}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
                                {course.title}
                            </h1>
                            <p className="text-xl text-gray-400 leading-relaxed font-medium">
                                {course.description}
                            </p>
                        </div>

                        {/* Instructor Box */}
                        <div className="border border-white/10 rounded-2xl p-8 bg-[#111] flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                            <img 
                                src="https://www.amberbisht.me/hero-profile.webp" 
                                alt="Amber Bisht"
                                className="w-24 h-24 flex-shrink-0 rounded-full object-cover border-2 border-white/10 shadow-xl"
                            />
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white mb-3">Meet Your Instructor: Amber Bisht</h3>
                                <p className="text-gray-400 leading-relaxed font-medium">
                                    Amber Bisht is a seasoned Software Developer who has contributed extensively to multiple open-source projects. He is passionate about building scalable, real-world applications and empowering the next generation of engineers through hands-on, project-based learning.
                                </p>
                            </div>
                        </div>

                        {/* Syllabus Box */}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Course Syllabus</h2>
                            <div className="border border-white/10 rounded-2xl bg-[#111] overflow-hidden flex flex-col">
                                {Object.entries(groupedLectures).map(([section, lectures], sIdx) => (
                                    <div key={section} className="border-b border-white/10 last:border-b-0">
                                        <div className="p-6 bg-white/5 border-b border-white/5">
                                            <h3 className="text-lg font-bold text-blue-400">
                                                {section}
                                            </h3>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {lectures.map((lecture, lIdx) => (
                                                <div key={lecture.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-white/[0.02] transition-colors">
                                                    <div className="w-10 h-10 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-sm font-bold text-gray-400">
                                                        {(lIdx + 1).toString().padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-base font-bold text-white mb-2">{lecture.title}</h4>
                                                        {lecture.description && (
                                                            <div className="text-sm text-gray-500 line-clamp-2">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {lecture.description}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                                        <PlayCircle className="w-4 h-4" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Video</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Sticky Card */}
                    <div className="lg:col-span-4 sticky top-10 flex flex-col gap-6">
                        
                        {/* Course Image */}
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#111] aspect-video relative group">
                            <img
                                src={course.imageUrl || "/placeholder-course.jpg"}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                        </div>

                        {/* Price & Actions Card */}
                        <div className="border border-white/10 bg-[#111] rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <span className="text-4xl font-black text-white">₹{course.price}</span>
                                <div className="flex items-center gap-1.5 text-yellow-500">
                                    <Star className="w-4 h-4 fill-yellow-500" />
                                    <Star className="w-4 h-4 fill-yellow-500" />
                                    <Star className="w-4 h-4 fill-yellow-500" />
                                    <Star className="w-4 h-4 fill-yellow-500" />
                                    <Star className="w-4 h-4 fill-yellow-500" />
                                    <span className="text-gray-400 text-sm font-medium ml-1">5 (251 reviews)</span>
                                </div>
                            </div>

                            <Link
                                href={`/${course.slug}/play`}
                                className="w-full bg-white text-black py-4 rounded-xl font-black text-center transition-transform active:scale-95 hover:bg-gray-200"
                            >
                                View Course
                            </Link>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Full premium curriculum
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Lifetime access to updates
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium text-gray-300">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Community access
                                </div>
                            </div>
                        </div>

                        {/* Course Details Card */}
                        <div className="border border-white/10 bg-[#111] rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-6">Course Details</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4"/> Duration</span>
                                    <span className="text-white">40+ hours</span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-500 flex items-center gap-2"><Users className="w-4 h-4"/> Level</span>
                                    <span className="text-white">Beginner to Advanced</span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-500 flex items-center gap-2"><PlayCircle className="w-4 h-4"/> Language</span>
                                    <span className="text-white">English</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}

export const revalidate = 3600; // SSG fallback
