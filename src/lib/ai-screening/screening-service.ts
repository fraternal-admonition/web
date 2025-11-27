/**
 * AI Screening Service
 * Main orchestrator for the 3-phase AI screening pipeline:
 * 1. Moderation (content safety)
 * 2. Evaluation (quality assessment)
 * 3. Translation (multi-language)
 */

import { createAdminClient } from '@/lib/supabase/server';
import { moderateContent } from './moderation-service';
import { evaluateLetter } from './evaluation-service';
import { translateLetter } from './translation-service';
import { withRetry } from './retry-utils';
import { sendScreeningPassedEmail, sendScreeningFailedEmail } from '@/lib/email';
import { verifyPaymentConfirmed, verifyContestPhaseOpen, sanitizeForLogging } from './security';
import crypto from 'crypto';
import type {
    AIScreeningStatus,
    AIScreeningPhase,
    ModerationResult,
    EvaluationResult,
    TranslationResult,
} from '@/types/ai-screening';

export interface ScreeningConfig {
    modelName: string;
    maxTokens: number;
    temperature: number;
    evaluationPrompt: string;
    translationPrompt: string;
}

/**
 * Main orchestrator for AI screening pipeline
 * Executes all three phases and updates database
 * 
 * @param submissionId - The submission ID to screen
 * @throws Error if screening fails critically
 */
