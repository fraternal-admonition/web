/**
 * Password hashing utilities using bcrypt
 * Provides secure password hashing and verification for site lock feature
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Secure cost factor balancing security and performance

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise resolving to bcrypt hash
 * @throws Error if password is invalid or hashing fails
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  if (password.length > 128) {
    throw new Error('Password must not exceed 128 characters');
  }
  
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a bcrypt hash
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Validate inputs
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
