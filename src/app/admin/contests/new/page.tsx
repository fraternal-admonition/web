import { requireAdmin } from "@/lib/admin-auth";
import ContestForm from "../ContestForm";
import Link from "next/link";

export default async function NewContestPage() {
  // Server-side authentication check
  await requireAdmin("/admin/contests/new");

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
          <span className="text-[#222]">New</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Create <span className="text-[#C19A43]">Contest</span>
          </h1>
          <p className="text-[#666]">
            Set up a new Letters to Goliath contest with timeline and settings
          </p>
        </div>

        {/* Form */}
        <ContestForm mode="create" />
      </div>
    </div>
  );
}
