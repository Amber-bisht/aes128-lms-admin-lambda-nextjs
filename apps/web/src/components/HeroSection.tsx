"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CodeWindow from "./CodeWindow";

export default function HeroSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="max-w-[1240px] mx-auto px-6 pt-12 pb-16">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-16 lg:gap-32">
        {/* Left Column: Text Content */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex-1 max-w-2xl"
        >
          <motion.h1 variants={item} className="text-5xl md:text-[6.5rem] font-black tracking-tighter leading-[0.85] mb-12 uppercase">
            <span className="text-emerald-800">Become a</span><br />
            <span className="text-emerald-500 whitespace-nowrap">100x dev</span><br />
            <span className="text-teal-600">with</span> <br />
            <span className="text-green-400">Amber Bisht</span>
          </motion.h1>

          <motion.p variants={item} className="text-xl text-gray-600 max-w-xl font-medium leading-[1.6] mb-12">
            The only platform designed for engineers who want to build high-scale products,
            master architectural patterns, and grow their impact.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-6">
            <Link href="/courses" className="bg-gray-900 text-white px-12 py-6 rounded-none text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-4 group shadow-2xl shadow-gray-200">
              Explore Curriculum
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Column: Code Window */}
        <div className="flex-1 w-full max-w-2xl hidden lg:block perspective-1000 lg:pt-20 lg:pl-10">
          <CodeWindow />
        </div>
      </div>
    </section>
  );
}
