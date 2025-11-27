/**
 * AI Moderation Service
 * Uses OpenAI Moderation API to check content for policy violations
 */

import OpenAI from 'openai';
import { ModerationResult } from '@/types/ai-screening';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Check content for policy violations using OpenAI Moderation API
 * 
 * @param text - The letter text to moderate
 * @returns ModerationResult with flagged status and categories
 * @throws Error if moderation API fails
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
    try {
        const response = await openai.moderations.create({
            input: text,
            model: 'omni-moderation-latest',
        });

        const result = response.results[0];

        return {
            flagged: result.flagged,
            categories: {
                hate: result.categories.hate,
                'hate/threatening': result.categories['hate/threatening'],
                'self-harm': result.categories['self-harm'],
                sexual: result.categories.sexual,
                'sexual/minors': result.categories['sexual/minors'],
                violence: result.categories.violence,
                'violence/graphic': result.categories['violence/graphic'],
            },
            category_scores: result.category_scores as unknown as Record<string, number>,
        };
    } catch (error) {
        console.error('[Moderation] API error:', error);

        // Provide more specific error messages
        if (error instanceof Error) {
            throw new Error(`Moderation API failed: ${error.message}`);
        }

        throw new Error('Moderation API failed with unknown error');
    }
}
