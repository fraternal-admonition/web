import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";
import DeletePostButton from "@/app/admin/posts/DeletePostButton";

type Post = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  featured: boolean;
  updated_at: string;
  created_at: string;
};

export default async function AdminPostsPage() {
  // Server-side authentication check
  await requireAdmin("/admin/posts");

  const adminSupabase = await createAdminClient();

  const { data: posts, error } = await adminSupabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#222] mb-2">
              <span className="text-[#004D40]">Posts</span> Management
            </h1>
            <p className="text-[#666]">
              Manage blog posts and announcements
            </p>
          </div>
          <Link
            href="/admin/posts/new"
            className="bg-[#004D40] text-white px-6 py-3 rounded-lg hover:bg-[#00695C] transition-all shadow-md hover:shadow-lg font-medium"
          >
            + New Post
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error loading posts. Please try again.
          </div>
        )}

        {/* Posts List */}
        {!posts || posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#F9F9F7] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#004D40]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <p className="text-[#666] mb-4">
                No posts yet. Create your first post to get started!
              </p>
              <Link
                href="/admin/posts/new"
                className="inline-block text-[#004D40] hover:text-[#00695C] font-medium transition-colors"
              >
                Create Post →
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
                      Featured
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
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-[#F9F9F7] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#222]">
                          {post.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#666] font-mono">
                          /{post.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            post.published
                              ? "bg-[#004D40]/10 text-[#004D40]"
                              : "bg-[#666]/10 text-[#666]"
                          }`}
                        >
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {post.featured ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-[#C19A43]/10 text-[#C19A43]">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Featured
                          </span>
                        ) : (
                          <span className="text-xs text-[#999]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666]">
                        {new Date(post.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="text-[#004D40] hover:text-[#00695C] mr-4 transition-colors"
                        >
                          Edit
                        </Link>
                        <DeletePostButton postId={post.id} postTitle={post.title} />
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
