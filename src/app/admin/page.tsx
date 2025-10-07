import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = await createAdminClient();

  // Fetch counts
  const [pagesResult, assetsResult, settingsResult] = await Promise.all([
    supabase.from("cms_pages").select("id", { count: "exact", head: true }),
    supabase.from("cms_assets").select("id", { count: "exact", head: true }),
    supabase.from("cms_settings").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      name: "CMS Pages",
      value: pagesResult.count || 0,
      href: "/admin/cms/pages",
      description: "Manage static pages like About, Rules, FAQ",
    },
    {
      name: "Assets",
      value: assetsResult.count || 0,
      href: "/admin/cms/assets",
      description: "Upload and manage images and media files",
    },
    {
      name: "Settings",
      value: settingsResult.count || 0,
      href: "/admin/cms/settings",
      description: "Configure site-wide settings and features",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your Fraternal Admonition site content and settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {stat.name}
              </h3>
              <span className="text-3xl font-bold text-blue-600">
                {stat.value}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{stat.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/cms/pages/new"
            className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors text-center font-medium"
          >
            + Create New Page
          </Link>
          <Link
            href="/admin/cms/assets/upload"
            className="bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition-colors text-center font-medium"
          >
            + Upload Asset
          </Link>
        </div>
      </div>
    </div>
  );
}
