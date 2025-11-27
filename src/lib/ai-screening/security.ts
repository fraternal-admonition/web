/**
 * Security utilities for AI Screening
 * Provides authorization checks and rate limiting
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Verify user is authenticated
 * @returns User object if authenticated, null otherwise
 */
export async function verifyAuthentication() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user;
}

/**
 * Verify user has admin role
 * @param userId - User ID to check
 * @returns true if user is admin, false otherwise
 */
export async function verifyAdminRole(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    return userData?.role === 'ADMIN';
}

/**
 * Verify user owns a submission
 * @param userId - User ID to check
 * @param submissionId - Submission ID to verify ownership
 * @returns true if user owns submission, false otherwise
 */
export async function verifySubmissionOwnership(
    userId: string,
    submissionId: string
): Promise<boolean> {
    const supabase = await createClient();

    const { data: submission } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('id', submissionId)
        .eq('user_id', userId)
        .single();

    return !!submission;
}

/**
 * Verify payment was confirmed before triggering screening
 * @param submissionId - Submission ID to check
 * @returns true if payment confirmed, false otherwise
 */
export async function verifyPaymentConfirmed(submissionId: string): Promise<boolean> {
    const adminSupabase = await createAdminClient();

    const { data: payment } = await adminSupabase
        .from('payments')
        .select('status, purpose')
        .eq('submission_id', submissionId)
        .eq('purpose', 'ENTRY_FEE')
        .eq('status', 'PAID')
        .single();

    return !!payment;
}

/**
 * Verify peer verification hasn't already been requested
 * @param submissionId - Submission ID to check
 * @returns true if not already requested, false if already requested
 */
export async function verifyPeerVerificationNotRequested(
    submissionId: string
): Promise<boolean> {
    const supabase = await createClient();

    // Check for existing flag
    const { data: existingFlag } = await supabase
        .from('flags')
        .select('*')
        .eq('entity_type', 'SUBMISSION')
        .eq('entity_id', submissionId)
        .eq('reason', 'PEER_VERIFICATION_REQUESTED')
        .maybeSingle();

    if (existingFlag) {
        return false;
    }

    // Check for existing payment
    const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('purpose', 'PEER_VERIFICATION')
        .in('status', ['CREATED', 'PAID'])
        .maybeSingle();

    return !existingPayment;
}

/**
 * Verify contest phase allows submissions
 * @param contestId - Contest ID to check
 * @returns true if submissions are open, false otherwise
 */
export async function verifyContestPhaseOpen(contestId: string): Promise<boolean> {
    const supabase = await createAdminClient();

    const { data: contest } = await supabase
        .from('contests')
        .select('phase')
        .eq('id', contestId)
        .single();

    return contest?.phase === 'SUBMISSIONS_OPEN';
}

/**
 * Log admin access to screening results
 * @param userId - Admin user ID
 * @param submissionId - Submission ID accessed
 * @param screeningId - Screening ID accessed
 */
export async function logAdminScreeningAccess(
    userId: string,
    submissionId: string,
    screeningId: string
): Promise<void> {
    const adminSupabase = await createAdminClient();

    await adminSupabase.from('audit_logs').insert({
        user_id: userId,
        action: 'VIEW',
        resource_type: 'ai_screening',
        resource_id: screeningId,
        changes: {
            submission_id: submissionId,
            action: 'viewed_screening_results',
        },
    });
}

/**
 * Rate limiting check for peer verification requests
 * Prevents abuse by limiting requests per user per time period
 * @param userId - User ID to check
 * @returns true if within rate limit, false if exceeded
 */
export async function checkPeerVerificationRateLimit(userId: string): Promise<boolean> {
    const adminSupabase = await createAdminClient();

    // Check how many peer verification requests in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentRequests } = await adminSupabase
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .eq('purpose', 'PEER_VERIFICATION')
        .gte('created_at', twentyFourHoursAgo);

    // Allow max 100 peer verification requests per 24 hours
    const MAX_REQUESTS_PER_DAY = 100;
    return (recentRequests?.length || 0) < MAX_REQUESTS_PER_DAY;
}

/**
 * Sanitize sensitive data from logs
 * Removes PII and sensitive information before logging
 * @param data - Data to sanitize
 * @returns Sanitized data
 */
export function sanitizeForLogging(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };

    // Remove sensitive fields
    const sensitiveFields = [
        'email',
        'password',
        'api_key',
        'token',
        'secret',
        'credit_card',
        'ssn',
        'phone',
    ];

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            sanitized[key] = sanitizeForLogging(sanitized[key]);
        }
    }

    return sanitized;
}
