"use client";

import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import UnderConstructionModal from "./UnderConstructionModal";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Listen for global modal open events
  useEffect(() => {
    const handleOpenModal = () => openModal();
    window.addEventListener("openModal", handleOpenModal);
    return () => window.removeEventListener("openModal", handleOpenModal);
  }, []);

  return (
    <>
      <Navbar onOpenModal={openModal} />
      {children}
      <UnderConstructionModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
