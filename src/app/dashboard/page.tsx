import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubmissionAlert from "@/components/dashboard/SubmissionAlert";
import SubmissionList from "@/components/dashboard/SubmissionList";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication using server-side createClient
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to /auth/signin
  if (!user || authError) {
    redirect("/auth/signin");
  }

  // Get user profile data to check ban status
  const { data: userData, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Handle banned users - redirect to banned page
  if (userData?.is_banned) {
    redirect("/auth/banned");
  }

  // Fetch user's submissions with status
  const { data: rawSubmissions } = await supabase
    .from("submissions")
    .select(`
      id,
      submission_code,
      title,
      status,
      submitted_at,
      created_at,
      contest:contests(
        id,
        title,
        submissions_close_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Transform contest from array to single object
  const submissions = rawSubmissions?.map(sub => ({
    ...sub,
    contest: Array.isArray(sub.contest) ? sub.contest[0] : sub.contest
  }));

  // Separate pending payment from all other submissions
  const pendingSubmissions = submissions?.filter(s => s.status === "PENDING_PAYMENT") || [];
  const activeSubmissions = submissions?.filter(s => s.status !== "PENDING_PAYMENT") || [];
  const totalSubmissions = submissions?.length || 0;
  
  // Count by status for stats
  const submittedCount = submissions?.filter(s => 
    ["SUBMITTED", "PEER_VERIFICATION_PENDING", "PROCESSING"].includes(s.status)
  ).length || 0;
  const eliminatedCount = submissions?.filter(s => 
    ["ELIMINATED", "DISQUALIFIED"].includes(s.status)
  ).length || 0;

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Pending Payment Alerts */}
        {pendingSubmissions.length > 0 && (
          <div className="mb-8">
            {pendingSubmissions.map((submission) => (
              <SubmissionAlert key={submission.id} submission={submission} />
            ))}
          </div>
        )}

        <div className="bg-white border border-[#E5E5E0] rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-[#666] leading-relaxed mb-6">
            You have successfully signed in to Fraternal Admonition. This is
            your personal dashboard where you&apos;ll be able to manage your
            contest submissions, reviews, and more.
          </p>

          <div className="bg-[#F9F9F7] rounded-lg p-6">
            <h3 className="font-semibold text-[#222] mb-3">
              Your Account Details
            </h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="text-[#666] w-32">Email:</dt>
                <dd className="text-[#222] font-medium">{user.email}</dd>
              </div>
              <div className="flex">
                <dt className="text-[#666] w-32">Role:</dt>
                <dd className="text-[#222] font-medium">
                  {userData?.role || "USER"}
                </dd>
              </div>
              <div className="flex">
                <dt className="text-[#666] w-32">Status:</dt>
                <dd className="text-green-600 font-medium">
                  {user.email_confirmed_at
                    ? "✓ Verified"
                    : "Pending Verification"}
                </dd>
              </div>
              <div className="flex">
                <dt className="text-[#666] w-32">Member Since:</dt>
                <dd className="text-[#222] font-medium">
                  {new Date(
                    userData?.created_at || user.created_at
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <h3 className="font-serif text-lg text-[#222] mb-2">Submissions</h3>
            <p className="text-3xl font-bold text-[#004D40] mb-2">{totalSubmissions}</p>
            <p className="text-sm text-[#666]">
              {submittedCount > 0 && `${submittedCount} active`}
              {pendingSubmissions.length > 0 && `, ${pendingSubmissions.length} pending payment`}
              {eliminatedCount > 0 && `, ${eliminatedCount} eliminated`}
            </p>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <h3 className="font-serif text-lg text-[#222] mb-2">Reviews</h3>
            <p className="text-3xl font-bold text-[#004D40] mb-2">0</p>
            <p className="text-sm text-[#666]">Peer reviews completed</p>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
            <h3 className="font-serif text-lg text-[#222] mb-2">Votes</h3>
            <p className="text-3xl font-bold text-[#004D40] mb-2">0</p>
            <p className="text-sm text-[#666]">Public votes cast</p>
          </div>
        </div>

        {/* Peer Verification Tasks Section */}
        <div className="mt-8 bg-white border border-[#E5E5E0] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg text-[#222] mb-2">Peer Verification Tasks</h3>
              <p className="text-sm text-[#666]">Review submissions to help ensure fair AI decisions</p>
            </div>
            <a
              href="/dashboard/peer-verification-tasks"
              className="inline-block bg-[#6A1B9A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#8E24AA] transition-colors"
            >
              View Tasks
            </a>
          </div>
        </div>

        {/* All Submissions List (excluding pending payment) */}
        {activeSubmissions.length > 0 && (
          <div className="mt-8">
            <SubmissionList submissions={activeSubmissions} />
          </div>
        )}

        {/* No Submissions CTA */}
        {totalSubmissions === 0 && (
          <div className="mt-8 bg-gradient-to-br from-[#004D40] to-[#00695C] border border-[#004D40] rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">✍️</div>
            <h3 className="font-serif text-2xl text-white mb-3">
              Ready to Submit Your Letter?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              The Letters to Goliath contest is open for submissions. Share your voice and compete for recognition.
            </p>
            <a
              href="/contest"
              className="inline-block bg-white text-[#004D40] px-8 py-3 rounded-lg font-semibold hover:bg-[#F9F9F7] transition-colors"
            >
              View Contest Details
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
