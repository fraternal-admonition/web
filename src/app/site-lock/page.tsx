'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

/**
 * Site Lock Password Prompt Page
 * Shown when password-protected site lock is enabled
 */
export default function SiteLockPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[SiteLock] Submitting password...');
      const response = await fetch('/api/site-lock/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, redirect }),
      });

      console.log('[SiteLock] Response status:', response.status);
      const data = await response.json();
      console.log('[SiteLock] Response data:', data);

      if (response.ok) {
        // Success - redirect to original page
        console.log('[SiteLock] Password verified, redirecting to:', data.redirect);
        
        // Use window.location for a hard redirect (ensures cookies are sent)
        window.location.href = data.redirect;
      } else {
        // Show error
        console.log('[SiteLock] Error:', data.error);
        setError(data.error || 'Incorrect password');
        setPassword(''); // Clear password field
        setLoading(false);
      }
    } catch (err) {
      console.error('[SiteLock] Verification error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg border border-[#E5E5E0] p-8">
          {/* Logo */}
          <div className="mb-6 text-center">
            <Image
              src="/logo.png"
              alt="Site Logo"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-serif text-[#222] text-center mb-2">
            Password Protected
          </h1>
          <p className="text-[#666] text-center mb-6">
            This site requires a password to access
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={loading}
                autoFocus
                className={
                  'w-full px-4 py-3 border rounded-lg ' +
                  'focus:outline-none focus:ring-2 focus:ring-[#004D40] ' +
                  'focus:border-transparent transition-all ' +
                  'disabled:opacity-50 disabled:cursor-not-allowed ' +
                  (error ? 'border-red-500' : 'border-[#E5E5E0]')
                }
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !password}
              className={
                'w-full bg-[#004D40] text-white py-3 rounded-lg ' +
                'font-medium transition-all shadow-sm ' +
                'hover:bg-[#00695C] ' +
                'disabled:opacity-50 disabled:cursor-not-allowed'
              }
            >
              {loading ? 'Verifying...' : 'Access Site'}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-sm text-[#999] mt-4">
          Contact the site administrator if you need access
        </p>
      </div>
    </div>
  );
}
