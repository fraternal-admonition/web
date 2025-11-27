"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import AdminBannerWrapper from "./AdminBannerWrapper";

interface ConditionalAdminBannerProps {
  initialMaintenanceMode: boolean;
  initialSiteLockMode: 'off' | 'auth' | 'password';
}

/**
 * Wrapper that only shows the admin banner on non-admin pages
 * Admin pages have their own banner in the admin layout
 */
export default function ConditionalAdminBanner({
  initialMaintenanceMode,
  initialSiteLockMode,
}: ConditionalAdminBannerProps) {
  const pathname = usePathname();
  
  // Don't show banner on admin pages (admin layout handles it)
  const isAdminPage = pathname?.startsWith("/admin");
  
  // Set CSS variable for banner height so navbar can adjust
  useEffect(() => {
    if (!isAdminPage && (initialMaintenanceMode || initialSiteLockMode !== 'off')) {
      document.documentElement.style.setProperty('--banner-height', '40px');
    } else {
      document.documentElement.style.setProperty('--banner-height', '0px');
    }
    
    return () => {
      document.documentElement.style.setProperty('--banner-height', '0px');
    };
  }, [isAdminPage, initialMaintenanceMode, initialSiteLockMode]);
  
  if (isAdminPage) {
    return null;
  }
  
  return (
    <AdminBannerWrapper
      initialMaintenanceMode={initialMaintenanceMode}
      initialSiteLockMode={initialSiteLockMode}
    />
  );
}
