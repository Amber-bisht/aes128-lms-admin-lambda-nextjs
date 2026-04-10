"use client";

import { motion } from "framer-motion";

export default function Philosophy() {
  return (
    <section className="max-w-[1240px] mx-auto px-6 py-24 border-t border-gray-100">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl"
      >
        <h2 className="text-6xl font-black text-[#001B44] tracking-tighter uppercase mb-8 leading-[0.9]">
          Stuck in <br />
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-emerald-600 italic"
          >
            "Tutorial Hell"?
          </motion.span>
        </h2>
        <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
          Most courses teach you syntax. They show you how to build a to-do list app on localhost.
          <span className="text-gray-900 block mt-4 font-bold">Real engineering happens when things break at scale.</span>
        </p>
      </motion.div>
    </section>
  );
}
