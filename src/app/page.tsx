"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import IntroductionSection from "@/components/IntroductionSection";
import CoverInstallationSection from "@/components/CoverInstallationSection";
import ReflectionSection from "@/components/ReflectionSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  // Modal is now handled by LayoutWrapper
  const openModal = () => {
    // This will be handled by the global modal in LayoutWrapper
    const event = new CustomEvent("openModal");
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen">
      <HeroSection onOpenModal={openModal} />
      <IntroductionSection onOpenModal={openModal} />
      <CoverInstallationSection />
      <ReflectionSection />
      <CTASection onOpenModal={openModal} />
      <Footer onOpenModal={openModal} />
    </div>
  );
}
