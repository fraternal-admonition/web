'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface UnderConstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnderConstructionModal({ isOpen, onClose }: UnderConstructionModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur effect - click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative max-w-[700px] w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Card */}
              <div className="relative bg-gradient-to-br from-white via-[#F9F9F7] to-white rounded-3xl shadow-2xl overflow-hidden border-2 border-[#C19A43]/20">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 opacity-[0.03]">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="modal-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="1" fill="#222" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#modal-pattern)" />
                  </svg>
                </div>

                {/* Gradient Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C19A43] via-[#D4AF37] to-[#004D40]" />

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-[#222] hover:bg-[#C19A43] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 group"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>

                {/* Content */}
                <div className="relative p-12 md:p-16 space-y-8">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                    className="flex justify-center"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C19A43] to-[#D4AF37] flex items-center justify-center shadow-xl">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-[#C19A43] blur-2xl opacity-30 rounded-full" />
                    </div>
                  </motion.div>

                  {/* Headline */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center space-y-4"
                  >
                    <h2 className="text-4xl md:text-5xl font-serif text-[#222] font-bold tracking-[-0.02em]">
                      Under Construction
                    </h2>
                    
                    {/* Decorative Line */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-[#C19A43]" />
                      <div className="w-2 h-2 rounded-full bg-[#C19A43]" />
                      <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-[#C19A43]" />
                    </div>
                  </motion.div>

                  {/* Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center"
                  >
                    <p className="text-lg md:text-xl text-[#222] leading-[1.8] font-body-serif max-w-[500px] mx-auto">
                      This section is under construction. Please check back after the
                      <span className="font-semibold text-[#C19A43]"> Make Europe Great Again Conference </span>
                      in Dubrovnik.
                    </p>
                  </motion.div>

                  {/* Close Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex justify-center pt-4"
                  >
                    <button
                      onClick={onClose}
                      className="group relative overflow-hidden bg-gradient-to-r from-[#004D40] to-[#003830] text-white px-10 py-4 rounded-xl text-base font-sans uppercase tracking-wider transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <span>Got It</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#C19A43] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  </motion.div>

                  {/* Hint Text */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center text-sm text-[#444] font-sans italic"
                  >
                    Press ESC or click outside to close
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
