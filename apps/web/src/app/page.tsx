import Link from "next/link";
import { Youtube, Twitter, Instagram, Linkedin, ArrowRight, Star, Globe, Clock, ChevronRight } from "lucide-react";

async function getCourses() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
      next: { revalidate: 3600 },
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
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Background Mesh & Grid */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-60 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-grid opacity-[0.03] z-0 pointer-events-none" />

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-[1240px] mx-auto px-6 pt-32 pb-40">
          <div className="max-w-4xl">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-10 shadow-sm border border-blue-100/50">
              New: Master Architectural Patterns 2026
            </div>

            <h1 className="text-7xl md:text-[6.5rem] font-black tracking-tighter leading-[0.85] mb-12 uppercase text-gray-900 transform -rotate-1 origin-left">
              Become a <span className="text-blue-600">100x dev</span><br />
              <span className="text-gray-400">Without</span> <br />
              Your <span className="text-emerald-500 italic">Soul</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl font-medium leading-[1.6] mb-12">
              The only platform designed for engineers who want to build high-scale products,
              master architectural patterns, and grow their impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link href="#courses" className="bg-gray-900 text-white px-12 py-6 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-4 group shadow-2xl shadow-gray-200">
                Explore Curriculum
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover grayscale" />
                  </div>
                ))}
                <div className="flex flex-col justify-center ml-8 translate-x-4">
                  <div className="flex items-center gap-1 text-amber-500 mb-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">5k+ Enrolled</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="max-w-[1240px] mx-auto px-6 py-40">
          <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12 text-center md:text-left">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                <span className="h-1 w-12 bg-blue-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Explore Our Best Courses</p>
              </div>
              <h2 className="text-6xl font-black uppercase tracking-tighter mb-4 text-gray-900">
                Choose Your <span className="text-blue-600">Success</span> Path
              </h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">
                Transform your career with mentor-led coding courses, crafted by industry experts.
              </p>
            </div>
            
            <Link href="#" className="hidden md:flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all">
              View All Courses <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {courses.map((course: any) => (
              <Link
                key={course.id}
                href={`/${course.slug}`}
                className="group relative flex flex-col bg-white border border-gray-100 rounded-[3rem] overflow-hidden transition-all hover:border-blue-200 hover:-translate-y-3 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.1)]"
              >
                {/* Thumbnail */}
                <div className="aspect-[16/10] overflow-hidden bg-gray-50 relative group-hover:bg-blue-50 transition-colors duration-500">
                  <img
                    src={course.imageUrl || "/placeholder-course.jpg"}
                    alt={course.title}
                    className="w-full h-full object-cover scale-[1.01] group-hover:scale-110 transition-all duration-700 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-10 pb-12 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">Secure Access</span>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 40+ Hours
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors mb-3 leading-none">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-sm font-medium line-clamp-2 leading-relaxed italic">
                      "{course.description}"
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between border-t border-gray-50">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Lifetime Access</p>
                      <p className="text-2xl font-black text-gray-900">₹{course.price}</p>
                    </div>
                    <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-[1.5rem] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12">
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
      <footer className="relative pt-40 pb-20 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-[1240px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-32">
            <div className="md:col-span-2">
              <Link href="/" className="inline-block font-black text-3xl tracking-tighter mb-8 italic text-gray-900">
                lms.<span className="text-blue-600">amberbisht</span>
              </Link>
              <p className="text-gray-500 max-w-sm font-medium leading-relaxed">
                Building the next generation of 100x developers. Quality content, architectural patterns, and real-world impact.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-8 px-4 py-1.5 bg-gray-50 rounded-full inline-block">Company</h4>
              <nav className="flex flex-col gap-4">
                <Link href="#" className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-all uppercase tracking-tight">Terms of Service</Link>
                <Link href="#" className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-all uppercase tracking-tight">Privacy Policy</Link>
              </nav>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-8 px-4 py-1.5 bg-gray-50 rounded-full inline-block">Socials</h4>
              <div className="flex gap-4">
                <Link href="#" className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Youtube className="w-5 h-5" />
                </Link>
                <Link href="#" className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-20 border-t border-gray-100 flex flex-col md:flex-row justify-between gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <p>© 2026 lms.amberbisht. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p>System Status: Online</p>
            </div>
            <p>Made with ⚡ in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
