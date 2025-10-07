"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Setting = {
  id: string;
  key: string;
  value_json: Record<string, unknown>;
  updated_at: string;
};

export default function CMSSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<Setting[]>([]);
  const [newSetting, setNewSetting] = useState({ key: "", value: "" });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/cms/settings");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch settings");
      }

      setSettings(result.data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (
    id: string,
    key: string,
    value: string
  ) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value;
      }

      const response = await fetch(`/api/admin/cms/settings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          value_json: parsedValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update setting");
      }

      setSuccess("Setting updated successfully");
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let parsedValue: unknown;
      try {
        parsedValue = JSON.parse(newSetting.value);
      } catch {
        parsedValue = newSetting.value;
      }

      const response = await fetch("/api/admin/cms/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: newSetting.key,
          value_json: parsedValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create setting");
      }

      setSuccess("Setting created successfully");
      setNewSetting({ key: "", value: "" });
      setShowNewForm(false);
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create setting");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this setting?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/cms/settings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete setting");
      }

      setSuccess("Setting deleted successfully");
      await fetchSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete setting");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CMS Settings</h1>
          <p className="mt-2 text-gray-600">
            Configure site-wide settings and feature flags
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showNewForm ? "Cancel" : "+ New Setting"}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* New Setting Form */}
      {showNewForm && (
        <form
          onSubmit={handleCreateSetting}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Setting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key *
              </label>
              <input
                type="text"
                required
                value={newSetting.key}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, key: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="site_lock_enabled"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value (JSON) *
              </label>
              <input
                type="text"
                required
                value={newSetting.value}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, value: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder='{"enabled": true}'
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Setting"}
            </button>
          </div>
        </form>
      )}

      {/* Settings List */}
      {settings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No settings yet. Create your first setting!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <SettingCard
              key={setting.id}
              setting={setting}
              onUpdate={handleUpdateSetting}
              onDelete={handleDeleteSetting}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SettingCard({
  setting,
  onUpdate,
  onDelete,
  saving,
}: {
  setting: Setting;
  onUpdate: (id: string, key: string, value: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [key, setKey] = useState(setting.key);
  const [value, setValue] = useState(
    JSON.stringify(setting.value_json, null, 2)
  );

  const handleSave = async () => {
    await onUpdate(setting.id, key, value);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value (JSON)
            </label>
            <textarea
              rows={6}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {setting.key}
              </h3>
              <p className="text-sm text-gray-500">
                Updated: {new Date(setting.updated_at).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-900 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(setting.id)}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
          <pre className="bg-gray-50 rounded p-4 text-sm overflow-x-auto">
            {JSON.stringify(setting.value_json, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
