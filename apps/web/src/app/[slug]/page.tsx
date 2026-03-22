
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
        <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-100 italic font-sans pb-32 relative">
            {/* Background Mesh & Grid */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-40 z-0 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-[0.02] z-0 pointer-events-none" />
            
            <div className="max-w-[1240px] mx-auto px-6 pt-24 relative z-10">
                {/* Breadcrumb */}
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12">
                    <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-2">
                        <span>&larr;</span> Back to Home
                    </Link>
                    <span>•</span>
                    <span className="text-gray-300">Explore Courses</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">
                    
                    {/* LEFT COLUMN: Content */}
                    <div className="lg:col-span-8 flex flex-col gap-16">
                        
                        {/* Title & Description */}
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="h-1 w-8 bg-blue-600 rounded-full" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Premium Curriculum</p>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-none tracking-tighter uppercase">
                                {course.title}
                            </h1>
                            <p className="text-xl text-gray-500 leading-relaxed font-medium max-w-2xl italic">
                                "{course.description}"
                            </p>
                        </div>

                        {/* Instructor Box */}
                        <div className="border border-gray-100 rounded-[3rem] p-10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row gap-10 items-start sm:items-center">
                            <div className="relative group">
                                <img 
                                    src="https://www.amberbisht.me/hero-profile.webp" 
                                    alt="Amber Bisht"
                                    className="w-28 h-28 flex-shrink-0 rounded-[2rem] object-cover border-4 border-white shadow-xl grayscale group-hover:grayscale-0 transition-all duration-700"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-lg shadow-lg">
                                    <Star className="w-4 h-4 fill-current" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Lead Instructor</p>
                                <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tabular-nums">Amber Bisht</h3>
                                <p className="text-gray-500 leading-relaxed font-medium text-sm italic">
                                    Amber Bisht is a seasoned Software Developer who has contributed extensively to multiple open-source projects. He is passionate about building scalable, architectural systems.
                                </p>
                            </div>
                        </div>

                        {/* Syllabus Box */}
                        <div>
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Curriculum <span className="text-blue-600">Vault</span></h2>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{course.lectures?.length || 0} Modules</span>
                            </div>
                            <div className="border border-gray-100 rounded-[3.5rem] bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                                {Object.entries(groupedLectures).map(([section, lectures], sIdx) => (
                                    <div key={section} className="border-b border-gray-50 last:border-b-0">
                                        <div className="p-8 bg-gray-50/50 backdrop-blur-sm flex items-center justify-between border-b border-gray-100">
                                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                                                {section}
                                            </h3>
                                            <ChevronDown className="w-4 h-4 text-gray-300" />
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {lectures.map((lecture, lIdx) => (
                                                <div key={lecture.id} className="p-8 flex flex-col md:flex-row md:items-center gap-8 hover:bg-blue-50/30 transition-all group">
                                                    <div className="w-12 h-12 flex-shrink-0 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-xs font-black text-gray-300 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                                        {(lIdx + 1).toString().padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-lg font-black text-gray-900 mb-2 uppercase group-hover:text-blue-600 transition-colors">{lecture.title}</h4>
                                                        {lecture.description && (
                                                            <div className="text-sm text-gray-400 line-clamp-2 italic font-medium">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {lecture.description}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-300 bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                                                        <PlayCircle className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Stream</span>
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
                        <div className="rounded-[3rem] overflow-hidden border border-gray-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] bg-white aspect-video relative group">
                            <img
                                src={course.imageUrl || "/placeholder-course.jpg"}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Price & Actions Card */}
                        <div className="border border-gray-100 bg-white rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col gap-10">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-5xl font-black text-gray-900 tracking-tighter tabular-nums italic">₹{course.price}</span>
                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Lifetime Access</div>
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50/50 w-fit px-3 py-1 rounded-lg border border-amber-100">
                                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                                    <span className="text-gray-400 text-[10px] font-black ml-2 uppercase tracking-widest">5.0 (251)</span>
                                </div>
                            </div>

                            <Link
                                href={`/${course.slug}/play`}
                                className="w-full bg-gray-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-center transition-all active:scale-95 hover:bg-blue-600 shadow-2xl shadow-gray-200 hover:shadow-blue-500/20"
                            >
                                Secure My Access
                            </Link>

                            <div className="space-y-4">
                                {[
                                    "Premium architectural curriculum",
                                    "Lifetime access to all updates",
                                    "Direct community masterclass",
                                    "Certificate of completion"
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                        <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        {benefit}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Course Details Card */}
                        <div className="border border-gray-100 bg-white rounded-[2.5rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                            <h3 className="text-xs font-black text-gray-900 mb-8 uppercase tracking-widest">Specifications</h3>
                            <div className="space-y-6">
                                {[
                                    { label: "Duration", value: "40+ hours", icon: Clock },
                                    { label: "Complexity", value: "Junior to Senior", icon: Users },
                                    { label: "Instruction", value: "English (US)", icon: PlayCircle }
                                ].map((detail, i) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-gray-300 flex items-center gap-3"><detail.icon className="w-4 h-4 text-blue-600"/> {detail.label}</span>
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
