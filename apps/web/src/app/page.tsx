"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Youtube, Twitter, Instagram, Linkedin } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAuthUI } from "@/context/AuthContext";

export default function Home() {
  const { status } = useSession();
  const { openAuthModal } = useAuthUI();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="min-h-screen bg-[#111] text-white relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full z-0" />

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-[1200px] mx-auto px-6 pt-32 pb-40 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9] bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
              Become a 100x dev<br />
              Without Selling Ur Soul
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              From - 0 to 100x dev Start Journey with us
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/dashboard" className="bg-white text-black hover:bg-gray-200 text-lg font-bold px-10 py-5 rounded-full w-full sm:w-auto transition-all shadow-xl shadow-white/10">
                Explore Courses
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-lg font-bold px-10 py-5 rounded-full w-full sm:w-auto transition-all backdrop-blur-md"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-lg font-bold px-10 py-5 rounded-full w-full sm:w-auto transition-all backdrop-blur-md"
                >
                  Join Now
                </button>
              )}
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative pt-32 pb-16 overflow-hidden border-t border-white/5 bg-black">
        {/* Large Background Text */}
        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 select-none pointer-events-none z-0 opacity-10">
          <div className="text-[15vw] font-black tracking-tighter text-white/5 uppercase leading-none whitespace-nowrap">
            LMS.AMBERBISHT
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start mb-20">
            {/* Logo Section */}
            <div>
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <span className="font-black text-2xl tracking-tighter text-foreground">
                  lms.<span className="text-gray-400">amberbisht</span>
                </span>
              </Link>
            </div>

            {/* Links Section */}
            <div className="flex flex-col gap-2 md:items-center">
              <div className="text-left md:text-center space-y-3">
                <Link href="#" className="text-gray-400 transition-colors block text-sm mb-2 hover:text-white">Terms & Conditions</Link>
                <Link href="#" className="text-gray-400 transition-colors block text-sm mb-2 hover:text-white">Privacy Policy</Link>
                <Link href="#" className="text-gray-400 transition-colors block text-sm mb-2 hover:text-white">Refund & Cancellation</Link>
              </div>
            </div>

            {/* Social & Copyright Section */}
            <div className="flex flex-col md:items-end gap-6">
              <div className="flex gap-4">
                <Link href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                  <Youtube className="w-6 h-6" />
                </Link>
                <Link href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                  <Twitter className="w-6 h-6" />
                </Link>
                <Link href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                  <Instagram className="w-6 h-6" />
                </Link>
                <Link href="#" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-gray-400 hover:text-white">
                  <Linkedin className="w-6 h-6" />
                </Link>
              </div>
              <p className="text-gray-500 text-sm font-medium">
                © 2026 lms.amberbisht. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
