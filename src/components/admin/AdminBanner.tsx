"use client";

interface AdminBannerProps {
  maintenanceMode: boolean;
  siteLockMode: 'off' | 'auth' | 'password';
}

export default function AdminBanner({
  maintenanceMode,
  siteLockMode,
}: AdminBannerProps) {
  console.log("[AdminBanner] Rendering with:", { maintenanceMode, siteLockMode });
  
  // Maintenance mode takes precedence over site lock
  if (maintenanceMode) {
    console.log("[AdminBanner] Showing maintenance banner");
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
        ⚠️ Maintenance Mode Active - Only admins can see this site
      </div>
    );
  }

  if (siteLockMode === 'auth') {
    console.log("[AdminBanner] Showing auth site lock banner");
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
        🔒 Site Lock Active - Admin authentication required for access
      </div>
    );
  }

  if (siteLockMode === 'password') {
    console.log("[AdminBanner] Showing password lock banner");
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium">
        🔒 Password Lock Active - Password required for access
      </div>
    );
  }

  console.log("[AdminBanner] No banner to show");
  return null;
}
