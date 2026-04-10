"use client";

import { motion } from "framer-motion";

export default function CodeWindow() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative group w-full max-w-2xl perspective-1000"
    >
      {/* Decorative Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>

      {/* Image Container with Shadow and Subtle Border */}
      <div className="relative bg-zinc-950 rounded-[20px] shadow-2xl overflow-hidden border border-white/5">
        <img 
          src="/image.png" 
          alt="High-Scale Code Architecture" 
          className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.02]"
        />
        
        {/* Subtle Overlay to match the site's depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent pointer-events-none"></div>
      </div>
    </motion.div>
  );
}
