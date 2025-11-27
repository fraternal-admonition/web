/**
 * AI Evaluation Service
 * Uses GPT-5-mini to evaluate letter quality and thematic alignment
 */

import OpenAI from 'openai';
import { EvaluationResult } from '@/types/ai-screening';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export interface EvaluationConfig {
    modelName: string;
    maxTokens: number;
    temperature: number;
    promptTemplate: string;
}

/**
 * Evaluate letter quality and thematic alignment using GPT-5-mini
 * 
 * @param letterText - The letter text to evaluate
 * @param promptTemplate - The evaluation prompt with {Letter} placeholder
 * @param config - Model configuration (model name, max tokens, temperature)
 * @returns EvaluationResult with all assessment fields
 * @throws Error if evaluation API fails or response is invalid
 */
export async function evaluateLetter(
    letterText: string,
    promptTemplate: string,
    config: EvaluationConfig
): Promise<EvaluationResult> {
    // Replace {Letter} placeholder with actual letter text
    const prompt = promptTemplate.replace('{Letter}', letterText);

    try {
        // Build request parameters
        const requestParams: any = {
            model: config.modelName,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert literary critic and letter evaluator familiar with Immanuel Kant\'s philosophical legacy.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            max_completion_tokens: config.maxTokens,
            response_format: { type: 'json_object' },
        };

        // Only add temperature if model supports it (gpt-4o-mini only supports default 1)
        if (config.modelName !== 'gpt-4o-mini' && config.modelName !== 'gpt-5-mini') {
            requestParams.temperature = config.temperature;
        }

        const response = await openai.chat.completions.create(requestParams);

        const content = response.choices[0].message.content;

        if (!content) {
            throw new Error('Empty response from OpenAI');
        }

        // Parse JSON response
        const evaluation = JSON.parse(content) as EvaluationResult;

        // Log the response for debugging (sanitized)
        console.log('[Evaluation] Model response keys:', Object.keys(evaluation));
        if (evaluation.Quote) {
            console.log('[Evaluation] Quote keys:', Object.keys(evaluation.Quote));
        }

        // Validate required fields
        validateEvaluationResponse(evaluation);

        return evaluation;
    } catch (error) {
        console.error('[Evaluation] API error:', error);

        if (error instanceof SyntaxError) {
            throw new Error('Failed to parse evaluation response as JSON');
        }

        if (error instanceof Error) {
            throw new Error(`Evaluation API failed: ${error.message}`);
        }

        throw new Error('Evaluation API failed with unknown error');
    }
}

/**
 * Validate evaluation response has all required fields
 * @throws Error if any required field is missing or invalid
 */
function validateEvaluationResponse(evaluation: any): void {
    const requiredFields = [
        'Rating',
        'Summary',
        'Identity',
        'Language',
        'Goethe',
        'Quote',
        'DTSentiment',
        'Corruption',
        'Compensation',
        'Impact',
        'AsGerman',
        'StateInstitute',
    ];

    // Check top-level fields
    for (const field of requiredFields) {
        if (!(field in evaluation)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // Validate nested structures
    if (typeof evaluation.Identity !== 'object' || evaluation.Identity === null) {
        throw new Error('Identity must be an object');
    }

    if (typeof evaluation.Identity.Revealed !== 'boolean') {
        throw new Error('Identity.Revealed must be a boolean');
    }

    if (!evaluation.Identity.Reason || typeof evaluation.Identity.Reason !== 'string') {
        throw new Error('Identity.Reason is required and must be a string');
    }

    // Validate Goethe score
    if (typeof evaluation.Goethe !== 'object' || evaluation.Goethe === null) {
        throw new Error('Goethe must be an object');
    }

    if (typeof evaluation.Goethe.GScore !== 'number') {
        throw new Error('Goethe.GScore must be a number');
    }

    if (evaluation.Goethe.GScore < 1 || evaluation.Goethe.GScore > 5) {
        throw new Error('Goethe.GScore must be between 1 and 5');
    }

    if (!evaluation.Goethe.Explanation || typeof evaluation.Goethe.Explanation !== 'string') {
        throw new Error('Goethe.Explanation is required and must be a string');
    }

    // Validate Rating object
    if (typeof evaluation.Rating !== 'object' || evaluation.Rating === null) {
        throw new Error('Rating must be an object');
    }

    const ratingFields = [
        'Grammatical Accuracy',
        'Essay Structure',
        'Clarity of Expression',
        'Argumentation',
        'Writing Style and Logic',
        'Conclusion',
        'Overall Impression',
    ];

    for (const field of ratingFields) {
        if (typeof evaluation.Rating[field] !== 'number') {
            throw new Error(`Rating.${field} must be a number`);
        }
        if (evaluation.Rating[field] < 1 || evaluation.Rating[field] > 5) {
            throw new Error(`Rating.${field} must be between 1 and 5`);
        }
    }

    // Validate Quote object
    if (typeof evaluation.Quote !== 'object' || evaluation.Quote === null) {
        throw new Error('Quote must be an object');
    }

    if (!evaluation.Quote.QText || typeof evaluation.Quote.QText !== 'string') {
        throw new Error('Quote.QText is required and must be a string');
    }

    if (!evaluation.Quote.Reference || typeof evaluation.Quote.Reference !== 'string') {
        throw new Error('Quote.Reference is required and must be a string');
    }

    // Relevance field is optional - some models may not return it consistently
    // If missing, we'll use an empty string as fallback
    if (!evaluation.Quote.Relevance) {
        evaluation.Quote.Relevance = '';
    }
    
    if (typeof evaluation.Quote.Relevance !== 'string') {
        throw new Error('Quote.Relevance must be a string');
    }

    // Validate Language
    if (!evaluation.Language || typeof evaluation.Language !== 'string') {
        throw new Error('Language is required and must be a string');
    }

    // Validate Summary
    if (!evaluation.Summary || typeof evaluation.Summary !== 'string') {
        throw new Error('Summary is required and must be a string');
    }
}