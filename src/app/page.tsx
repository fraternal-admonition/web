'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import IntroductionSection from '@/components/IntroductionSection';
import CoverInstallationSection from '@/components/CoverInstallationSection';
import ReflectionSection from '@/components/ReflectionSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import UnderConstructionModal from '@/components/UnderConstructionModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="min-h-screen">
      <Navbar onOpenModal={openModal} />
      <HeroSection onOpenModal={openModal} />
      <IntroductionSection onOpenModal={openModal} />
      <CoverInstallationSection />
      <ReflectionSection />
      <CTASection onOpenModal={openModal} />
      <Footer onOpenModal={openModal} />
      <UnderConstructionModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}
