/**
 * AI Translation Service
 * Uses GPT-5-mini to translate letters to multiple languages
 */

import OpenAI from 'openai';
import { TranslationResult } from '@/types/ai-screening';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export interface TranslationConfig {
    modelName: string;
    maxTokens: number;
    temperature: number;
    promptTemplate: string;
}

/**
 * Translate letter to multiple languages (EN, DE, FR, IT, ES)
 * 
 * @param letterText - The letter text to translate
 * @param promptTemplate - The translation prompt with {Letter} placeholder
 * @param config - Model configuration (model name, max tokens, temperature)
 * @returns TranslationResult with all language translations
 * @throws Error if translation API fails or response is invalid
 */
export async function translateLetter(
    letterText: string,
    promptTemplate: string,
    config: TranslationConfig
): Promise<TranslationResult> {
    // Replace {Letter} placeholder with actual letter text
    const prompt = promptTemplate.replace('{Letter}', letterText);

    try {
        // Build request parameters
        const requestParams: any = {
            model: config.modelName,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert translator capable of translating text into multiple languages while preserving meaning and style.',
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
        const translation = JSON.parse(content) as TranslationResult;

        // Validate required fields
        validateTranslationResponse(translation);

        return translation;
    } catch (error) {
        console.error('[Translation] API error:', error);

        if (error instanceof SyntaxError) {
            throw new Error('Failed to parse translation response as JSON');
        }

        if (error instanceof Error) {
            throw new Error(`Translation API failed: ${error.message}`);
        }

        throw new Error('Translation API failed with unknown error');
    }
}

/**
 * Validate translation response has all required fields
 * @throws Error if any required field is missing
 */
function validateTranslationResponse(translation: any): void {
    const requiredFields = ['OLANG', 'EN', 'DE', 'FR', 'IT', 'ES'];

    for (const field of requiredFields) {
        if (!(field in translation)) {
            throw new Error(`Missing required translation field: ${field}`);
        }

        if (typeof translation[field] !== 'string') {
            throw new Error(`Translation field ${field} must be a string`);
        }

        if (field !== 'OLANG' && translation[field].trim().length === 0) {
            throw new Error(`Translation field ${field} cannot be empty`);
        }
    }

    // Validate OLANG is a valid ISO 639-1 code (2 letters)
    if (!/^[a-z]{2}$/i.test(translation.OLANG)) {
        throw new Error('OLANG must be a valid ISO 639-1 language code (2 letters)');
    }

    // Validate translations contain HTML paragraph tags
    const languageFields = ['EN', 'DE', 'FR', 'IT', 'ES'];
    for (const lang of languageFields) {
        if (!translation[lang].includes('<p>')) {
            console.warn(`[Translation] Warning: ${lang} translation does not contain <p> tags`);
        }
    }
}
