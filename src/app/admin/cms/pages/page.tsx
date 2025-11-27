import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import DeletePageButton from "./DeletePageButton";

type CMSPage = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  updated_at: string;
  created_at: string;
};

export default async function CMSPagesPage() {
  // Server-side authentication check
  await requireAdmin("/admin/cms/pages");

  const adminSupabase = await createAdminClient();

  const { data: pages, error } = await adminSupabase
    .from("cms_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pages:", error);
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#222] mb-2">
              CMS <span className="text-[#C19A43]">Pages</span>
            </h1>
            <p className="text-[#666]">
              Manage static pages like About, Rules, FAQ, and Contact
            </p>
          </div>
          <Link
            href="/admin/cms/pages/new"
            className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium"
          >
            + New Page
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error loading pages. Please try again.
          </div>
        )}

        {/* Pages List */}
        {!pages || pages.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-[#666] mb-4">
                No pages yet. Create your first page to get started!
              </p>
              <Link
                href="/admin/cms/pages/new"
                className="inline-block text-[#004D40] hover:text-[#C19A43] font-medium transition-colors"
              >
                Create Page →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E5E0]">
                <thead className="bg-[#F9F9F7]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[#666] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E5E0]">
                  {pages.map((page) => (
                    <tr
                      key={page.id}
                      className="hover:bg-[#F9F9F7] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#222]">
                          {page.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#666] font-mono">
                          /{page.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            page.published
                              ? "bg-[#004D40]/10 text-[#004D40]"
                              : "bg-[#666]/10 text-[#666]"
                          }`}
                        >
                          {page.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666]">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/cms/pages/${page.id}`}
                          className="text-[#004D40] hover:text-[#C19A43] mr-4 transition-colors"
                        >
                          Edit
                        </Link>
                        <DeletePageButton pageId={page.id} pageTitle={page.title} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
