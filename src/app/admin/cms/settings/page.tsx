import { requireAdmin } from "@/lib/admin-auth";
import { getAllSettings } from "@/lib/cms/settings-service";
import { SETTING_CATEGORIES } from "@/lib/cms/settings-schema";
import SettingsClient from "./SettingsClient";

export default async function CMSSettingsPage() {
  // Server-side authentication check
  await requireAdmin("/admin/cms/settings");

  // Fetch settings merged with schema
  const settings = await getAllSettings();

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#222] mb-2">
            Site <span className="text-[#C19A43]">Settings</span>
          </h1>
          <p className="text-[#666]">
            Configure your site&apos;s behavior and features
          </p>
        </div>
        
        <SettingsClient 
          settings={settings} 
          categories={SETTING_CATEGORIES}
        />
      </div>
    </div>
  );
}
