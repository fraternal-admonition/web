"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Illustration {
  id: string;
  title: string | null;
  description: string | null;
  asset_id: string | null;
  asset: {
    path: string;
    alt: string | null;
  } | null;
}

interface IllustrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  illustrations: Illustration[];
  onSelect: (illustration: Illustration) => void;
}

export default function IllustrationModal({
  isOpen,
  onClose,
  illustrations,
  onSelect,
}: IllustrationModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#E5E5E0]">
                  <div>
                    <h2 className="text-2xl font-serif text-[#222]">
                      Choose an Illustration
                    </h2>
                    <p className="text-sm text-[#666] mt-1">
                      Select one image to accompany your letter
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#F9F9F7] rounded-lg transition-colors"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-6 h-6 text-[#666]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {illustrations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎨</div>
                      <h3 className="text-xl font-serif text-[#222] mb-2">
                        No Illustrations Available
                      </h3>
                      <p className="text-[#666]">
                        Illustrations are being prepared. Please check back soon.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {illustrations.map((illustration) => (
                        <button
                          key={illustration.id}
                          onClick={() => onSelect(illustration)}
                          className="group text-left bg-white border-2 border-[#E5E5E0] rounded-lg overflow-hidden hover:border-[#004D40] hover:shadow-xl transition-all"
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] bg-[#F9F9F7]">
                            {illustration.asset?.path ? (
                              <Image
                                src={illustration.asset.path}
                                alt={illustration.asset.alt || illustration.title || "Illustration"}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg
                                  className="w-16 h-16 text-[#666]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            
                            {/* Select indicator on hover */}
                            <div className="absolute top-3 right-3 w-10 h-10 bg-[#004D40] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Title and Description - Always Visible */}
                          <div className="p-4">
                            {illustration.title && (
                              <h3 className="font-serif text-lg text-[#222] mb-2 group-hover:text-[#004D40] transition-colors">
                                {illustration.title}
                              </h3>
                            )}
                            {illustration.description && (
                              <p className="text-sm text-[#666] line-clamp-3">
                                {illustration.description}
                              </p>
                            )}
                            {!illustration.title && !illustration.description && (
                              <p className="text-sm text-[#999] italic">
                                No description available
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-[#E5E5E0] bg-[#F9F9F7]">
                  <p className="text-sm text-[#666]">
                    {illustrations.length} illustration{illustrations.length !== 1 ? "s" : ""} available
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-[#666] hover:text-[#222] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
