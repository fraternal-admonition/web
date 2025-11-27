// Submission code generation utilities for Letters to Goliath contest

import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

/**
 * Generates a unique submission code in the format: LTG-ABC123
 * - LTG: Contest prefix (Letters to Goliath)
 * - ABC123: 6-character alphanumeric code (no ambiguous characters)
 * 
 * @param contestId - The contest ID (currently unused but kept for future multi-contest support)
 * @param maxRetries - Maximum number of attempts to generate a unique code
 * @returns A unique submission code
 * @throws Error if unable to generate unique code after max retries
 */
export async function generateUniqueSubmissionCode(
  contestId: string,
  maxRetries: number = 10
): Promise<string> {
  const supabase = await createAdminClient();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate 6-character alphanumeric code
    const code = generateAlphanumericCode(6);
    const submissionCode = `LTG-${code}`;
    
    // Check if code already exists
    const { data: existing, error } = await supabase
      .from('submissions')
      .select('id')
      .eq('submission_code', submissionCode)
      .maybeSingle();
    
    if (error) {
      console.error('[SubmissionCode] Error checking uniqueness:', error);
      // Continue to next attempt on error
      continue;
    }
    
    if (!existing) {
      return submissionCode;
    }
    
    console.log(`[SubmissionCode] Code ${submissionCode} already exists, retrying...`);
  }
  
  throw new Error('Failed to generate unique submission code after maximum retries');
}

/**
 * Generates a random alphanumeric code of specified length
 * Uses only uppercase letters and numbers (excludes ambiguous characters: O, 0, I, 1, L)
 * 
 * @param length - Length of the code to generate
 * @returns Random alphanumeric string
 */
function generateAlphanumericCode(length: number): string {
  // Exclude ambiguous characters: O, 0, I, 1, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Validates a submission code format
 * 
 * @param code - The submission code to validate
 * @returns True if the code matches the expected format
 */
export function isValidSubmissionCode(code: string): boolean {
  const pattern = /^LTG-[A-Z2-9]{6}$/;
  return pattern.test(code);
}
