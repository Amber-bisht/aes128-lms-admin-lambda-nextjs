"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface CourseGridProps {
  courses: any[];
  session: any;
}

export default function CourseGrid({ courses, session }: CourseGridProps) {
  return (
    <div className="w-full">
      <motion.h2 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-[#001B44] mb-16 tracking-tight"
      >
        Featured Cohorts
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {courses.map((course: any, idx: number) => {
        const originalPrice = Math.round(course.price / 0.66);
        const isPurchased = course.purchased || (session?.user as any)?.role === 'ADMIN';

        return (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
          >
            <Link
              href={isPurchased ? `/${course.slug}/play` : `/${course.slug}`}
              className="group relative flex flex-col bg-white border border-gray-100 rounded-none overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-200/50 p-4"
            >
              <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden rounded-none mb-6 border border-gray-100/50">
                <img
                  src={course.imageUrl || "https://www.amberbisht.me/hero-profile.webp"}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <div className="px-4 pb-4 flex flex-col flex-1">
                <h3 className="text-2xl font-bold text-[#001B44] mt-6 leading-tight uppercase font-outfit text-left">
                  {course.title}
                </h3>
                <div className="mt-8 space-y-8">
                  <div className="flex items-center gap-6 border-b border-gray-50 pb-8">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl font-bold text-[#001B44]">₹{course.price.toLocaleString()}</span>
                      <span className="text-xl text-gray-500 line-through">₹{originalPrice.toLocaleString()}</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                      34% off
                    </span>
                  </div>

                  <div className="w-full py-5 bg-[#001B44] text-white rounded-none font-bold text-center group-hover:bg-[#002866] transition-colors text-lg uppercase tracking-widest">
                    {isPurchased ? "Access Now" : "Enroll Now"}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}
