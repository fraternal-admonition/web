"use client";

import { useState } from "react";
import { Contest } from "@/types/contests";
import IllustrationModal from "./IllustrationModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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

interface SubmissionFormProps {
  contest: Contest;
  illustrations: Illustration[];
}

export default function SubmissionForm({
  contest,
  illustrations,
}: SubmissionFormProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedIllustration, setSelectedIllustration] =
    useState<Illustration | null>(null);
  const [note, setNote] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Character/word counters
  const titleLength = title.length;
  const bodyLength = body.length;
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const noteLength = note.length;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (titleLength > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (!body.trim()) {
      newErrors.body = "Letter is required";
    } else if (bodyLength < 100) {
      newErrors.body = "Letter must be at least 100 characters";
    } else if (bodyLength > 50000) {
      newErrors.body = "Letter must be 50,000 characters or less";
    }

    if (!selectedIllustration) {
      newErrors.illustration = "Please select an illustration";
    }

    if (noteLength > 100) {
      newErrors.note = "Note must be 100 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contest_id: contest.id,
          title: title.trim(),
          body: body.trim(),
          illustration_id: selectedIllustration!.id,
          note: note.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create submission");
      }

      toast.success("Submission created! Redirecting to payment...");

      // Redirect to payment page
      router.push(`/contest/payment/${data.submission_id}`);
    } catch (error) {
      console.error("[SubmissionForm] Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create submission"
      );
      setIsSubmitting(false);
    }
  };

  const handleIllustrationSelect = (illustration: Illustration) => {
    setSelectedIllustration(illustration);
    setIsModalOpen(false);
    // Clear illustration error if it exists
    if (errors.illustration) {
      setErrors((prev) => {
        const { illustration, ...rest } = prev;
        return rest;
      });
    }
  };

  const isFormValid =
    title.trim() &&
    titleLength <= 200 &&
    body.trim() &&
    bodyLength >= 100 &&
    bodyLength <= 50000 &&
    selectedIllustration &&
    noteLength <= 100;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-[#222] mb-2"
          >
            Letter Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] ${
              errors.title ? "border-red-500" : "border-[#E5E5E0]"
            }`}
            placeholder="Enter a compelling title for your letter"
            maxLength={200}
          />
          <div className="flex justify-between items-center mt-2">
            {errors.title ? (
              <p className="text-sm text-red-500">{errors.title}</p>
            ) : (
              <p className="text-sm text-[#666]">
                Give your letter a memorable title
              </p>
            )}
            <p
              className={`text-sm ${
                titleLength > 200 ? "text-red-500" : "text-[#666]"
              }`}
            >
              {titleLength}/200
            </p>
          </div>
        </div>

        {/* Body Field */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
          <label
            htmlFor="body"
            className="block text-sm font-medium text-[#222] mb-2"
          >
            Your Letter <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] font-serif ${
              errors.body ? "border-red-500" : "border-[#E5E5E0]"
            }`}
            placeholder="Write your letter here... Share your moral clarity and courage."
          />
          <div className="flex justify-between items-center mt-2">
            {errors.body ? (
              <p className="text-sm text-red-500">{errors.body}</p>
            ) : (
              <p className="text-sm text-[#666]">
                Plain text only. Minimum 100 characters.
              </p>
            )}
            <p
              className={`text-sm ${
                bodyLength < 100 || bodyLength > 50000
                  ? "text-red-500"
                  : "text-[#666]"
              }`}
            >
              {bodyLength.toLocaleString()} characters ({wordCount} words)
            </p>
          </div>
        </div>

        {/* Illustration Selection */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Choose Illustration <span className="text-red-500">*</span>
          </label>

          {selectedIllustration ? (
            <div className="space-y-4">
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-[#E5E5E0]">
                {selectedIllustration.asset?.path && (
                  <Image
                    src={selectedIllustration.asset.path}
                    alt={selectedIllustration.asset.alt || selectedIllustration.title || "Selected illustration"}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#222]">
                    {selectedIllustration.title}
                  </p>
                  {selectedIllustration.description && (
                    <p className="text-sm text-[#666] mt-1">
                      {selectedIllustration.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 text-sm text-[#004D40] border border-[#004D40] rounded-lg hover:bg-[#004D40] hover:text-white transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={`w-full py-12 border-2 border-dashed rounded-lg hover:border-[#004D40] hover:bg-[#F9F9F7] transition-colors ${
                errors.illustration
                  ? "border-red-500 bg-red-50"
                  : "border-[#E5E5E0]"
              }`}
            >
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-[#666]"
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
                <p className="mt-2 text-sm text-[#666]">
                  Click to choose an illustration
                </p>
              </div>
            </button>
          )}

          {errors.illustration && (
            <p className="text-sm text-red-500 mt-2">{errors.illustration}</p>
          )}
        </div>

        {/* Note Field */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
          <label
            htmlFor="note"
            className="block text-sm font-medium text-[#222] mb-2"
          >
            Why This Illustration? (Optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={100}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] ${
              errors.note ? "border-red-500" : "border-[#E5E5E0]"
            }`}
            placeholder="Briefly explain why you chose this illustration (100 characters max)"
          />
          <div className="flex justify-between items-center mt-2">
            {errors.note ? (
              <p className="text-sm text-red-500">{errors.note}</p>
            ) : (
              <p className="text-sm text-[#666]">
                Share your connection to the image
              </p>
            )}
            <p
              className={`text-sm ${
                noteLength > 100 ? "text-red-500" : "text-[#666]"
              }`}
            >
              {noteLength}/100
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={() => router.push("/contest")}
            className="px-6 py-3 text-[#666] hover:text-[#222] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="px-8 py-3 bg-[#004D40] text-white rounded-lg font-medium hover:bg-[#003830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Continue to Payment"}
          </button>
        </div>
      </form>

      {/* Illustration Modal */}
      <IllustrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        illustrations={illustrations}
        onSelect={handleIllustrationSelect}
      />
    </>
  );
}
