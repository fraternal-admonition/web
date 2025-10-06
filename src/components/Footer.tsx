'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface FooterProps {
  onOpenModal: () => void;
}

export default function Footer({ onOpenModal }: FooterProps) {
  return (
    <footer className="relative py-20 px-6 bg-gradient-to-b from-[#F9F9F7] to-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1" fill="#222" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Left - Logo & Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#C19A43]/30">
                <Image
                  src="/logo.png"
                  alt="FA Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-serif tracking-tight leading-tight">
                  <span className="text-[#222] font-semibold">Fraternal</span>
                  <br />
                  <span className="text-[#C19A43] text-sm tracking-wider">ADMONITION</span>
                </h3>
              </div>
            </div>
            <p className="text-sm text-[#444] font-body-serif leading-relaxed max-w-[280px]">
              A biblical principle of love expressed through admonition—preserving dignity before exposure.
            </p>
          </motion.div>

          {/* Center - Navigation Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#444] font-sans mb-2">Quick Links</h4>
            <div className="flex flex-wrap gap-6 justify-center">
              {['About', 'Contest', 'Contact', 'Terms'].map((item, idx) => (
                <motion.button
                  key={item}
                  onClick={onOpenModal}
                  className="relative text-sm text-[#222] hover:text-[#C19A43] transition-colors duration-300 font-sans group"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#C19A43] group-hover:w-full transition-all duration-300" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Right - Cross Symbol with Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col items-end justify-center space-y-4"
          >
            <div className="relative">
              <motion.svg
                className="w-12 h-12 text-[#C19A43]"
                fill="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M11 2h2v9h9v2h-9v9h-2v-9H2v-2h9V2z" />
              </motion.svg>
              <div className="absolute inset-0 bg-[#C19A43] blur-xl opacity-20" />
            </div>
            <p className="text-xs text-[#444] font-sans italic text-right max-w-[200px]">
              Mt 18:15–17
            </p>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
          className="h-[1px] bg-gradient-to-r from-transparent via-[#E5E5E0] to-transparent mb-12"
        />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="flex items-center gap-6">
            <p className="text-sm text-[#444] font-sans">
              © 2025 Fraternal Admonition
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#C19A43]" />
              <p className="text-xs text-[#444] font-sans">All rights reserved</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C19A43]" />
              <div className="w-8 h-[1px] bg-gradient-to-r from-[#C19A43] to-transparent" />
            </div>
            <p className="text-xs text-[#444] font-sans uppercase tracking-wider">Truth · Dignity · Justice</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-[1px] bg-gradient-to-l from-[#004D40] to-transparent" />
              <div className="w-2 h-2 rounded-full bg-[#004D40]" />
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
