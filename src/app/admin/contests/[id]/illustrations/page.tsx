import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import IllustrationCard from "./IllustrationCard";
import { Illustration } from "@/types/contests";
import Breadcrumb from "@/components/admin/Breadcrumb";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ContestIllustrationsPage({ params }: PageProps) {
  // Server-side authentication check
  await requireAdmin("/admin/contests");

  const { id: contestId } = await params;

  const adminSupabase = await createAdminClient();

  // Fetch contest
  const { data: contest, error: contestError } = await adminSupabase
    .from("contests")
    .select("id, title")
    .eq("id", contestId)
    .single();

  if (contestError || !contest) {
    console.error("Error fetching contest:", contestError);
    notFound();
  }

  // Fetch illustrations with asset data
  const { data: illustrations, error: illustrationsError } =
    await adminSupabase
      .from("illustrations")
      .select(
        `
        *,
        asset:cms_assets(path, alt)
      `
      )
      .eq("contest_id", contestId)
      .order("created_at", { ascending: false });

  if (illustrationsError) {
    console.error("Error fetching illustrations:", illustrationsError);
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: "Contests", href: "/admin/contests" },
            { label: contest.title, href: `/admin/contests/${contestId}` },
            { label: "Illustrations" },
          ]}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#222] mb-2">
              Contest <span className="text-[#C19A43]">Illustrations</span>
            </h1>
            <p className="text-[#666]">
              Manage illustrations for {contest.title}
            </p>
          </div>
          <Link
            href={`/admin/contests/${contestId}/illustrations/new`}
            className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium"
          >
            + Add Illustration
          </Link>
        </div>

        {illustrationsError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error loading illustrations. Please try again.
          </div>
        )}

        {/* Illustrations Grid */}
        {!illustrations || illustrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#F9F9F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#C19A43]"
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
              </div>
              <p className="text-[#666] mb-4">
                No illustrations yet. Add your first illustration to get
                started!
              </p>
              <Link
                href={`/admin/contests/${contestId}/illustrations/new`}
                className="inline-block text-[#004D40] hover:text-[#C19A43] font-medium transition-colors"
              >
                Add Illustration →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {illustrations.map((illustration) => (
              <IllustrationCard
                key={illustration.id}
                illustration={illustration as Illustration}
                contestId={contestId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
