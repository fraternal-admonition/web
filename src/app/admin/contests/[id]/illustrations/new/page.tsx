import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import IllustrationForm from "../IllustrationForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewIllustrationPage({ params }: PageProps) {
  // Server-side authentication check
  await requireAdmin("/admin/contests");

  const { id: contestId } = await params;

  const adminSupabase = await createAdminClient();

  // Verify contest exists
  const { data: contest, error } = await adminSupabase
    .from("contests")
    .select("id, title")
    .eq("id", contestId)
    .single();

  if (error || !contest) {
    console.error("Error fetching contest:", error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-[#666]">
          <Link
            href="/admin"
            className="hover:text-[#004D40] transition-colors"
          >
            Admin
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/admin/contests"
            className="hover:text-[#004D40] transition-colors"
          >
            Contests
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/admin/contests/${contestId}`}
            className="hover:text-[#004D40] transition-colors"
          >
            {contest.title}
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/admin/contests/${contestId}/illustrations`}
            className="hover:text-[#004D40] transition-colors"
          >
            Illustrations
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#222]">New</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Add <span className="text-[#C19A43]">Illustration</span>
          </h1>
          <p className="text-[#666]">
            Upload a new illustration for {contest.title}
          </p>
        </div>

        {/* Form */}
        <IllustrationForm contestId={contestId} mode="create" />
      </div>
    </div>
  );
}
