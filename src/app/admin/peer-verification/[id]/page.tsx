import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import VerificationDetailClient from "./VerificationDetailClient";

export default async function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("/admin/peer-verification");
  const { id } = await params;
  const supabase = await createAdminClient();

  // Fetch verification request details
  const { data: submission, error } = await supabase
    .from("submissions")
    .select(
      `
      id,
      submission_code,
      title,
      body_text,
      status,
      created_at,
      updated_at,
      peer_verification_result,
      user:users!submissions_user_id_fkey(
        id,
        display_id
      ),
      contest:contests!submissions_contest_id_fkey(
        id,
        title,
        phase
      ),
      peer_assignments(
        id,
        status,
        assigned_at,
        deadline,
        completed_at,
        reviewer:users!peer_assignments_reviewer_user_id_fkey(
          id,
          display_id,
          integrity_score
        ),
        peer_reviews(
          id,
          decision,
          comment_100,
          created_at
        )
      ),
      ai_screenings(
        id,
        status,
        scores,
        notes,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !submission) {
    console.error("[Admin] Verification request not found:", error);
    notFound();
  }

  return <VerificationDetailClient submission={submission} />;
}
