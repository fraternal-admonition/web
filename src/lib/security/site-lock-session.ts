/**
 * Site Lock Session Management
 * Manages password-based access sessions for site lock feature
 * Separate from Supabase auth sessions - this is for the shared password mode
 * 
 * Uses signed cookies to store session data (works across Edge Runtime and Node.js)
 */

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'site_lock_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Secret for signing session data (in production, use env variable)
const SESSION_SECRET = process.env.SITE_LOCK_SESSION_SECRET || 'default-secret-change-in-production';

interface SessionPayload {
  createdAt: number;
  passwordHash: string; // Store hash to invalidate if password changes
}

/**
 * Sign session data using Web Crypto API (works in Edge Runtime)
 */
async function signSessionData(data: SessionPayload): Promise<string> {
  const payload = JSON.stringify(data);
  
  // Convert secret to key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SESSION_SECRET);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the payload
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  // Convert to hex
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Combine payload and signature
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

/**
 * Verify and decode session data using Web Crypto API
 */
async function verifySessionData(signedData: string): Promise<SessionPayload | null> {
  try {
    const decoded = JSON.parse(Buffer.from(signedData, 'base64').toString());
    const { payload, signature } = decoded;
    
    // Convert secret to key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Verify signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    return JSON.parse(payload);
  } catch (error) {
    console.error('[SiteLockSession] Failed to verify session data:', error);
    return null;
  }
}

/**
 * Create a new password session after successful password verification
 * @param passwordHash - The current password hash (to detect password changes)
 * @returns The signed session data
 */
export async function createPasswordSession(passwordHash: string): Promise<string> {
  // Create session payload
  const sessionPayload: SessionPayload = {
    createdAt: Date.now(),
    passwordHash,
  };
  
  // Sign the session data
  const signedData = await signSessionData(sessionPayload);
  
  // Set secure HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedData, {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  return signedData;
}

/**
 * Validate a password session
 * Checks if session exists, is not expired, and password hasn't changed
 * @param currentPasswordHash - The current password hash from settings
 * @param request - Optional NextRequest for middleware context
 * @returns true if session is valid, false otherwise
 */
export async function validatePasswordSession(
  currentPasswordHash: string,
  request?: NextRequest
): Promise<boolean> {
  try {
    let signedData: string | undefined;
    
    // If called from middleware, use request.cookies
    if (request) {
      signedData = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    } else {
      // If called from server component/API route, use cookies()
      const cookieStore = await cookies();
      signedData = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }
    
    if (!signedData) {
      return false;
    }
    
    // Verify and decode session data
    const sessionData = await verifySessionData(signedData);
    
    if (!sessionData) {
      return false;
    }
    
    // Check if password has changed since session was created
    if (sessionData.passwordHash !== currentPasswordHash) {
      return false;
    }
    
    // Check if session is expired (7 days)
    const age = Date.now() - sessionData.createdAt;
    const maxAgeMs = SESSION_MAX_AGE * 1000;
    
    if (age > maxAgeMs) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[SiteLockSession] Validation error:', error);
    return false;
  }
}

/**
 * Invalidate all password sessions
 * Called when password is changed or mode is switched
 * Note: With signed cookies, sessions are automatically invalid when password changes
 * This function is kept for API compatibility
 */
export function invalidateAllPasswordSessions(): void {
  // Sessions are automatically invalid when password changes (hash mismatch)
}

/**
 * Delete current session
 * Called on explicit logout or when session becomes invalid
 */
export async function deletePasswordSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    
    // Delete cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error('[SiteLockSession] Delete error:', error);
  }
}

/**
 * Get session statistics (for monitoring/debugging)
 * Note: With signed cookies, we can't track total sessions
 */
export function getSessionStats(): {
  totalSessions: number;
  oldestSession: number | null;
  newestSession: number | null;
} {
  return {
    totalSessions: -1, // Unknown with cookie-based sessions
    oldestSession: null,
    newestSession: null,
  };
}

/**
 * Clean up expired sessions (optional maintenance function)
 * Note: With signed cookies, cleanup happens automatically
 */
export function cleanupExpiredSessions(): number {
  // No cleanup needed with cookie-based sessions
  return 0;
}
