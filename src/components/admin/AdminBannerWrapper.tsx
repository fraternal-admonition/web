"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminBanner from "./AdminBanner";

interface AdminBannerWrapperProps {
  initialMaintenanceMode: boolean;
  initialSiteLockMode: 'off' | 'auth' | 'password';
}

export default function AdminBannerWrapper({
  initialMaintenanceMode,
  initialSiteLockMode,
}: AdminBannerWrapperProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(initialMaintenanceMode);
  const [siteLockMode, setSiteLockMode] = useState(initialSiteLockMode);
  const pathname = usePathname();

  useEffect(() => {
    // Only poll when on admin settings page
    const isSettingsPage = pathname?.includes("/admin/cms/settings");
    
    if (!isSettingsPage) {
      return;
    }

    // Poll for settings changes every 3 seconds (only on settings page)
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/cms/settings");
        if (response.ok) {
          const result = await response.json();
          const settings = result.data || [];
          
          // Find maintenance_mode and site_lock_mode settings
          const maintenanceSetting = settings.find(
            (s: any) => s.key === "maintenance_mode"
          );
          const siteLockSetting = settings.find(
            (s: any) => s.key === "site_lock_mode"
          );

          if (maintenanceSetting) {
            setMaintenanceMode(maintenanceSetting.value);
          }
          if (siteLockSetting) {
            setSiteLockMode(siteLockSetting.value);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pathname]);

  // Listen for custom event when settings are updated
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { key, value } = event.detail;
      if (key === "maintenance_mode") {
        setMaintenanceMode(value);
      } else if (key === "site_lock_mode") {
        setSiteLockMode(value);
      }
    };

    window.addEventListener(
      "settingsUpdated" as any,
      handleSettingsUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "settingsUpdated" as any,
        handleSettingsUpdate as EventListener
      );
    };
  }, []);

  return (
    <AdminBanner
      maintenanceMode={maintenanceMode}
      siteLockMode={siteLockMode}
    />
  );
}
