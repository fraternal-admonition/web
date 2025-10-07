import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Get user profile data using admin client
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminClient = await createAdminClient();
  const { data: userData } = await adminClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <p className="text-3xl font-bold text-[#004D40] mb-2">0</p>
            <p className="text-sm text-[#666]">Contest entries submitted</p>
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

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">🚧 Coming Soon</h3>
          <p className="text-yellow-800 text-sm">
            The Letters to Goliath contest is currently being prepared. Check
            back soon for updates on submission deadlines, contest rules, and
            more.
          </p>
        </div>
      </div>
    </div>
  );
}
