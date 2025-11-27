import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import ConfirmationContent from "@/components/contest/ConfirmationContent";

interface PageProps {
  params: Promise<{
    submissionId: string;
  }>;
}

export const metadata = {
  title: "Submission Confirmed",
  description: "Your contest submission has been confirmed",
};

export default async function ConfirmationPage({ params }: PageProps) {
  const { submissionId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch submission with related data
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select(`
      *,
      contest:contests(
        id,
        title
      )
    `)
    .eq("id", submissionId)
    .single();

  if (submissionError || !submission) {
    notFound();
  }

  // Verify ownership
  if (submission.user_id !== user.id) {
    redirect("/contest");
  }

  // Check if status is SUBMITTED
  if (submission.status !== "SUBMITTED") {
    // If still pending payment, redirect to payment page
    if (submission.status === "PENDING_PAYMENT") {
      redirect(`/contest/payment/${submissionId}`);
    }
    // Otherwise redirect to contest page
    redirect("/contest");
  }

  return (
    <ConfirmationContent
      submission={submission}
      userEmail={user.email!}
    />
  );
}
