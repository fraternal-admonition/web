"use client";

import { useState } from "react";
import { SettingValue, SettingCategory } from "@/lib/cms/setting-types";
import SettingControl from "@/components/admin/settings/SettingControl";
import SiteLockControl from "@/components/admin/settings/SiteLockControl";

export default function SettingsClient({
  settings,
  categories,
}: {
  settings: SettingValue[];
  categories: SettingCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSave = async (key: string, value: unknown) => {
    setSaving(key);
    setErrors({});
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/admin/cms/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save setting');
      }
      
      // Dispatch custom event to notify banner of setting change
      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: { key, value },
        })
      );
      
      setSuccess(`Setting updated successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setErrors({ [key]: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(null);
    }
  };

  // Special handler for site lock that saves both mode and password
  const handleSiteLockSave = async (mode: string, password?: string) => {
    setSaving('site_lock_mode');
    setErrors({});
    setSuccess(null);

    try {
      // Save the mode
      const modeResponse = await fetch('/api/admin/cms/settings/site_lock_mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: mode }),
      });

      if (!modeResponse.ok) {
        const result = await modeResponse.json();
        throw new Error(result.error || 'Failed to save site lock mode');
      }

      // If password mode and password provided, save the password
      if (mode === 'password' && password) {
        const passwordResponse = await fetch('/api/admin/cms/settings/site_lock_password_hash', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: password }), // API will hash it
        });

        if (!passwordResponse.ok) {
          const result = await passwordResponse.json();
          throw new Error(result.error || 'Failed to save password');
        }
      }

      // Dispatch custom event to notify banner
      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: { key: 'site_lock_mode', value: mode },
        })
      );

      setSuccess('Site lock settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setErrors({ site_lock_mode: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(null);
    }
  };
  
  const settingsByCategory = categories.map(category => ({
    ...category,
    settings: settings.filter(s => s.definition.category === category.id),
  }));
  
  return (
    <div>
      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-[#004D40]/10 border border-[#004D40]/20 text-[#004D40] px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      
      {/* Category Tabs */}
      <div className="mb-6 border-b border-[#E5E5E0]">
        <nav className="flex space-x-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeCategory === category.id
                  ? 'border-[#C19A43] text-[#222]'
                  : 'border-transparent text-[#666] hover:text-[#222] hover:border-[#E5E5E0]'
              }`}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Settings for Active Category */}
      {settingsByCategory
        .filter(cat => cat.id === activeCategory)
        .map(category => (
          <div key={category.id}>
            <p className="text-[#666] mb-6">{category.description}</p>
            
            <div className="space-y-6">
              {category.settings.map(setting => {
                // Use custom SiteLockControl for site_lock_mode
                if (setting.key === 'site_lock_mode') {
                  return (
                    <SiteLockControl
                      key={setting.key}
                      currentMode={setting.value as 'off' | 'auth' | 'password'}
                      onSave={handleSiteLockSave}
                      saving={saving === 'site_lock_mode'}
                      error={errors['site_lock_mode']}
                    />
                  );
                }

                // Skip site_lock_password_hash - it's managed by SiteLockControl
                if (setting.key === 'site_lock_password_hash') {
                  return null;
                }

                // Use default SettingControl for other settings
                return (
                  <SettingControl
                    key={setting.key}
                    setting={setting}
                    onSave={handleSave}
                    saving={saving === setting.key}
                    error={errors[setting.key]}
                  />
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
