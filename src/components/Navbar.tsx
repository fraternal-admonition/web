"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onOpenModal?: () => void;
}

export default function Navbar({ onOpenModal }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  // Debug logging for deployed version
  useEffect(() => {
    console.log(
      "Navbar render - loading:",
      loading,
      "user:",
      user?.email,
      "profile:",
      profile?.role
    );
  }, [loading, user, profile]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // signOut in AuthContext handles errors gracefully, so we don't need to do anything
    } finally {
      // Reset after a short delay to ensure navigation happens
      setTimeout(() => {
        setSigningOut(false);
      }, 100);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = ["About", "Contest", "Contact", "Updates"];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#F9F9F7]/98 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            : "bg-gradient-to-b from-[#F9F9F7] to-[#F9F9F7]/80 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <Image
                  src="/logo.png"
                  alt="Fraternal Admonition"
                  width={48}
                  height={48}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </motion.div>
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden md:block text-lg font-serif"
              >
                <span className="text-[#222]">Fraternal </span>
                <span className="text-[#C19A43]">Admonition</span>
              </motion.h1>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item, index) => (
                <motion.button
                  key={item}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  onClick={onOpenModal}
                  className="relative text-[#222] hover:text-[#C19A43] text-sm font-sans uppercase tracking-[0.1em] transition-colors duration-300 group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C19A43] to-[#004D40] group-hover:w-full transition-all duration-300" />
                </motion.button>
              ))}
            </div>

            {/* Desktop CTA Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href={profile?.role === "ADMIN" ? "/admin" : "/dashboard"}
                    className="text-[#222] hover:text-[#C19A43] text-sm font-sans uppercase tracking-wider transition-colors duration-300"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#F9F9F7] rounded-lg border border-[#E5E5E0]">
                    <span className="text-xs text-[#666] max-w-[150px] truncate">
                      {user.email}
                    </span>
                    {profile?.role === "ADMIN" && (
                      <span className="text-xs font-bold text-[#C19A43] bg-[#C19A43]/10 px-2 py-0.5 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-sm text-[#004D40] hover:text-[#00695C] font-medium transition-colors px-3 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F9F9F7] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {signingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              ) : loading ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-[#666]">Loading...</div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/signin"
                    className="text-[#222] hover:text-[#C19A43] text-sm font-sans uppercase tracking-wider transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="relative overflow-hidden bg-[#004D40] hover:bg-[#003830] text-white px-6 py-2.5 rounded-lg text-sm font-sans uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <span className="relative z-10">Sign Up</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C19A43] to-[#004D40] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#222] hover:text-[#C19A43] transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: mobileMenuOpen ? 1 : 0,
          height: mobileMenuOpen ? "auto" : 0,
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-0 right-0 z-40 lg:hidden overflow-hidden bg-[#F9F9F7]/98 backdrop-blur-md border-b border-[#E5E5E0] shadow-xl"
      >
        <div className="px-6 py-8 space-y-6">
          {["About", "Contest", "Contact", "Updates"].map((item) => (
            <button
              key={item}
              onClick={() => {
                onOpenModal?.();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-[#222] hover:text-[#C19A43] transition-colors duration-200 text-lg font-sans uppercase tracking-[0.1em] py-2 border-b border-[#E5E5E0]/50"
            >
              {item}
            </button>
          ))}

          {/* Auth Links / User Menu */}
          {user ? (
            <div className="pt-4 space-y-3">
              <Link
                href={profile?.role === "ADMIN" ? "/admin" : "/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center text-[#222] hover:text-[#C19A43] transition-colors duration-200 text-base font-sans uppercase tracking-wider py-3 border border-[#E5E5E0] rounded-lg"
              >
                Dashboard
              </Link>
              <div className="p-3 bg-[#F9F9F7] rounded-lg border border-[#E5E5E0]">
                <p className="text-xs text-[#666] mb-2 text-center">
                  {user.email}
                </p>
                {profile?.role === "ADMIN" && (
                  <p className="text-xs font-bold text-[#C19A43] text-center mb-2">
                    ADMIN
                  </p>
                )}
                <button
                  onClick={async () => {
                    await handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  disabled={signingOut}
                  className="w-full text-center text-[#004D40] hover:text-[#00695C] text-base font-sans uppercase tracking-wider py-2 border border-[#E5E5E0] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {signingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 space-y-3">
              <Link
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center text-[#222] hover:text-[#C19A43] transition-colors duration-200 text-base font-sans uppercase tracking-wider py-3 border border-[#E5E5E0] rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-[#004D40] hover:bg-[#003830] text-white py-3 rounded-lg text-base font-sans uppercase tracking-wider transition-all duration-300"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
