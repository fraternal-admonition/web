"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Contest, ContestPhase } from "@/types/contests";

interface ContestFormProps {
  contest?: Contest;
  mode: "create" | "edit";
}

export default function ContestForm({ contest, mode }: ContestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState(contest?.title || "");
  const [slug, setSlug] = useState(contest?.slug || "");
  const [phase, setPhase] = useState<ContestPhase>(
    contest?.phase || "SUBMISSIONS_OPEN"
  );
  const [submissionsOpenAt, setSubmissionsOpenAt] = useState(
    contest?.submissions_open_at
      ? new Date(contest.submissions_open_at).toISOString().slice(0, 16)
      : ""
  );
  const [submissionsCloseAt, setSubmissionsCloseAt] = useState(
    contest?.submissions_close_at
      ? new Date(contest.submissions_close_at).toISOString().slice(0, 16)
      : ""
  );
  const [aiFilterStartAt, setAiFilterStartAt] = useState(
    contest?.ai_filter_start_at
      ? new Date(contest.ai_filter_start_at).toISOString().slice(0, 16)
      : ""
  );
  const [aiFilterEndAt, setAiFilterEndAt] = useState(
    contest?.ai_filter_end_at
      ? new Date(contest.ai_filter_end_at).toISOString().slice(0, 16)
      : ""
  );
  const [peerStartAt, setPeerStartAt] = useState(
    contest?.peer_start_at
      ? new Date(contest.peer_start_at).toISOString().slice(0, 16)
      : ""
  );
  const [peerEndAt, setPeerEndAt] = useState(
    contest?.peer_end_at
      ? new Date(contest.peer_end_at).toISOString().slice(0, 16)
      : ""
  );
  const [publicStartAt, setPublicStartAt] = useState(
    contest?.public_start_at
      ? new Date(contest.public_start_at).toISOString().slice(0, 16)
      : ""
  );
  const [publicEndAt, setPublicEndAt] = useState(
    contest?.public_end_at
      ? new Date(contest.public_end_at).toISOString().slice(0, 16)
      : ""
  );
  const [maxEntries, setMaxEntries] = useState(
    contest?.max_entries?.toString() || ""
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    // Slug format validation
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens";
    }

    // Max entries validation
    if (maxEntries && (isNaN(Number(maxEntries)) || Number(maxEntries) <= 0)) {
      newErrors.maxEntries = "Max entries must be a positive number";
    }

    // Date validation - check if end dates are after start dates
    if (submissionsOpenAt && submissionsCloseAt) {
      const openDate = new Date(submissionsOpenAt);
      const closeDate = new Date(submissionsCloseAt);
      if (closeDate <= openDate) {
        newErrors.submissionsCloseAt =
          "Submissions close date must be after open date";
      }
    }

    if (aiFilterStartAt && aiFilterEndAt) {
      const startDate = new Date(aiFilterStartAt);
      const endDate = new Date(aiFilterEndAt);
      if (endDate <= startDate) {
        newErrors.aiFilterEndAt =
          "AI filter end date must be after start date";
      }
    }

    if (peerStartAt && peerEndAt) {
      const startDate = new Date(peerStartAt);
      const endDate = new Date(peerEndAt);
      if (endDate <= startDate) {
        newErrors.peerEndAt = "Peer review end date must be after start date";
      }
    }

    if (publicStartAt && publicEndAt) {
      const startDate = new Date(publicStartAt);
      const endDate = new Date(publicEndAt);
      if (endDate <= startDate) {
        newErrors.publicEndAt =
          "Public voting end date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || null,
        phase: mode === "edit" ? phase : undefined,
        submissions_open_at: submissionsOpenAt
          ? new Date(submissionsOpenAt).toISOString()
          : null,
        submissions_close_at: submissionsCloseAt
          ? new Date(submissionsCloseAt).toISOString()
          : null,
        ai_filter_start_at: aiFilterStartAt
          ? new Date(aiFilterStartAt).toISOString()
          : null,
        ai_filter_end_at: aiFilterEndAt
          ? new Date(aiFilterEndAt).toISOString()
          : null,
        peer_start_at: peerStartAt
          ? new Date(peerStartAt).toISOString()
          : null,
        peer_end_at: peerEndAt ? new Date(peerEndAt).toISOString() : null,
        public_start_at: publicStartAt
          ? new Date(publicStartAt).toISOString()
          : null,
        public_end_at: publicEndAt
          ? new Date(publicEndAt).toISOString()
          : null,
        max_entries: maxEntries ? Number(maxEntries) : null,
      };

      const url =
        mode === "create"
          ? "/api/admin/contests"
          : `/api/admin/contests/${contest?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} contest`);
      }

      toast.success(
        mode === "create"
          ? "Contest created successfully"
          : "Contest updated successfully"
      );

      router.push("/admin/contests");
      router.refresh();
    } catch (error) {
      console.error(`Error ${mode}ing contest:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to ${mode} contest`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const phases: ContestPhase[] = [
    "SUBMISSIONS_OPEN",
    "SUBMISSIONS_CLOSED",
    "AI_FILTERING",
    "PEER_REVIEW",
    "PUBLIC_VOTING",
    "FINALIZED",
  ];

  const formatPhaseName = (phase: string) => {
    return phase
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
        <h2 className="text-xl font-serif text-[#222] mb-4">
          Basic <span className="text-[#C19A43]">Information</span>
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.title ? "border-red-500" : "border-[#E5E5E0]"
              }`}
              placeholder="Letters to Goliath 2025"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Slug
            </label>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.slug ? "border-red-500" : "border-[#E5E5E0]"
              }`}
              placeholder="ltg-2025"
            />
            <p className="mt-1 text-sm text-[#666]">
              Lowercase letters, numbers, and hyphens only
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
            )}
          </div>

          {/* Phase (only in edit mode) */}
          {mode === "edit" && (
            <div>
              <label
                htmlFor="phase"
                className="block text-sm font-medium text-[#222] mb-1"
              >
                Current Phase
              </label>
              <select
                id="phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value as ContestPhase)}
                className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
              >
                {phases.map((p) => (
                  <option key={p} value={p}>
                    {formatPhaseName(p)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-[#666]">
                Manually override the current contest phase
              </p>
            </div>
          )}

          {/* Max Entries */}
          <div>
            <label
              htmlFor="maxEntries"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Max Entries
            </label>
            <input
              type="number"
              id="maxEntries"
              value={maxEntries}
              onChange={(e) => setMaxEntries(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.maxEntries ? "border-red-500" : "border-[#E5E5E0]"
              }`}
              placeholder="1000"
              min="1"
            />
            <p className="mt-1 text-sm text-[#666]">
              Optional limit on total submissions
            </p>
            {errors.maxEntries && (
              <p className="mt-1 text-sm text-red-600">{errors.maxEntries}</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
        <h2 className="text-xl font-serif text-[#222] mb-4">
          Contest <span className="text-[#C19A43]">Timeline</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submissions Window */}
          <div>
            <label
              htmlFor="submissionsOpenAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Submissions Open
            </label>
            <input
              type="datetime-local"
              id="submissionsOpenAt"
              value={submissionsOpenAt}
              onChange={(e) => setSubmissionsOpenAt(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="submissionsCloseAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Submissions Close
            </label>
            <input
              type="datetime-local"
              id="submissionsCloseAt"
              value={submissionsCloseAt}
              onChange={(e) => setSubmissionsCloseAt(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.submissionsCloseAt ? "border-red-500" : "border-[#E5E5E0]"
              }`}
            />
            {errors.submissionsCloseAt && (
              <p className="mt-1 text-sm text-red-600">
                {errors.submissionsCloseAt}
              </p>
            )}
          </div>

          {/* AI Filter Window */}
          <div>
            <label
              htmlFor="aiFilterStartAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              AI Filter Start
            </label>
            <input
              type="datetime-local"
              id="aiFilterStartAt"
              value={aiFilterStartAt}
              onChange={(e) => setAiFilterStartAt(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="aiFilterEndAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              AI Filter End
            </label>
            <input
              type="datetime-local"
              id="aiFilterEndAt"
              value={aiFilterEndAt}
              onChange={(e) => setAiFilterEndAt(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.aiFilterEndAt ? "border-red-500" : "border-[#E5E5E0]"
              }`}
            />
            {errors.aiFilterEndAt && (
              <p className="mt-1 text-sm text-red-600">{errors.aiFilterEndAt}</p>
            )}
          </div>

          {/* Peer Review Window */}
          <div>
            <label
              htmlFor="peerStartAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Peer Review Start
            </label>
            <input
              type="datetime-local"
              id="peerStartAt"
              value={peerStartAt}
              onChange={(e) => setPeerStartAt(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="peerEndAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Peer Review End
            </label>
            <input
              type="datetime-local"
              id="peerEndAt"
              value={peerEndAt}
              onChange={(e) => setPeerEndAt(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.peerEndAt ? "border-red-500" : "border-[#E5E5E0]"
              }`}
            />
            {errors.peerEndAt && (
              <p className="mt-1 text-sm text-red-600">{errors.peerEndAt}</p>
            )}
          </div>

          {/* Public Voting Window */}
          <div>
            <label
              htmlFor="publicStartAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Public Voting Start
            </label>
            <input
              type="datetime-local"
              id="publicStartAt"
              value={publicStartAt}
              onChange={(e) => setPublicStartAt(e.target.value)}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="publicEndAt"
              className="block text-sm font-medium text-[#222] mb-1"
            >
              Public Voting End
            </label>
            <input
              type="datetime-local"
              id="publicEndAt"
              value={publicEndAt}
              onChange={(e) => setPublicEndAt(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#004D40] focus:border-transparent ${
                errors.publicEndAt ? "border-red-500" : "border-[#E5E5E0]"
              }`}
            />
            {errors.publicEndAt && (
              <p className="mt-1 text-sm text-red-600">{errors.publicEndAt}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-[#666] hover:text-[#222] transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Contest"
              : "Update Contest"}
        </button>
      </div>
    </form>
  );
}
