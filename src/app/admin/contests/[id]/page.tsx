import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import ContestForm from "../ContestForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Contest } from "@/types/contests";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { getPhaseStatusMessage } from "@/lib/contests/phase-utils";
import PhaseStatusWrapper from "./PhaseStatusWrapper";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditContestPage({ params }: PageProps) {
  // Server-side authentication check
  await requireAdmin("/admin/contests");

  const { id } = await params;

  const adminSupabase = await createAdminClient();

  // Fetch contest
  const { data: contest, error } = await adminSupabase
    .from("contests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !contest) {
    console.error("Error fetching contest:", error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "Contests", href: "/admin/contests" },
            { label: contest.title },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Edit <span className="text-[#C19A43]">Contest</span>
          </h1>
          <p className="text-[#666]">
            Update contest settings and timeline for {contest.title}
          </p>
        </div>

        {/* Phase Status */}
        <PhaseStatusWrapper
          contest={contest as Contest}
          phaseStatus={getPhaseStatusMessage(contest as Contest)}
        />

        {/* Form */}
        <ContestForm mode="edit" contest={contest as Contest} />
      </div>
    </div>
  );
}
