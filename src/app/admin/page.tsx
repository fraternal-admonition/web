import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  // Use requireAdmin helper consistently with redirect parameter
  await requireAdmin("/admin");
  const supabase = await createAdminClient();

  // Fetch counts
  const [pagesResult, postsResult, settingsResult, contestsResult, illustrationsResult] = await Promise.all([
    supabase.from("cms_pages").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("cms_settings").select("id", { count: "exact", head: true }),
    supabase.from("contests").select("id", { count: "exact", head: true }),
    supabase.from("illustrations").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  // Fetch peer verification count
  const { count: peerVerificationCount } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "PEER_VERIFICATION_PENDING");

  const stats = [
    {
      name: "CMS Pages",
      value: pagesResult.count || 0,
      href: "/admin/cms/pages",
      description: "Manage static pages like About, Rules, FAQ",
    },
    {
      name: "Posts",
      value: postsResult.count || 0,
      href: "/admin/posts",
      description: "Manage blog posts and announcements",
    },
    {
      name: "Contests",
      value: contestsResult.count || 0,
      href: "/admin/contests",
      description: "Manage Letters to Goliath contests and phases",
    },
    {
      name: "Peer Verification",
      value: peerVerificationCount || 0,
      href: "/admin/peer-verification",
      description: "Monitor peer verification requests and reviewers",
    },
    {
      name: "Illustrations",
      value: illustrationsResult.count || 0,
      href: "/admin/contests",
      description: "Active illustrations available for submissions",
    },
    {
      name: "Settings",
      value: settingsResult.count || 0,
      href: "/admin/cms/settings",
      description: "Configure site-wide settings and features",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Admin <span className="text-[#C19A43]">Dashboard</span>
          </h1>
          <p className="text-[#666]">
            Manage your Fraternal Admonition site content and settings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6 hover:shadow-md transition-all hover:border-[#C19A43]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#222]">{stat.name}</h3>
                <span className="text-3xl font-bold text-[#004D40]">
                  {stat.value}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#666]">{stat.description}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-serif text-[#222] mb-4">
            Quick <span className="text-[#C19A43]">Actions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/cms/pages/new"
              className="bg-[#004D40] text-white rounded-lg p-6 hover:bg-[#00695C] transition-all text-center font-medium shadow-md hover:shadow-lg"
            >
              + Create New Page
            </Link>
            <Link
              href="/admin/posts/new"
              className="bg-[#004D40] text-white rounded-lg p-6 hover:bg-[#00695C] transition-all text-center font-medium shadow-md hover:shadow-lg"
            >
              + Create New Post
            </Link>
            <Link
              href="/admin/contests/new"
              className="bg-[#004D40] text-white rounded-lg p-6 hover:bg-[#00695C] transition-all text-center font-medium shadow-md hover:shadow-lg"
            >
              + Create New Contest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
