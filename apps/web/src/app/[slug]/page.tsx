
import { Suspense } from "react";
import { PlayCircle, Lock, Star, Users, Clock, ChevronRight, ChevronDown, CheckCircle2 } from "lucide-react";
import { Course, Lecture } from "@/types";
import SyllabusAccordion from "@/components/SyllabusAccordion";
import EnrollmentCard from "@/components/EnrollmentCard";

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

            <div className="max-w-[1240px] mx-auto px-6 pt-0 relative z-10">
                {/* Breadcrumb */}


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative">

                    {/* LEFT COLUMN: Content */}
                    <div className="lg:col-span-8 flex flex-col gap-4">

                        {/* Title & Description Box */}
                        <div className="w-full flex flex-col gap-8 py-10 pr-10 pl-0">
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-none tracking-tighter uppercase">
                                {course.title}
                            </h1>
                            <p className="text-lg text-gray-500 leading-relaxed font-medium">
                                {course.description}
                            </p>
                        </div>

                        {/* Instructor Box */}
                        <div className="w-full border-t border-gray-100 flex flex-col sm:flex-row gap-10 items-start sm:items-center py-10 pr-10 pl-0">
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
                            </div>
                            <SyllabusAccordion groupedLectures={groupedLectures} course={course} />
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Sticky Card */}
                    <div className="lg:col-span-4 sticky top-28 mt-10">
                        <EnrollmentCard course={course} />
                    </div>

                </div>
            </div>
        </div>
    );
}

export const revalidate = 3600; // SSG fallback
