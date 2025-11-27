import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ContestCard from "@/components/contest/ContestCard";
import { Contest } from "@/types/contests";

export const metadata = {
  title: "Contest",
  description: "Submit your letter to the Letters to Goliath contest",
};

export default async function ContestPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to signin
  if (!user) {
    redirect("/auth/signin");
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
  const { data: contest, error } = await supabase
    .from("contests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Contest Page] Error fetching contest:", error);
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {contest ? (
          <ContestCard contest={contest as Contest} />
        ) : (
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-6">📝</div>
              <h2 className="text-2xl font-serif text-[#222] mb-4">
                No Active Contest
              </h2>
              <p className="text-[#666] leading-relaxed">
                There is currently no active contest. Check back soon for
                updates on the Letters to Goliath contest and submission
                deadlines.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
