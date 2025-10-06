'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface IntroductionSectionProps {
  onOpenModal: () => void;
}

export default function IntroductionSection({ onOpenModal }: IntroductionSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section 
      ref={ref} 
      className="relative py-32 px-6 bg-gradient-to-b from-white via-[#F9F9F7] to-white overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-[#C19A43]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#004D40]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="space-y-16"
        >
          {/* Headline with Creative Layout */}
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#C19A43] via-[#004D40] to-transparent" />
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#222] leading-[1.2] tracking-[-0.02em] font-bold pl-8">
              Fraternal Admonition is not an
              <span className="block mt-2 bg-gradient-to-r from-[#C19A43] to-[#004D40] bg-clip-text text-transparent">
                organization, but a principle.
              </span>
            </h2>
          </div>
          
          {/* Body Text in Card Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E5E5E0] shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute top-0 left-0 w-12 h-1 bg-gradient-to-r from-[#C19A43] to-transparent rounded-tl-2xl" />
              <p className="text-lg text-[#222] leading-[1.8] font-body-serif">
                It is a call to moral action in today's world: the responsibility to speak truthfully when power denies justice, and to do so in a way that still honors the one who has done wrong.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E5E5E0] shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute top-0 left-0 w-12 h-1 bg-gradient-to-r from-[#004D40] to-transparent rounded-tl-2xl" />
              <p className="text-lg text-[#222] leading-[1.8] font-body-serif">
                The project's first expression is the book <span className="italic font-semibold text-[#C19A43]">Letters to Goliath.</span> After more than 25 years of seeking justice through courts and institutions, a Croatian entrepreneur who suffered great injustice now turns his personal struggle into a universal voice.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="relative p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E5E5E0] shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="absolute top-0 left-0 w-12 h-1 bg-gradient-to-r from-[#C19A43] to-[#004D40] rounded-tl-2xl" />
              <p className="text-lg text-[#222] leading-[1.8] font-body-serif">
                The book gathers <strong className="text-[#004D40]">50 letters and 50 paintings</strong>—a final <span className="italic">fraternal admonition</span> addressed to a modern Goliath: a powerful state and its corporation, left unnamed to keep the book universal and academic in tone.
              </p>
            </motion.div>
          </div>

          {/* CTA Button with Modern Design */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex justify-center pt-8"
          >
            <button
              onClick={onOpenModal}
              className="group relative overflow-hidden bg-gradient-to-r from-[#004D40] to-[#003830] text-white px-12 py-5 rounded-xl text-lg font-sans uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Learn More About the Story</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#C19A43] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
