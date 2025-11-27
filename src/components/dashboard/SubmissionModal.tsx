"use client";

import { useEffect } from "react";
import Link from "next/link";

interface SubmissionModalProps {
  submission: {
    id: string;
    submission_code: string;
    title: string;
    status: string;
    submitted_at: string | null;
    contest?: {
      id: string;
      title: string;
    };
  };
  onClose: () => void;
}

export default function SubmissionModal({ submission, onClose }: SubmissionModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handle