
import Link from "next/link";
import { Youtube, Twitter, Instagram, Linkedin, ArrowRight, Star, Globe, Clock, ChevronRight } from "lucide-react";

async function getCourses() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
    next: { revalidate: 3600 } // SSG: Revalidate every hour
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function Home() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-white selection:text-black">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] bg-purple-500/10 blur-[150px] rounded-full z-0" />

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-[1240px] mx-auto px-6 pt-32 pb-40">
          <div className="max-w-4xl">

            <h1 className="text-7xl md:text-[6rem] font-black tracking-tighter leading-[0.85] mb-10 uppercase transition-all">
              Become a <span className="text-gray-500">100x dev</span><br />
              Without <span className="text-blue-500">Selling</span><br />
              Your <span className="text-purple-500">Soul</span>
            </h1>

            <p className="text-xl text-gray-500 max-w-2xl font-medium leading-[1.4] mb-12">
              The only platform designed for engineers who want to build high-scale products,
              master architectural patterns, and grow their impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link href="#courses" className="bg-white text-black px-12 py-6 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-4 group shadow-xl shadow-white/5">
                Explore Curriculum
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="max-w-[1240px] mx-auto px-6 py-40 border-t border-white/5">
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-1 w-12 bg-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Explore Our Best Courses</p>
            </div>
            <h2 className="text-6xl font-black uppercase tracking-tighter mb-4">
              Choose Your Path To <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Success</span>
            </h2>
            <p className="text-gray-500 text-lg font-medium max-w-2xl">
              Transform your career with mentor-led coding courses, crafted by industry experts who've built products used by millions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course: any) => (
              <Link
                key={course.id}
                href={`/${course.slug}`}
                className="group relative flex flex-col bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all hover:border-white/20 hover:-translate-y-2 shadow-2xl shadow-black/50"
              >
                {/* Thumbnail */}
                <div className="aspect-[16/10] overflow-hidden bg-black relative">
                  <img
                    src={course.imageUrl || "/placeholder-course.jpg"}
                    alt={course.title}
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                </div>

                {/* Content */}
                <div className="p-8 space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-blue-500 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed h-10 italic">
                    "{course.description}"
                  </p>


                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Lifetime Access</p>
                      <p className="text-xl font-black">₹{course.price}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative pt-40 pb-20 border-t border-white/5 bg-black">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none">
          <div className="text-[20vw] font-black tracking-tighter text-white uppercase text-center leading-none">
            AMBERBISHT
          </div>
        </div>

        <div className="max-w-[1240px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-32">
            <div className="md:col-span-2">
              <Link href="/" className="inline-block font-black text-3xl tracking-tighter mb-8 italic">
                lms.<span className="text-gray-500">amberbisht</span>
              </Link>
              <p className="text-gray-500 max-w-sm font-medium leading-relaxed">
                Building the next generation of 100x developers. Quality content, architectural patterns, and real-world impact.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Company</h4>
              <Link href="#" className="block text-sm font-bold text-gray-600 hover:text-white transition-all uppercase tracking-tight">Terms of Service</Link>
              <Link href="#" className="block text-sm font-bold text-gray-600 hover:text-white transition-all uppercase tracking-tight">Privacy Policy</Link>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Follow Us</h4>
              <div className="flex gap-4">
                <Link href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Youtube className="w-5 h-5" />
                </Link>
                <Link href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
            <p>© 2026 lms.amberbisht. All rights reserved.</p>
            <p>Made with ⚡ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
