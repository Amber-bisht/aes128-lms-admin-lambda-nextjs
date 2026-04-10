import Link from "next/link";
import { Youtube, Twitter, Instagram, Linkedin } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import HeroSection from "@/components/HeroSection";
import CourseGrid from "@/components/CourseGrid";
import Philosophy from "@/components/Philosophy";

async function getCourses(token?: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
      cache: "no-store",
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.warn("Failed to fetch courses during build/runtime.", error);
    return [];
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const courses = await getCourses((session as any)?.appToken);

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden font-sans selection:bg-gray-900 selection:text-white">

      {/* Background Mesh & Grid */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-80 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-grid opacity-100 z-0 pointer-events-none" />

      <main className="relative z-10">
        <HeroSection />

        {/* Courses Section */}
        <section id="courses" className="max-w-[1240px] mx-auto px-6 py-16">
          <CourseGrid courses={courses} session={session} />
        </section>

        {/* Philosophy Section */}
        <Philosophy />
      </main>
      {/* Footer */}
      <footer className="relative pt-40 pb-20 bg-black text-white overflow-hidden border-t border-white/10 uppercase">
        {/* Background Text Effect - AMBERBISHT */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-full text-center select-none pointer-events-none z-0 px-4">
          <div className="text-[12vw] font-black tracking-tighter text-white/[0.06] leading-none uppercase italic">
            Amberbisht
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-2">
              <Link href="/" className="inline-block font-black text-4xl tracking-tighter mb-8 italic text-white flex items-center gap-1 group">
                lms.<span className="text-amber-500 group-hover:text-amber-400 transition-colors">amberbisht</span>
              </Link>
              <p className="text-gray-400 max-w-sm font-medium leading-relaxed normal-case">
                Building the next generation of 100x developers. Quality content, architectural patterns, and real-world impact.
              </p>
            </div>

            <div className="space-y-8">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Company</h3>
              <nav className="flex flex-col gap-5">
                <Link href="#" className="text-[12px] font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest leading-none">Terms & Conditions</Link>
                <Link href="#" className="text-[12px] font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest leading-none">Privacy Policy</Link>
                <Link href="#" className="text-[12px] font-bold text-gray-400 hover:text-white transition-all uppercase tracking-widest leading-none">Refund & Cancellation</Link>
              </nav>
            </div>

            <div className="space-y-10 flex flex-col md:items-end">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                  <Youtube className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                  <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                  <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer group">
                  <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center md:text-right">
                © 2026 lms.amberbisht. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
