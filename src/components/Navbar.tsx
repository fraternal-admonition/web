'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface NavbarProps {
  onOpenModal: () => void;
}

export default function Navbar({ onOpenModal }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-[#F9F9F7]/98 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)]' 
            : 'bg-gradient-to-b from-[#F9F9F7] to-[#F9F9F7]/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Logo Image */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#C19A43]/20 hover:ring-[#C19A43]/40 transition-all duration-300">
                <Image
                  src="/logo.png"
                  alt="FA Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Text - Hidden on mobile, visible on desktop */}
              <div className="hidden md:block">
                <h1 className="text-xl font-serif tracking-tight leading-tight">
                  <span className="text-[#222] font-semibold">Fraternal</span>
                  <br />
                  <span className="text-[#C19A43] text-sm tracking-wider">ADMONITION</span>
                </h1>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-10">
              {['About', 'Contest', 'Contact'].map((item, idx) => (
                <motion.button
                  key={item}
                  onClick={onOpenModal}
                  className="relative text-[#222] hover:text-[#C19A43] transition-colors duration-300 text-sm font-sans uppercase tracking-[0.15em] group"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C19A43] to-[#004D40] group-hover:w-full transition-all duration-300" />
                </motion.button>
              ))}
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={onOpenModal}
                className="hidden sm:block relative overflow-hidden bg-[#004D40] hover:bg-[#003830] text-white px-6 py-2.5 rounded-lg text-sm font-sans uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="relative z-10">Get Updates</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#C19A43] to-[#004D40] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#222] hover:text-[#C19A43] transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: mobileMenuOpen ? 1 : 0,
          height: mobileMenuOpen ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-0 right-0 z-40 lg:hidden overflow-hidden bg-[#F9F9F7]/98 backdrop-blur-md border-b border-[#E5E5E0] shadow-xl"
      >
        <div className="px-6 py-8 space-y-6">
          {['About', 'Contest', 'Contact', 'Updates'].map((item) => (
            <button
              key={item}
              onClick={() => {
                onOpenModal();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-[#222] hover:text-[#C19A43] transition-colors duration-200 text-lg font-sans uppercase tracking-[0.1em] py-2 border-b border-[#E5E5E0]/50"
            >
              {item}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
