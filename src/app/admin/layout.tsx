import { requireAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { settingsCache } from "@/lib/cms/settings-cache";
import AdminBannerWrapper from "@/components/admin/AdminBannerWrapper";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use requireAdmin helper consistently with redirect parameter
  await requireAdmin("/admin");

  // Fetch settings for the banner
  const settings = await settingsCache.get();

  // Check if banner should be shown
  const showBanner = settings.maintenance_mode || settings.site_lock_mode !== 'off';

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {/* Admin Banner */}
      <AdminBannerWrapper
        initialMaintenanceMode={settings.maintenance_mode}
        initialSiteLockMode={settings.site_lock_mode}
      />
      
      {/* Admin Header */}
      <header className={`bg-white shadow-sm border-b border-[#E5E5E0] ${showBanner ? 'mt-10' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="text-xl font-serif text-[#222]">
                  Admin <span className="text-[#C19A43]">Panel</span>
                </span>
              </Link>
              <AdminNav />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                target="_blank"
                className="text-sm text-[#666] hover:text-[#004D40] transition-colors font-medium"
              >
                View Site
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-[#666] hover:text-[#004D40] transition-colors font-medium px-3 py-2 border border-[#E5E5E0] rounded-lg hover:bg-[#F9F9F7]"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
