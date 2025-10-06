'use client';

import { motion } from 'framer-motion';

interface HeroSectionProps {
  onOpenModal: () => void;
}

export default function HeroSection({ onOpenModal }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F9F9F7]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Geometric Shapes */}
        <motion.div
          className="absolute top-20 right-10 w-96 h-96 rounded-full bg-gradient-to-br from-[#C19A43]/5 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-gradient-to-tr from-[#004D40]/5 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* Decorative Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="text-center space-y-12">
          {/* Small Reference with Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#C19A43]" />
            <p className="text-sm text-[#444] font-sans uppercase tracking-[0.2em]">Mt 18:15–17</p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#C19A43]" />
          </motion.div>

          {/* Main Headline with Creative Typography */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-[#222] leading-[0.95] tracking-[-0.03em] font-bold">
              <span className="block">Fraternal</span>
              <span className="block bg-gradient-to-r from-[#C19A43] via-[#D4AF37] to-[#C19A43] bg-clip-text text-transparent">
                Admonition
              </span>
            </h1>
            
            {/* Decorative Accent */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C19A43]" />
              <div className="w-16 h-[2px] bg-gradient-to-r from-[#C19A43] to-[#004D40]" />
              <div className="w-2 h-2 rounded-full bg-[#004D40]" />
            </div>
          </motion.div>

          {/* Subheadline in Elegant Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-[900px] mx-auto"
          >
            <div className="relative p-8 md:p-12 rounded-2xl bg-white/60 backdrop-blur-sm border border-[#E5E5E0] shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <div className="absolute top-0 left-8 w-1 h-full bg-gradient-to-b from-[#C19A43] to-transparent opacity-50" />
              <p className="text-lg md:text-2xl text-[#222] leading-[1.8] font-body-serif text-left">
                <span className="italic text-[#C19A43] font-semibold">Fraternal Admonition (Latin: Admonitio Fraterna)</span> is the biblical principle of love expressed through admonition—an act of warning before public judgment. It is not condemnation, but a final appeal to conscience, spoken with the aim of preserving dignity before exposure.
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons with Modern Design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap gap-6 justify-center pt-8"
          >
            <button
              onClick={onOpenModal}
              className="group relative overflow-hidden bg-[#004D40] text-white px-10 py-4 rounded-xl text-base font-sans uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Learn More
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#003830] to-[#004D40] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            <button
              onClick={onOpenModal}
              className="group relative overflow-hidden bg-transparent border-2 border-[#C19A43] text-[#C19A43] hover:text-white px-10 py-4 rounded-xl text-base font-sans uppercase tracking-wider transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Get Updates</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#C19A43] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="pt-16"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-2 text-[#444]"
            >
              <span className="text-xs uppercase tracking-wider font-sans">Scroll</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
