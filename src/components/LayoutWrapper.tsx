"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import UnderConstructionModal from "./UnderConstructionModal";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith("/admin");

  // Listen for global modal open events
  useEffect(() => {
    const handleOpenModal = () => openModal();
    window.addEventListener("openModal", handleOpenModal);
    return () => window.removeEventListener("openModal", handleOpenModal);
  }, []);

  return (
    <>
      {/* Only show main site navbar on non-admin pages */}
      {!isAdminPage && <Navbar onOpenModal={openModal} />}
      {children}
      <UnderConstructionModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
