'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ReflectionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section 
      ref={ref} 
      className="relative py-32 px-6 bg-gradient-to-b from-white via-[#F9F9F7] to-white overflow-hidden"
    >
      {/* Radial Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#C19A43]/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="space-y-16"
        >
          {/* Headline with Decorative Elements */}
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#222] leading-[1.2] tracking-[-0.02em] font-bold">
                What Comes After
                <span className="block mt-2 bg-gradient-to-r from-[#C19A43] via-[#D4AF37] to-[#C19A43] bg-clip-text text-transparent">
                  This Book?
                </span>
              </h2>
            </motion.div>

            {/* Decorative Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex items-center justify-center gap-3"
            >
              <div className="w-24 h-[2px] bg-gradient-to-r from-transparent to-[#C19A43]" />
              <div className="w-3 h-3 rounded-full bg-[#C19A43]" />
              <div className="w-24 h-[2px] bg-gradient-to-l from-transparent to-[#C19A43]" />
            </motion.div>
          </div>

          {/* Content Cards in Staggered Layout */}
          <div className="max-w-[900px] mx-auto space-y-8">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative ml-0 md:ml-12"
            >
              <div className="relative p-8 md:p-10 bg-white/70 backdrop-blur-sm rounded-2xl border-l-4 border-[#C19A43] shadow-xl hover:shadow-2xl transition-all duration-300 hover:translate-x-2">
                <div className="absolute -left-3 top-8 w-6 h-6 rounded-full bg-[#C19A43] shadow-lg" />
                <p className="text-lg md:text-xl text-[#222] leading-[1.8] font-body-serif">
                  This book is my attempt to turn personal injustice into what, for me, an ideal book should be: a union of morality, philosophy, and art—rooted in a deep, painful, almost lifelong experience. It says what needs to be said now, without noise or spectacle.
                </p>
              </div>
            </motion.div>

            {/* Card 2 - Offset Right */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="relative mr-0 md:mr-12"
            >
              <div className="relative p-8 md:p-10 bg-gradient-to-br from-white/80 to-[#F9F9F7]/80 backdrop-blur-sm rounded-2xl border-r-4 border-[#004D40] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-x-2">
                <div className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-[#004D40] shadow-lg" />
                <p className="text-lg md:text-xl text-[#222] leading-[1.8] font-body-serif italic">
                  As readers move through the paintings, editorial selections, and brief reflections, quiet connections begin to appear.
                </p>
              </div>
            </motion.div>

            {/* Card 3 - Centered */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="relative"
            >
              <div className="relative p-8 md:p-10 bg-gradient-to-br from-white to-[#F9F9F7] backdrop-blur-sm rounded-2xl border-2 border-[#C19A43]/30 shadow-xl hover:shadow-2xl transition-all duration-300">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C19A43] rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#004D40] rounded-br-2xl" />
                
                <p className="text-lg md:text-xl text-[#222] leading-[1.8] font-body-serif text-center">
                  When it is finished, I will thank the Lord—and ask what more, if anything, He would have me do in this situation, to His glory.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Closing Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex justify-center pt-8"
          >
            <div className="relative">
              {/* Cross Symbol */}
              <svg className="w-16 h-16 text-[#C19A43]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9V2z" />
              </svg>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-[#C19A43] blur-xl opacity-20" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
