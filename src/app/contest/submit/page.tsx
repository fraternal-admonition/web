import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubmissionForm from "@/components/contest/SubmissionForm";
import { Contest } from "@/types/contests";
import { getSubmissionPhaseStatus } from "@/lib/contests/phase-utils";

export const metadata = {
  title: "Submit Your Letter",
  description: "Submit your letter to the Letters to Goliath contest",
};

export default async function SubmitPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to signin
  if (!user) {
    redirect("/auth/signin?redirect=/contest/submit");
  }

  // Check email verification
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-serif text-[#222] mb-4">
              Email Verification Required
            </h2>
            <p className="text-[#666] leading-relaxed mb-6">
              Please verify your email address before submitting to the contest.
              Check your inbox for a verification link.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#003830] transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get user profile to check ban status
  const { data: userData } = await supabase
    .from("users")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  // Redirect banned users
  if (userData?.is_banned) {
    redirect("/auth/banned");
  }

  // Fetch the active contest
  const { data: contest, error: contestError } = await supabase
    .from("contests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (contestError || !contest) {
    redirect("/contest");
  }

  // Check if submissions are open
  const phaseStatus = getSubmissionPhaseStatus(contest as Contest);

  if (!phaseStatus.canSubmit) {
    redirect("/contest");
  }

  // Fetch active illustrations for this contest
  const { data: illustrationsData, error: illustrationsError } = await supabase
    .from("illustrations")
    .select(`
      id,
      title,
      description,
      asset_id,
      asset:cms_assets(path, alt)
    `)
    .eq("contest_id", contest.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  // Transform the data to match the expected type (asset should be a single object, not array)
  const illustrations = illustrationsData?.map((ill: any) => ({
    ...ill,
    asset: Array.isArray(ill.asset) ? ill.asset[0] : ill.asset,
  }));

  if (illustrationsError) {
    console.error("[Submit Page] Error fetching illustrations:", illustrationsError);
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-[#222] mb-2">
            Submit Your <span className="text-[#C19A43]">Letter</span>
          </h1>
          <p className="text-[#666]">
            Share your moral clarity and courage with the world
          </p>
        </div>

        {/* Deadline Alert */}
        {phaseStatus.deadline && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-900">
              <svg
                className="w-5 h-5 flex-shrink-0"
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
              <div>
                <span className="font-semibold">Submission Deadline: </span>
                <span>
                  {new Date(phaseStatus.deadline).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <SubmissionForm
          contest={contest as Contest}
          illustrations={illustrations || []}
        />
      </div>
    </div>
  );
}
