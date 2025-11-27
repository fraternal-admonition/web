'use client';

import { useState } from 'react';

interface SiteLockControlProps {
  currentMode: 'off' | 'auth' | 'password';
  onSave: (mode: string, password?: string) => Promise<void>;
  saving: boolean;
  error?: string;
}

/**
 * Custom control for Site Lock setting
 * Allows admin to choose between Off, Authentication, or Password modes
 */
export default function SiteLockControl({
  currentMode,
  onSave,
  saving,
  error,
}: SiteLockControlProps) {
  const [mode, setMode] = useState<'off' | 'auth' | 'password'>(currentMode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const handleModeChange = (newMode: 'off' | 'auth' | 'password') => {
    setMode(newMode);
    setIsDirty(true);
    setLocalError('');
    // Clear password fields when switching away from password mode
    if (newMode !== 'password') {
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleSave = async () => {
    setLocalError('');

    // Validate password if password mode is selected
    if (mode === 'password') {
      if (!password) {
        setLocalError('Password is required for password mode');
        return;
      }

      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters');
        return;
      }

      if (password.length > 128) {
        setLocalError('Password must not exceed 128 characters');
        return;
      }

      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }

      // Save with password
      try {
        await onSave(mode, password);
        setPassword('');
        setConfirmPassword('');
        setIsDirty(false);
      } catch (err) {
        setLocalError('Failed to save password');
      }
    } else {
      // No password needed for off or auth modes
      await onSave(mode);
      setIsDirty(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E0] p-6">
      <div className="mb-4">
        <label className="block text-sm font-semibold text-[#222] mb-1">
          Site Lock Mode
        </label>
        <p className="text-sm text-[#666] mb-4">
          Control who can access your site
        </p>

        {/* Mode selection */}
        <div className="space-y-3">
          <label className="flex items-start cursor-pointer group">
            <input
              type="radio"
              name="site_lock_mode"
              value="off"
              checked={mode === 'off'}
              onChange={(e) => handleModeChange(e.target.value as 'off')}
              className="mt-1 mr-3 text-[#004D40] focus:ring-[#004D40]"
            />
            <div className="flex-1">
              <div className="font-medium text-[#222] group-hover:text-[#004D40] transition-colors">
                Off - Public Access
              </div>
              <div className="text-sm text-[#666]">
                Anyone can access the site without restrictions
              </div>
            </div>
          </label>

          <label className="flex items-start cursor-pointer group">
            <input
              type="radio"
              name="site_lock_mode"
              value="auth"
              checked={mode === 'auth'}
              onChange={(e) => handleModeChange(e.target.value as 'auth')}
              className="mt-1 mr-3 text-[#004D40] focus:ring-[#004D40]"
            />
            <div className="flex-1">
              <div className="font-medium text-[#222] group-hover:text-[#004D40] transition-colors">
                Require Admin Authentication
              </div>
              <div className="text-sm text-[#666]">
                Only administrators can access the site (regular users will be denied)
              </div>
            </div>
          </label>

          <label className="flex items-start cursor-pointer group">
            <input
              type="radio"
              name="site_lock_mode"
              value="password"
              checked={mode === 'password'}
              onChange={(e) => handleModeChange(e.target.value as 'password')}
              className="mt-1 mr-3 text-[#004D40] focus:ring-[#004D40]"
            />
            <div className="flex-1">
              <div className="font-medium text-[#222] group-hover:text-[#004D40] transition-colors">
                Require Password
              </div>
              <div className="text-sm text-[#666]">
                Visitors must enter a shared password to access the site
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Password fields (only shown when password mode selected) */}
      {mode === 'password' && (
        <div className="mt-6 p-4 bg-[#F9F9F7] rounded-lg border border-[#E5E5E0]">
          <div className="mb-4">
            <label
              htmlFor="site_lock_password"
              className="block text-sm font-medium text-[#222] mb-2"
            >
              Set Password
            </label>
            <input
              id="site_lock_password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Enter password (min 8 characters)"
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="site_lock_password_confirm"
              className="block text-sm font-medium text-[#222] mb-2"
            >
              Confirm Password
            </label>
            <input
              id="site_lock_password_confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Confirm password"
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40] focus:border-transparent"
            />
          </div>

          <div className="text-sm text-[#C19A43] bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
            ⚠️ Share this password securely. Anyone with the password can access the site.
          </div>
        </div>
      )}

      {/* Error message */}
      {(error || localError) && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error || localError}
        </div>
      )}

      {/* Save button */}
      {isDirty && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={
              'bg-[#004D40] text-white px-6 py-2 rounded-lg ' +
              'hover:bg-[#00695C] transition-all font-medium shadow-sm ' +
              'disabled:opacity-50 disabled:cursor-not-allowed'
            }
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