export async function executeAIScreening(submissionId: string): Promise<void> {
    const supabase = await createAdminClient();

    try {
        console.log(`[AI Screening] Starting screening for submission: ${submissionId}`);

        // Fetch submission
        const { data: submission, error: fetchError } = await supabase
            .from('submissions')
            .select('*, contests(*)')
            .eq('id', submissionId)
            .single();

        if (fetchError || !submission) {
            throw new Error(`Submission not found: ${submissionId}`);
        }

        // Security Check 1: Verify payment was confirmed
        const paymentConfirmed = await verifyPaymentConfirmed(submissionId);
        if (!paymentConfirmed) {
            console.error(`[AI Screening] Payment not confirmed for submission: ${submissionId}`);
            throw new Error('Payment not confirmed - screening cannot proceed');
        }

        // Security Check 2: Verify contest phase allows submissions
        const phaseOpen = await verifyContestPhaseOpen(submission.contest_id);
        if (!phaseOpen) {
            console.error(
                `[AI Screening] Contest phase not open for submission: ${submissionId}`
            );
            throw new Error('Contest submissions are closed - screening cannot proceed');
        }

        console.log(`[AI Screening] Security checks passed for submission: ${submissionId}`);

        // Update status to PROCESSING
        await supabase
            .from('submissions')
            .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
            .eq('id', submissionId);

        console.log(`[AI Screening] Submission status updated to PROCESSING`);

        // Load AI configuration from settings
        const config = await loadScreeningConfig();

        // Generate prompt hash for audit trail
        const promptHash = generatePromptHash(config);

        // Initialize screening record
        const screeningId = await initializeScreening(submissionId, config.modelName, promptHash);

        console.log(`[AI Screening] Screening record created: ${screeningId}`);

        // Phase 1: Moderation
        console.log(`[AI Screening] Phase 1: Moderation`);
        const moderationResult = await withRetry(() => moderateContent(submission.body_text));
        await updateScreeningPhase(screeningId, 'MODERATION', { moderation: moderationResult });

        if (moderationResult.flagged) {
            // Content flagged - stop pipeline
            console.log(`[AI Screening] Content flagged by moderation, stopping pipeline`);
            await finalizeScreening(
                screeningId,
                submissionId,
                'FAILED',
                'MODERATION',
                { moderation: moderationResult },
                'Content flagged by moderation'
            );
            return;
        }

        console.log(`[AI Screening] Moderation passed`);

        // Phase 2: Evaluation
        console.log(`[AI Screening] Phase 2: Evaluation`);
        const evaluationResult = await withRetry(() =>
            evaluateLetter(submission.body_text, config.evaluationPrompt, {
                modelName: config.modelName,
                maxTokens: config.maxTokens,
                temperature: config.temperature,
                promptTemplate: config.evaluationPrompt,
            })
        );
        await updateScreeningPhase(screeningId, 'EVALUATION', { evaluation: evaluationResult });

        console.log(`[AI Screening] Evaluation complete`);

        // Determine pass/fail/review status
        const evaluationStatus = determineEvaluationStatus(evaluationResult);
        console.log(`[AI Screening] Evaluation status: ${evaluationStatus}`);

        // Phase 3: Translation (always execute)
        console.log(`[AI Screening] Phase 3: Translation`);
        const translationResult = await withRetry(() =>
            translateLetter(submission.body_text, config.translationPrompt, {
                modelName: config.modelName,
                maxTokens: config.maxTokens,
                temperature: config.temperature,
                promptTemplate: config.translationPrompt,
            })
        );
        await updateScreeningPhase(screeningId, 'TRANSLATION', { translations: translationResult });

        console.log(`[AI Screening] Translation complete`);

        // Finalize screening
        await finalizeScreening(screeningId, submissionId, evaluationStatus, 'COMPLETE', {
            moderation: moderationResult,
            evaluation: evaluationResult,
            translations: translationResult,
        });

        console.log(`[AI Screening] Screening complete for submission: ${submissionId}`);
    } catch (error) {
        // Sanitize error before logging (remove sensitive data)
        const sanitizedError = sanitizeForLogging(error);
        console.error('[AI Screening] Error:', sanitizedError);

        // Mark as REVIEW for manual handling
        await supabase
            .from('submissions')
            .update({ status: 'SUBMITTED', updated_at: new Date().toISOString() })
            .eq('id', submissionId);

        await supabase.from('ai_screenings').upsert({
            submission_id: submissionId,
            status: 'REVIEW',
            phase: 'COMPLETE',
            notes: `Technical error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            scores: {},
            created_at: new Date().toISOString(),
        });

        throw error;
    }
}

/**
 * Load AI configuration from cms_settings
 */
async function loadScreeningConfig(): Promise<ScreeningConfig> {
    const supabase = await createAdminClient();

    const { data: settings } = await supabase
        .from('cms_settings')
        .select('key, value_json')
        .in('key', [
            'ai_model_name',
            'ai_max_tokens',
            'ai_temperature',
            'ai_evaluation_prompt',
            'ai_translation_prompt',
        ]);

    const settingsMap = new Map(settings?.map((s) => [s.key, s.value_json]) || []);

    return {
        modelName: (settingsMap.get('ai_model_name') as string) || 'gpt-5-mini',
        maxTokens: (settingsMap.get('ai_max_tokens') as number) || 8000,
        temperature: (settingsMap.get('ai_temperature') as number) || 0.2,
        evaluationPrompt: (settingsMap.get('ai_evaluation_prompt') as string) || '',
        translationPrompt: (settingsMap.get('ai_translation_prompt') as string) || '',
    };
}

/**
 * Generate SHA-256 hash of prompts for audit trail
 */
function generatePromptHash(config: ScreeningConfig): string {
    const combined = config.evaluationPrompt + config.translationPrompt;
    return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Initialize screening record in database
 */
async function initializeScreening(
    submissionId: string,
    modelName: string,
    promptHash: string
): Promise<string> {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from('ai_screenings')
        .insert({
            submission_id: submissionId,
            status: 'REVIEW',
            phase: 'MODERATION',
            model_name: modelName,
            prompt_hash: promptHash,
            scores: {},
        })
        .select('id')
        .single();

    if (error || !data) {
        throw new Error(`Failed to initialize screening: ${error?.message}`);
    }

    return data.id;
}

/**
 * Update screening phase and scores
 */
async function updateScreeningPhase(
    screeningId: string,
    phase: AIScreeningPhase,
    scores: Record<string, any>
): Promise<void> {
    const supabase = await createAdminClient();

    // Fetch current scores
    const { data: current } = await supabase
        .from('ai_screenings')
        .select('scores')
        .eq('id', screeningId)
        .single();

    const updatedScores = { ...(current?.scores || {}), ...scores };

    await supabase
        .from('ai_screenings')
        .update({
            phase,
            scores: updatedScores,
        })
        .eq('id', screeningId);
}

/**
 * Determine evaluation status based on criteria
 */
function determineEvaluationStatus(evaluation: EvaluationResult): AIScreeningStatus {
    // FAILED criteria - at or below threshold = FAIL
    if (evaluation.Identity.Revealed) {
        return 'FAILED';
    }
    if (evaluation.Goethe.GScore <= 2.0) {
        return 'FAILED';
    }
    if (evaluation.Rating['Overall Impression'] <= 2.5) {
        return 'FAILED';
    }
    if (evaluation.Rating['Grammatical Accuracy'] <= 2.0) {
        return 'FAILED';
    }
    if (evaluation.Language !== 'English') {
        return 'FAILED';
    }

    // PASSED - everything above thresholds
    return 'PASSED';
}

/**
 * Finalize screening and update submission status
 */
async function finalizeScreening(
    screeningId: string,
    submissionId: string,
    status: AIScreeningStatus,
    phase: AIScreeningPhase,
    scores: Record<string, any>,
    notes?: string
): Promise<void> {
    const supabase = await createAdminClient();

    // Update screening record
    await supabase
        .from('ai_screenings')
        .update({
            status,
            phase,
            scores,
            notes: notes || null,
        })
        .eq('id', screeningId);

    // Update submission status
    const submissionStatus = status === 'PASSED' ? 'SUBMITTED' : status === 'FAILED' ? 'ELIMINATED' : 'SUBMITTED';

    await supabase
        .from('submissions')
        .update({
            status: submissionStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

    console.log(`[AI Screening] Finalized: status=${status}, submission_status=${submissionStatus}`);

    // Send email notification (don't fail screening if email fails)
    try {
        // Fetch submission details for email
        const { data: submission } = await supabase
            .from('submissions')
            .select('submission_code, title, user_id')
            .eq('id', submissionId)
            .single();

        if (submission && submission.user_id) {
            // Fetch user email
            const { data: userData } = await supabase.auth.admin.getUserById(submission.user_id);

            if (userData?.user?.email) {
                const emailData = {
                    submission_code: submission.submission_code,
                    title: submission.title,
                    submission_id: submissionId,
                };

                // Send appropriate email based on status
                if (status === 'PASSED') {
                    const result = await sendScreeningPassedEmail(userData.user.email, emailData);
                    if (result.success) {
                        console.log(`[AI Screening] Passed email sent to ${userData.user.email}`);
                    } else {
                        console.error('[AI Screening] Failed to send passed email:', result.error);
                    }
                } else if (status === 'FAILED') {
                    const result = await sendScreeningFailedEmail(userData.user.email, emailData);
                    if (result.success) {
                        console.log(`[AI Screening] Failed email sent to ${userData.user.email}`);
                    } else {
                        console.error('[AI Screening] Failed to send failed email:', result.error);
                    }
                }
                // Note: REVIEW status doesn't send email (admin will handle manually)
            }
        }
    } catch (emailError) {
        // Log but don't fail the screening
        console.error('[AI Screening] Error sending email notification:', emailError);
    }
}
