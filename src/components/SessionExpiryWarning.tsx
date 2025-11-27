"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SessionExpiryWarningProps {
  isOpen: boolean;
  timeRemaining: number; // in seconds
  onStaySignedIn: () => void;
  onSignOut: () => void;
}

export default function SessionExpiryWarning({
  isOpen,
  timeRemaining,
  onStaySignedIn,
  onSignOut,
}: SessionExpiryWarningProps) {
  const [countdown, setCountdown] = useState(timeRemaining);

  // Debug: Log when component receives props
  useEffect(() => {
    console.log("🔔 SessionExpiryWarning props changed:", {
      isOpen,
      timeRemaining,
      countdown,
    });
  }, [isOpen, timeRemaining, countdown]);

  useEffect(() => {
    if (isOpen) {
      console.log("✅ Modal is OPEN, starting countdown from:", timeRemaining);
      setCountdown(timeRemaining);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          const newValue = prev <= 1 ? 0 : prev - 1;
          if (newValue === 0) {
            console.log("⏰ Countdown reached zero!");
            clearInterval(interval);
          }
          return newValue;
        });
      }, 1000);

      return () => {
        console.log("🛑 Clearing countdown interval");
        clearInterval(interval);
      };
    } else {
      console.log("❌ Modal is CLOSED");
    }
  }, [isOpen, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStaySignedIn = () => {
    console.log("👤 User clicked 'Stay Signed In'");
    onStaySignedIn();
  };

  const handleSignOut = () => {
    console.log("🚪 User clicked 'Sign Out'");
    onSignOut();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onStaySignedIn}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-white rounded-lg shadow-2xl border border-[#E5E5E0] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#C19A43] to-[#004D40] p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-serif text-white font-bold">
                      Session Expiring Soon
                    </h2>
                    <p className="text-white/80 text-sm">
                      Your session will expire in
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Countdown */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#C19A43]/20 to-[#004D40]/20 border-4 border-[#C19A43] mb-4">
                    <span className="text-3xl font-bold text-[#004D40]">
                      {formatTime(countdown)}
                    </span>
                  </div>
                  <p className="text-[#666] text-sm">
                    You'll be automatically signed out when the timer reaches zero.
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-2 bg-[#E5E5E0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#C19A43] to-[#004D40]"
                      initial={{ width: "100%" }}
                      animate={{
                        width: `${(countdown / timeRemaining) * 100}%`,
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleStaySignedIn}
                    className="w-full bg-[#004D40] hover:bg-[#00695C] text-white py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Stay Signed In
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full bg-white hover:bg-[#F9F9F7] text-[#666] py-3 rounded-lg font-medium transition-all border border-[#E5E5E0] flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
