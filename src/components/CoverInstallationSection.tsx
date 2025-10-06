'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function CoverInstallationSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section 
      ref={ref} 
      className="relative py-32 px-6 bg-gradient-to-br from-[#F9F9F7] to-white overflow-hidden"
    >
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonal-lines" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="60" stroke="#222" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="space-y-16"
        >
          {/* Visual Representation with Animated Elements */}
          <div className="relative">
            {/* Decorative Frame */}
            <div className="relative max-w-[900px] mx-auto">
              {/* Top Border */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-2 bg-gradient-to-r from-transparent via-[#C19A43] to-transparent mb-12"
              />
              
              {/* Content Area */}
              <div className="relative p-12 md:p-16 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-[#C19A43]/30 shadow-2xl">
                {/* Corner Decorations */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#C19A43] rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#004D40] rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#004D40] rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#C19A43] rounded-br-3xl" />

                {/* Headline */}
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-[#222] leading-[1.3] tracking-[-0.02em] font-bold text-center mb-8">
                  Our cover is not a graphic design but an
                  <span className="block mt-3 bg-gradient-to-r from-[#C19A43] via-[#D4AF37] to-[#004D40] bg-clip-text text-transparent">
                    installation
                  </span>
                </h2>
                
                {/* Animated Slats Representation */}
                <div className="flex justify-center gap-3 my-12">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ rotateZ: 0, y: 0 }}
                      animate={isInView ? {
                        rotateZ: [0, i % 2 === 0 ? 5 : -5, 0],
                        y: [0, -10, 0]
                      } : { rotateZ: 0, y: 0 }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut"
                      }}
                      className="w-2 md:w-3 h-32 md:h-40 bg-gradient-to-b from-[#C19A43] to-[#8B7355] rounded-full shadow-lg"
                    />
                  ))}
                </div>

                {/* Description */}
                <p className="text-xl md:text-2xl text-[#222] leading-[1.6] font-body-serif text-center mb-6">
                  Painting, wood, and engraved text, photographed in motion.
                </p>
              </div>

              {/* Bottom Border */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-2 bg-gradient-to-r from-transparent via-[#004D40] to-transparent mt-12"
              />
            </div>
          </div>

          {/* Quote Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-[800px] mx-auto text-center"
          >
            <div className="relative inline-block">
              {/* Quote Marks */}
              <span className="absolute -top-8 -left-8 text-6xl text-[#C19A43]/20 font-serif">“</span>
              <p className="text-3xl md:text-5xl font-serif italic text-[#222] leading-[1.4] px-12">
                Because real battles are never still.
              </p>
              <span className="absolute -bottom-8 -right-8 text-6xl text-[#C19A43]/20 font-serif">”</span>
            </div>
          </motion.div>

          {/* Caption */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <p className="text-base md:text-lg text-[#444] leading-[1.7] font-body-serif italic max-w-[700px] mx-auto">
              Visual: painting by Viktoriia + red-gold frame + hanging wooden slats with engraved text, photographed mid-swing.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
