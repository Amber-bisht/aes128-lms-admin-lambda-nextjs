
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
        return <div className="min-h-screen flex items-center justify-center text-gray-900">Course not found</div>;
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
        <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-100 font-sans pb-32 relative">
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-80 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />
            
            <div className="max-w-[1240px] mx-auto px-6 pt-8 relative z-10">
                {/* Breadcrumb */}


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
                    
                    {/* LEFT COLUMN: Content */}
                    <div className="lg:col-span-8 flex flex-col gap-16">
                        
                        {/* Title & Description Box */}
                        <div className="w-full border border-gray-100 rounded-none p-10 bg-white shadow-sm flex flex-col gap-8">
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-none tracking-tighter uppercase">
                                {course.title}
                            </h1>
                            <p className="text-lg text-gray-500 leading-relaxed font-medium">
                                {course.description}
                            </p>
                        </div>

                        {/* Instructor Box */}
                        <div className="w-full border border-gray-100 rounded-none p-10 bg-white shadow-sm flex flex-col sm:flex-row gap-10 items-start sm:items-center">
                            <div className="relative group">
                                <img 
                                    src="https://www.amberbisht.me/hero-profile.webp" 
                                    alt="Instructor"
                                    className="w-24 h-24 flex-shrink-0 rounded-none object-cover border border-gray-100 grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Instructor</p>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase tabular-nums">Amber Bisht</h3>
                                <p className="text-gray-500 leading-relaxed font-medium text-sm">
                                    Amber Bisht is a professional Software Developer specializing in building high-performance, scalable systems.
                                </p>
                            </div>
                        </div>

                        {/* Syllabus Box */}
                        <div>
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-tighter">Syllabus</h2>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{course.lectures?.length || 0} Modules</span>
                            </div>
                            <div className="border border-gray-100 rounded-none bg-white shadow-sm overflow-hidden flex flex-col">
                                {Object.entries(groupedLectures).map(([section, lectures], sIdx) => (
                                    <div key={section} className="border-b border-gray-50 last:border-b-0">
                                        <div className="p-6 bg-gray-50 flex items-center justify-between border-b border-gray-100">
                                            <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">
                                                {section}
                                            </h3>
                                            <ChevronDown className="w-4 h-4 text-gray-300" />
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {lectures.map((lecture, lIdx) => (
                                                <div key={lecture.id} className="p-8 flex flex-col md:flex-row md:items-center gap-8 hover:bg-gray-50 transition-all group">
                                                    <div className="w-10 h-10 flex-shrink-0 bg-white border border-gray-100 rounded-none flex items-center justify-center text-[10px] font-bold text-gray-300 group-hover:border-blue-100 group-hover:text-blue-600 transition-all">
                                                        {(lIdx + 1).toString().padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-bold text-gray-900 mb-2 uppercase group-hover:text-blue-600 transition-colors">{lecture.title}</h4>
                                                        {lecture.description && (
                                                            <div className="text-sm text-gray-400 line-clamp-2 font-medium">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {lecture.description}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-400 bg-gray-50 px-5 py-2.5 rounded-none border border-gray-100 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all">
                                                        <PlayCircle className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Preview</span>
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
                    <div className="lg:col-span-4 sticky top-32 flex flex-col gap-8">
                        
                        {/* Course Image */}
                        <div className="rounded-none overflow-hidden border border-gray-100 shadow-xl bg-white aspect-video relative group">
                            <img
                                src={course.imageUrl || "/placeholder-course.jpg"}
                                alt={course.title}
                                className="w-full h-full object-cover transition-all duration-500 opacity-90 group-hover:opacity-100"
                            />
                        </div>

                        {/* Price & Actions Card */}
                        <div className="border border-gray-100 bg-white rounded-none p-10 shadow-sm flex flex-col gap-10">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-4xl font-bold text-gray-900 tracking-tighter tabular-nums italic">₹{course.price}</span>
                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-none text-[8px] font-bold uppercase tracking-widest">Lifetime Access</div>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-gray-200" />)}
                                    <span className="text-[10px] font-bold ml-2 uppercase tracking-widest">5.0 (251)</span>
                                </div>
                            </div>

                            <Link
                                href={`/${course.slug}/play`}
                                className="w-full bg-gray-900 text-white py-5 rounded-none font-bold text-[10px] uppercase tracking-widest text-center transition-all hover:bg-blue-600 shadow-xl shadow-gray-100"
                            >
                                Enroll Now
                            </Link>

                            <div className="space-y-4">
                                {[
                                    "Professional engineering curriculum",
                                    "Lifetime access to all updates",
                                    "Community support and masterclass",
                                    "Official certificate of completion"
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                        <div className="w-4 h-4 bg-emerald-50 rounded-none flex items-center justify-center border border-emerald-100">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                        </div>
                                        {benefit}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Course Details Card */}
                        <div className="border border-gray-100 bg-white rounded-none p-8 shadow-sm">
                            <h3 className="text-[10px] font-bold text-gray-900 mb-8 uppercase tracking-widest">Specifications</h3>
                            <div className="space-y-6">
                                {[
                                    { label: "Duration", value: "40+ hours", icon: Clock },
                                    { label: "Complexity", value: "Professional", icon: Users },
                                    { label: "Language", value: "English", icon: PlayCircle }
                                ].map((detail, i) => (
                                    <div key={i} className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                                        <span className="text-gray-400 flex items-center gap-3"><detail.icon className="w-3.5 h-3.5 text-gray-300"/> {detail.label}</span>
                                        <span className="text-gray-900">{detail.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}

export const revalidate = 3600; // SSG fallback
