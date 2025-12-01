/**
 * Site Lock Password Verification API
 * Verifies password for password-protected site lock mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { settingsCache } from '@/lib/cms/settings-cache';
import { verifyPassword } from '@/lib/security/password-hash';
import { createPasswordSession } from '@/lib/security/site-lock-session';
import { rateLimiter } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const identifier = `site-lock:${ip}`;

    const rateLimit = await rateLimiter.checkLimit(
      identifier,
      10, // max attempts (increased for testing)
      5 * 60 * 1000 // 5 minutes
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimit.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Get submitted password and redirect URL
    const body = await request.json();
    const { password, redirect } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get settings
    const settings = await settingsCache.get();

    // Check if password mode is active
    if (settings.site_lock_mode !== 'password') {
      return NextResponse.json(
        { error: 'Password protection is not enabled' },
        { status: 400 }
      );
    }

    // Check if password hash exists
    if (!settings.site_lock_password_hash) {
      console.error('[SiteLock] Password mode enabled but no hash configured');
      return NextResponse.json(
        { error: 'Site lock is misconfigured. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(
      password,
      settings.site_lock_password_hash
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Create session
    await createPasswordSession(settings.site_lock_password_hash);

    // Return success with redirect URL
    return NextResponse.json({
      success: true,
      redirect: redirect || '/',
    });
  } catch (error) {
    console.error('[SiteLock] Verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
