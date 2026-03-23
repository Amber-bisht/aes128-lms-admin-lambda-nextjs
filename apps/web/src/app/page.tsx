import Link from "next/link";
import { Youtube, Twitter, Instagram, Linkedin, ArrowRight, Star, Globe, Clock, ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-[1240px] mx-auto px-6 pt-12 pb-16">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-16 lg:gap-32">
            {/* Left Column: Text Content */}
            <div className="flex-1 max-w-2xl">
              <h1 className="text-5xl md:text-[6.5rem] font-black tracking-tighter leading-[0.85] mb-12 uppercase">
                <span className="text-emerald-800">Become a</span><br />
                <span className="text-emerald-500 whitespace-nowrap">100x dev</span><br />
                <span className="text-teal-600">with</span> <br />
                <span className="text-green-400">Amber Bisht</span>
              </h1>

              <p className="text-xl text-gray-600 max-w-xl font-medium leading-[1.6] mb-12">
                The only platform designed for engineers who want to build high-scale products,
                master architectural patterns, and grow their impact.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link href="/courses" className="bg-gray-900 text-white px-12 py-6 rounded-none text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-4 group shadow-2xl shadow-gray-200">
                  Explore Curriculum
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

              </div>
            </div>

            {/* Right Column: Code Window */}
            <div className="flex-1 w-full max-w-2xl hidden lg:block perspective-1000 lg:pt-20 lg:pl-10">
              <div className="relative group transform rotate-2 hover:rotate-0 transition-all duration-700">
                {/* Decorative Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                {/* Window Frame */}
                <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
                  {/* Title Bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm"></div>
                    </div>
                    <div className="text-[10px] font-medium text-zinc-500 tracking-wide text-right flex-1 lowercase">
                      src/core/app.ts
                    </div>
                  </div>

                  {/* Code Content */}
                  <div className="p-8 font-mono text-sm leading-relaxed text-zinc-400">
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">1</span>
                      <p><span className="text-zinc-500">interface</span> <span className="text-zinc-300">SystemConfig</span> {'{'}</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">2</span>
                      <p className="pl-4"><span className="text-zinc-400">shards:</span> <span className="text-zinc-400">number</span>;</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">3</span>
                      <p className="pl-4"><span className="text-zinc-400">replication:</span> <span className="text-zinc-400">boolean</span>;</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">4</span>
                      <p className="pl-4"><span className="text-zinc-400">region:</span> <span className="text-zinc-500">'global'</span> | <span className="text-zinc-500">'local'</span>;</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">5</span>
                      <p>{'}'}</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">6</span>
                      <p></p>
                    </div>
                    <div className="flex gap-4 text-[10px] leading-none mb-1">
                      <span className="text-zinc-700 select-none">7</span>
                      <p className="text-zinc-600 italic">{'//'} Peak Performance Optimizations</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">8</span>
                      <p><span className="text-zinc-500">function</span> <span className="text-zinc-400">optimizeScaling</span>(infra: <span className="text-zinc-300">SystemConfig</span>) {'{'}</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">9</span>
                      <p className="pl-4"><span className="text-zinc-500">return</span> infra.<span className="text-zinc-400">shards</span> === <span className="text-zinc-400">128</span> ?</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">10</span>
                      <p className="pl-8 text-zinc-500">'100_ready' : 'scaling';</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">11</span>
                      <p>{'}'}</p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">12</span>
                      <p></p>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-zinc-700 select-none">13</span>
                      <p><span className="text-zinc-500">const</span> <span className="text-zinc-400">result</span> = <span className="text-zinc-400">optimize</span>({'{'} <span className="text-zinc-400">shards:</span> <span className="text-zinc-400">128</span> {'}'});</p>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="px-6 py-2 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center text-[10px] font-medium text-zinc-600 tracking-widest">
                    <div>LMS Core v1.0</div>
                    <div>UTF-8</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="max-w-[1240px] mx-auto px-6 py-16">
          <h2 className="text-4xl font-bold text-[#001B44] mb-16 tracking-tight">Featured Cohorts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map((course: any) => {
              const originalPrice = Math.round(course.price / 0.66);
              const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

              return (
                <Link
                  key={course.id}
                  href={isPurchased ? `/${course.slug}/play` : `/${course.slug}`}
                  className="group relative flex flex-col bg-white border border-gray-100 rounded-none overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-200/50 p-4"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden rounded-none mb-6 border border-gray-100/50">
                    <img
                      src={course.imageUrl || "https://www.amberbisht.me/hero-profile.webp"}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-4 flex flex-col flex-1">
                    <h3 className="text-2xl font-bold text-[#001B44] mt-6 leading-tight uppercase font-outfit text-left">
                      {course.title}
                    </h3>
                    <div className="mt-8 space-y-8">
                      <div className="flex items-center gap-6 border-b border-gray-50 pb-8">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-bold text-[#001B44]">₹{course.price.toLocaleString()}</span>
                          <span className="text-xl text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
                        </div>
                        <span className="bg-[#E7F9EE] text-[#00C853] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                          34% off
                        </span>
                      </div>

                      {/* Action Button */}
                      <div className="w-full py-5 bg-[#001B44] text-white rounded-none font-bold text-center group-hover:bg-[#002866] transition-colors text-lg uppercase tracking-widest">
                        {isPurchased ? "Access Now" : "Enroll Now"}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Philosophy Section - Tutorial Hell */}
        <section className="max-w-[1240px] mx-auto px-6 py-24 border-t border-gray-100">
          <div className="max-w-4xl">
            <h2 className="text-6xl font-black text-[#001B44] tracking-tighter uppercase mb-8 leading-[0.9]">
              Stuck in <br />
              <span className="text-emerald-500 italic">"Tutorial Hell"?</span>
            </h2>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
              Most courses teach you syntax. They show you how to build a to-do list app on localhost.
              <span className="text-gray-900 block mt-4 font-bold">Real engineering happens when things break at scale.</span>
            </p>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="relative pt-40 pb-20 bg-black text-white overflow-hidden border-t border-white/10 uppercase">
        {/* Background Text Effect - AMBERBISHT */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-full text-center select-none pointer-events-none z-0 px-4">
          <h1 className="text-[12vw] font-black tracking-tighter text-white/[0.06] leading-none uppercase italic">
            Amberbisht
          </h1>
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
              <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Company</h4>
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
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center md:text-right">
                © 2026 lms.amberbisht. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
