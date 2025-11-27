# Design Document

## Overview

The AI Screening Pipeline is a critical feature that automatically evaluates submitted letters immediately after payment confirmation. It replaces the previous separate "AI Filtering" phase by integrating screening directly into the submission workflow, providing instant feedback to users.

The pipeline consists of three sequential phases executed automatically:

1. **AI Moderation** - Silent content safety check using OpenAI Moderation API
2. **AI Evaluation** - Quality and thematic assessment using GPT-5-mini with customizable prompts
3. **AI Translation** - Multi-language translation to EN, DE, FR, IT, ES

The design prioritizes user experience by presenting evaluation and translation results together on a unified results page, while keeping moderation silent unless content is flagged. Users who disagree with AI elimination can request peer verification for $20, triggering a separate review process (to be implemented in a future spec).

Admin controls allow full customization of prompts and model parameters through the CMS settings interface, ensuring the screening criteria can evolve without code changes.

## Architecture

### High-Level Flow

```
Payment Confirmed (Stripe Webhook)
         ↓
Update submission status to 'PROCESSING'
         ↓
┌────────────────────────────────────────┐
│     AI Screening Pipeline Service      │
├────────────────────────────────────────┤
│  Phase 1: Moderation                   │
│  - OpenAI Moderation API               │
│  - Check: Hate, Violence, Sexual, etc. │
│  - If flagged → STOP, mark FAILED      │
│  - If clean → Continue                 │
├────────────────────────────────────────┤
│  Phase 2: Evaluation                   │
│  - GPT-5-mini with custom prompt       │
│  - Parse JSON response                 │
│  - Check pass/fail criteria            │
│  - Store all scores                    │
├────────────────────────────────────────┤
│  Phase 3: Translation                  │
│  - GPT-5-mini with translation prompt  │
│  - Generate EN, DE, FR, IT, ES         │
│  - Store translations                  │
└────────────────────────────────────────┘
         ↓
Update submission status (SUBMITTED/ELIMINATED)
         ↓
Create ai_screenings record
         ↓
Send email notification
         ↓
User views results page
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Stripe Webhook Handler                    │
│  /api/webhooks/stripe                                        │
│  - Verify signature                                          │
│  - Update payment status                                     │
│  - Trigger AI screening                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Screening Service (Background)               │
│  src/lib/ai-screening/screening-service.ts                  │
│  - Orchestrates 3 phases                                     │
│  - Handles errors and retries                                │
│  - Updates database                                          │
└─────────────────────────────────────────────────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Moderation  │  │  Evaluation  │  │ Translation  │
│   Service    │  │   Service    │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
```


## Components and Interfaces

### 1. Database Schema Updates

**ai_screenings table** (already exists, needs new fields):
```sql
-- Add new columns for comprehensive screening data
ALTER TABLE ai_screenings 
ADD COLUMN IF NOT EXISTS phase TEXT CHECK (phase IN ('MODERATION', 'EVALUATION', 'TRANSLATION', 'COMPLETE'));

-- Update scores JSONB structure to include:
-- {
--   "moderation": { "flagged": false, "categories": [] },
--   "evaluation": { 
--     "Rating": {...}, 
--     "Summary": "...", 
--     "Identity": {...}, 
--     "Language": "English",
--     "Goethe": {...},
--     "Quote": {...},
--     "DTSentiment": "...",
--     "Corruption": "...",
--     "Compensation": "...",
--     "Impact": "...",
--     "AsGerman": "...",
--     "StateInstitute": "..."
--   },
--   "translations": {
--     "OLANG": "en",
--     "EN": "<p>...</p>",
--     "DE": "<p>...</p>",
--     "FR": "<p>...</p>",
--     "IT": "<p>...</p>",
--     "ES": "<p>...</p>"
--   }
-- }
```

**submissions table** (update status enum):
```sql
-- Add new statuses for screening workflow
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'ELIMINATED';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'PEER_VERIFICATION_PENDING';
```

**payments table** (add new purpose):
```sql
-- Add PEER_VERIFICATION purpose
ALTER TYPE payment_purpose ADD VALUE IF NOT EXISTS 'PEER_VERIFICATION';
```

**cms_settings** (new AI configuration keys):
```sql
-- Insert default AI settings
INSERT INTO cms_settings (key, value_json) VALUES
  ('ai_model_name', '"gpt-5-mini"'),
  ('ai_max_tokens', '8000'),
  ('ai_temperature', '0.2'),
  ('ai_moderation_prompt', '"Check this letter for content policy violations..."'),
  ('ai_evaluation_prompt', '"<instructions>Analyze the letter...</instructions>"'),
  ('ai_translation_prompt', '"Translate the letter to multiple languages..."')
ON CONFLICT (key) DO NOTHING;
```

### 2. TypeScript Types

```typescript
// src/types/ai-screening.ts

export type AIScreeningPhase = 
  | 'MODERATION' 
  | 'EVALUATION' 
  | 'TRANSLATION' 
  | 'COMPLETE';

export type AIScreeningStatus = 
  | 'PASSED' 
  | 'FAILED' 
  | 'REVIEW';

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    'self-harm': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: Record<string, number>;
}

export interface EvaluationRating {
  'Grammatical Accuracy': number;
  'Essay Structure': number;
  'Clarity of Expression': number;
  'Argumentation': number;
  'Writing Style and Logic': number;
  'Conclusion': number;
  'Overall Impression': number;
}

export interface EvaluationResult {
  Rating: EvaluationRating;
  Summary: string;
  Identity: {
    Revealed: boolean;
    Reason: string;
  };
  Language: string;
  Goethe: {
    GScore: number;
    Explanation: string;
  };
  Quote: {
    QText: string;
    Reference: string;
    Relevance: string;
  };
  DTSentiment: string;
  Corruption: string;
  Compensation: string;
  Impact: string;
  AsGerman: string;
  StateInstitute: string;
}

export interface TranslationResult {
  OLANG: string;
  EN: string;
  DE: string;
  FR: string;
  IT: string;
  ES: string;
}

export interface AIScreeningScores {
  moderation?: ModerationResult;
  evaluation?: EvaluationResult;
  translations?: TranslationResult;
}

export interface AIScreening {
  id: string;
  submission_id: string;
  status: AIScreeningStatus;
  phase: AIScreeningPhase;
  model_name: string | null;
  model_version: string | null;
  prompt_hash: string | null;
  scores: AIScreeningScores;
  notes: string | null;
  created_at: string;
}
```


### 3. AI Screening Service

```typescript
// src/lib/ai-screening/screening-service.ts

import { createAdminClient } from '@/lib/supabase/server';
import { moderateContent } from './moderation-service';
import { evaluateLetter } from './evaluation-service';
import { translateLetter } from './translation-service';
import { sendScreeningResultsEmail } from '@/lib/email';
import crypto from 'crypto';

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
 */
export async function executeAIScreening(submissionId: string): Promise<void> {
  const supabase = await createAdminClient();
  
  try {
    // Fetch submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*, contests(*)')
      .eq('id', submissionId)
      .single();
    
    if (fetchError || !submission) {
      throw new Error(`Submission not found: ${submissionId}`);
    }
    
    // Update status to PROCESSING
    await supabase
      .from('submissions')
      .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
      .eq('id', submissionId);
    
    // Load AI configuration from settings
    const config = await loadScreeningConfig();
    
    // Generate prompt hash for audit
    const promptHash = generatePromptHash(config);
    
    // Initialize screening record
    const screeningId = await initializeScreening(submissionId, config.modelName, promptHash);
    
    // Phase 1: Moderation
    const moderationResult = await moderateContent(submission.body_text);
    await updateScreeningPhase(screeningId, 'MODERATION', { moderation: moderationResult });
    
    if (moderationResult.flagged) {
      // Content flagged - stop pipeline
      await finalizeScreening(screeningId, submissionId, 'FAILED', 'MODERATION', moderationResult);
      return;
    }
    
    // Phase 2: Evaluation
    const evaluationResult = await evaluateLetter(
      submission.body_text,
      config.evaluationPrompt,
      config
    );
    await updateScreeningPhase(screeningId, 'EVALUATION', { evaluation: evaluationResult });
    
    // Determine pass/fail status
    const evaluationStatus = determineEvaluationStatus(evaluationResult);
    
    // Phase 3: Translation (always execute)
    const translationResult = await translateLetter(
      submission.body_text,
      config.translationPrompt,
      config
    );
    await updateScreeningPhase(screeningId, 'TRANSLATION', { translations: translationResult });
    
    // Finalize screening
    await finalizeScreening(screeningId, submissionId, evaluationStatus, 'COMPLETE', {
      moderation: moderationResult,
      evaluation: evaluationResult,
      translations: translationResult,
    });
    
  } catch (error) {
    console.error('[AI Screening] Error:', error);
    
    // Mark as REVIEW for manual handling
    await supabase
      .from('submissions')
      .update({ status: 'SUBMITTED', updated_at: new Date().toISOString() })
      .eq('id', submissionId);
    
    await supabase
      .from('ai_screenings')
      .update({
        status: 'REVIEW',
        notes: `Technical error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
      .eq('submission_id', submissionId);
    
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
  
  const settingsMap = new Map(settings?.map(s => [s.key, s.value_json]) || []);
  
  return {
    modelName: settingsMap.get('ai_model_name') || 'gpt-5-mini',
    maxTokens: settingsMap.get('ai_max_tokens') || 8000,
    temperature: settingsMap.get('ai_temperature') || 0.2,
    evaluationPrompt: settingsMap.get('ai_evaluation_prompt') || '',
    translationPrompt: settingsMap.get('ai_translation_prompt') || '',
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
 * Determine evaluation status based on criteria
 */
function determineEvaluationStatus(evaluation: EvaluationResult): AIScreeningStatus {
  // FAILED criteria
  if (evaluation.Identity.Revealed) return 'FAILED';
  if (evaluation.Goethe.GScore < 2.0) return 'FAILED';
  if (evaluation.Rating['Overall Impression'] < 2.5) return 'FAILED';
  if (evaluation.Rating['Grammatical Accuracy'] < 2.0) return 'FAILED';
  
  // REVIEW criteria
  if (evaluation.Language !== 'English') return 'REVIEW';
  if (evaluation.Goethe.GScore >= 2.0 && evaluation.Goethe.GScore < 2.5) return 'REVIEW';
  if (evaluation.Rating['Overall Impression'] >= 2.5 && evaluation.Rating['Overall Impression'] < 3.0) return 'REVIEW';
  
  // PASSED
  return 'PASSED';
}
```


### 4. Moderation Service

```typescript
// src/lib/ai-screening/moderation-service.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Check content for policy violations using OpenAI Moderation API
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({
      input: text,
      model: 'text-moderation-latest',
    });
    
    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
    };
  } catch (error) {
    console.error('[Moderation] API error:', error);
    throw new Error('Moderation API failed');
  }
}
```

### 5. Evaluation Service

```typescript
// src/lib/ai-screening/evaluation-service.ts

import OpenAI from 'openai';
import { ScreeningConfig } from './screening-service';
import { EvaluationResult } from '@/types/ai-screening';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Evaluate letter quality and thematic alignment
 */
export async function evaluateLetter(
  letterText: string,
  promptTemplate: string,
  config: ScreeningConfig
): Promise<EvaluationResult> {
  const prompt = promptTemplate.replace('{Letter}', letterText);
  
  try {
    const response = await openai.chat.completions.create({
      model: config.modelName,
      messages: [
        { role: 'system', content: 'You are an expert literary critic and essay evaluator.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    const evaluation = JSON.parse(content) as EvaluationResult;
    
    // Validate required fields
    validateEvaluationResponse(evaluation);
    
    return evaluation;
  } catch (error) {
    console.error('[Evaluation] API error:', error);
    throw new Error('Evaluation API failed');
  }
}

/**
 * Validate evaluation response has all required fields
 */
function validateEvaluationResponse(evaluation: any): void {
  const required = [
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
  
  for (const field of required) {
    if (!(field in evaluation)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate nested structures
  if (!evaluation.Identity.Revealed === undefined) {
    throw new Error('Identity.Revealed is required');
  }
  
  if (typeof evaluation.Goethe.GScore !== 'number') {
    throw new Error('Goethe.GScore must be a number');
  }
}
```

### 6. Translation Service

```typescript
// src/lib/ai-screening/translation-service.ts

import OpenAI from 'openai';
import { ScreeningConfig } from './screening-service';
import { TranslationResult } from '@/types/ai-screening';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Translate letter to multiple languages
 */
export async function translateLetter(
  letterText: string,
  promptTemplate: string,
  config: ScreeningConfig
): Promise<TranslationResult> {
  const prompt = promptTemplate.replace('{Letter}', letterText);
  
  try {
    const response = await openai.chat.completions.create({
      model: config.modelName,
      messages: [
        { role: 'system', content: 'You are an expert translator.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    const translation = JSON.parse(content) as TranslationResult;
    
    // Validate required fields
    validateTranslationResponse(translation);
    
    return translation;
  } catch (error) {
    console.error('[Translation] API error:', error);
    throw new Error('Translation API failed');
  }
}

/**
 * Validate translation response has all required fields
 */
function validateTranslationResponse(translation: any): void {
  const required = ['OLANG', 'EN', 'DE', 'FR', 'IT', 'ES'];
  
  for (const field of required) {
    if (!(field in translation)) {
      throw new Error(`Missing required translation: ${field}`);
    }
  }
}
```


### 7. Webhook Integration

```typescript
// Update to src/app/api/webhooks/stripe/route.ts

// After updating submission to SUBMITTED, trigger AI screening
if (event.type === "checkout.session.completed") {
  // ... existing payment processing code ...
  
  // Trigger AI screening asynchronously
  executeAIScreening(submissionId).catch(error => {
    console.error('[Webhook] AI screening failed:', error);
    // Error is logged but doesn't fail the webhook
    // Submission will be marked for manual review
  });
}
```

### 8. Screening Results Page

```typescript
// src/app/contest/screening-results/[submissionId]/page.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ScreeningResultsClient from './ScreeningResultsClient';

export default async function ScreeningResultsPage({
  params,
}: {
  params: { submissionId: string };
}) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin');
  
  // Fetch submission with screening results
  const { data: submission } = await supabase
    .from('submissions')
    .select(`
      *,
      ai_screenings(*),
      contests(title)
    `)
    .eq('id', params.submissionId)
    .eq('user_id', user.id)
    .single();
  
  if (!submission) {
    redirect('/dashboard');
  }
  
  return <ScreeningResultsClient submission={submission} />;
}
```

```typescript
// src/app/contest/screening-results/[submissionId]/ScreeningResultsClient.tsx

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ScreeningResultsClient({ submission }: any) {
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const screening = submission.ai_screenings[0];
  const scores = screening?.scores || {};
  
  const passed = screening?.status === 'PASSED';
  const failed = screening?.status === 'FAILED';
  const review = screening?.status === 'REVIEW';
  
  // Check if moderation failed
  const moderationFailed = scores.moderation?.flagged;
  
  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Screening Results</h1>
        <p className="text-muted-foreground">
          Submission Code: <span className="font-mono font-bold">{submission.submission_code}</span>
        </p>
      </div>
      
      {/* Status Banner */}
      <Card className="p-6 mb-8">
        {passed && (
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Your letter has passed AI screening</h2>
              <p className="text-sm">It is now proceeding to peer evaluation</p>
            </div>
          </div>
        )}
        
        {failed && !userChoice && (
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Your letter has been eliminated by the AI system</h2>
              <p className="text-sm">Please review the details below</p>
            </div>
          </div>
        )}
        
        {review && (
          <div className="flex items-center gap-3 text-yellow-600">
            <AlertCircle className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Your letter is under manual review</h2>
              <p className="text-sm">We'll notify you when the review is complete</p>
            </div>
          </div>
        )}
      </Card>
      
      {/* Moderation Results (only if failed) */}
      {moderationFailed && (
        <Card className="p-6 mb-8 border-red-200">
          <h3 className="text-lg font-bold mb-2">Content Policy Violation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your letter was flagged for the following category:
          </p>
          <div className="space-y-2">
            {Object.entries(scores.moderation.categories)
              .filter(([_, flagged]) => flagged)
              .map(([category]) => (
                <div key={category} className="px-3 py-2 bg-red-50 rounded">
                  {category.replace(/\//g, ' / ').replace(/-/g, ' ')}
                </div>
              ))}
          </div>
        </Card>
      )}
      
      {/* Evaluation Results (only if moderation passed) */}
      {!moderationFailed && scores.evaluation && (
        <>
          {/* Rating Scores */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-bold mb-4">Evaluation Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(scores.evaluation.Rating).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm">{key}</span>
                  <span className="font-bold">{value}/5.0</span>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Goethe Score */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-bold mb-2">Thematic Alignment</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold">{scores.evaluation.Goethe.GScore}/5.0</span>
              <span className="text-sm text-muted-foreground">Kant's Legacy Score</span>
            </div>
            <p className="text-sm">{scores.evaluation.Goethe.Explanation}</p>
          </Card>
          
          {/* Summary */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-bold mb-2">Summary</h3>
            <p className="text-sm">{scores.evaluation.Summary}</p>
          </Card>
          
          {/* Quote */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-bold mb-2">Relevant Quote</h3>
            <blockquote className="border-l-4 pl-4 italic mb-2">
              {scores.evaluation.Quote.QText}
            </blockquote>
            <p className="text-sm text-muted-foreground mb-2">
              — {scores.evaluation.Quote.Reference}
            </p>
            <p className="text-sm">{scores.evaluation.Quote.Relevance}</p>
          </Card>
        </>
      )}
      
      {/* Translations (only if moderation passed) */}
      {!moderationFailed && scores.translations && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Translations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Original language detected: <strong>{scores.translations.OLANG}</strong>
          </p>
          
          <Tabs defaultValue="EN">
            <TabsList>
              <TabsTrigger value="EN">English</TabsTrigger>
              <TabsTrigger value="DE">German</TabsTrigger>
              <TabsTrigger value="FR">French</TabsTrigger>
              <TabsTrigger value="IT">Italian</TabsTrigger>
              <TabsTrigger value="ES">Spanish</TabsTrigger>
            </TabsList>
            
            {['EN', 'DE', 'FR', 'IT', 'ES'].map(lang => (
              <TabsContent key={lang} value={lang} className="mt-4">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: scores.translations[lang] }}
                />
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}
      
      {/* User Response Options (only if failed and no choice made) */}
      {failed && !userChoice && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">What would you like to do?</h3>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setUserChoice('A')}
            >
              Option A: I agree with the AI decision
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setUserChoice('B')}
            >
              Option B: I disagree with the AI decision
            </Button>
          </div>
        </Card>
      )}
      
      {/* Option A Response */}
      {userChoice === 'A' && (
        <Card className="p-6 mb-8">
          <p className="mb-4">
            We're sorry your work was eliminated. You may submit another entry with closer 
            attention to the contest criteria. Thank you for contributing to the integrity 
            of this contest.
          </p>
          <Button onClick={() => window.location.href = '/contest/submit'}>
            Submit Another Letter
          </Button>
        </Card>
      )}
      
      {/* Option B Sub-choices */}
      {userChoice === 'B' && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Peer Verification Options</h3>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setUserChoice('B1')}
            >
              Option B1: I will not request peer verification
            </Button>
            
            <div>
              <Button
                variant="default"
                className="w-full justify-start mb-2"
                onClick={() => setUserChoice('B2')}
              >
                Option B2: I want to request peer verification of the AI decision
              </Button>
              <p className="text-sm text-muted-foreground">
                Peer verification: blind review of your work by 10 other contestants. 
                Reviewers do not know whether the AI eliminated or approved your work.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Option B1 Response */}
      {userChoice === 'B1' && (
        <Card className="p-6 mb-8">
          <p>
            We respect your decision not to request verification. Your entry remains 
            eliminated but your feedback helps us improve AI fairness.
          </p>
        </Card>
      )}
      
      {/* Option B2 Payment */}
      {userChoice === 'B2' && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Request Peer Verification</h3>
          <p className="mb-4">
            To activate peer verification, a $20 fee is required.
          </p>
          <Button onClick={() => handlePeerVerificationPayment(submission.id)}>
            Pay $20 for Peer Verification
          </Button>
        </Card>
      )}
    </div>
  );
}

async function handlePeerVerificationPayment(submissionId: string) {
  // Create Stripe checkout session for peer verification
  const response = await fetch('/api/payments/peer-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: submissionId }),
  });
  
  const { checkout_url } = await response.json();
  window.location.href = checkout_url;
}
```


### 9. Admin Settings UI

```typescript
// Update to src/lib/cms/settings-schema.ts

// Add AI Screening category
{
  id: 'ai_screening',
  label: 'AI Screening',
  description: 'Configure AI screening prompts and model parameters',
  order: 4,
}

// Add AI settings
{
  key: 'ai_model_name',
  type: 'string',
  label: 'AI Model Name',
  description: 'OpenAI model to use for evaluation and translation',
  category: 'ai_screening',
  defaultValue: 'gpt-5-mini',
  required: true,
},
{
  key: 'ai_max_tokens',
  type: 'number',
  label: 'Max Tokens',
  description: 'Maximum tokens for AI responses',
  category: 'ai_screening',
  defaultValue: 8000,
  required: true,
  validation: { min: 1000, max: 16000 },
},
{
  key: 'ai_temperature',
  type: 'number',
  label: 'Temperature',
  description: 'AI temperature (0.0 = deterministic, 2.0 = creative)',
  category: 'ai_screening',
  defaultValue: 0.2,
  required: true,
  validation: { min: 0.0, max: 2.0 },
},
{
  key: 'ai_evaluation_prompt',
  type: 'textarea',
  label: 'Evaluation Prompt',
  description: 'Prompt for letter evaluation. Use {Letter} as placeholder.',
  category: 'ai_screening',
  defaultValue: DEFAULT_EVALUATION_PROMPT,
  required: true,
  validation: { minLength: 100 },
},
{
  key: 'ai_translation_prompt',
  type: 'textarea',
  label: 'Translation Prompt',
  description: 'Prompt for letter translation. Use {Letter} as placeholder.',
  category: 'ai_screening',
  defaultValue: DEFAULT_TRANSLATION_PROMPT,
  required: true,
  validation: { minLength: 100 },
}
```

### 10. Admin Screening Dashboard

```typescript
// src/app/admin/submissions/page.tsx (update)

// Add screening status filter
<Select value={statusFilter} onValueChange={setStatusFilter}>
  <SelectTrigger>
    <SelectValue placeholder="Filter by status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All</SelectItem>
    <SelectItem value="PROCESSING">Processing</SelectItem>
    <SelectItem value="PASSED">Passed AI</SelectItem>
    <SelectItem value="FAILED">Failed AI</SelectItem>
    <SelectItem value="REVIEW">Manual Review</SelectItem>
    <SelectItem value="PEER_VERIFICATION_PENDING">Peer Verification</SelectItem>
  </SelectContent>
</Select>

// Display screening status in table
<TableCell>
  {submission.ai_screenings?.[0]?.status || 'Not Screened'}
</TableCell>
```


## Data Models

### AI Screening Lifecycle

```
Payment Confirmed
    ↓
Status: PROCESSING
    ↓
Phase: MODERATION
    ↓
[If flagged] → Status: FAILED, Phase: MODERATION
[If clean] → Continue
    ↓
Phase: EVALUATION
    ↓
Phase: TRANSLATION
    ↓
Phase: COMPLETE
    ↓
[If passed] → Status: PASSED, Submission: SUBMITTED
[If failed] → Status: FAILED, Submission: ELIMINATED
[If borderline] → Status: REVIEW, Submission: SUBMITTED
```

### Screening Scores JSON Structure

```json
{
  "moderation": {
    "flagged": false,
    "categories": {
      "hate": false,
      "hate/threatening": false,
      "self-harm": false,
      "sexual": false,
      "sexual/minors": false,
      "violence": false,
      "violence/graphic": false
    },
    "category_scores": {
      "hate": 0.001,
      "violence": 0.002
    }
  },
  "evaluation": {
    "Rating": {
      "Grammatical Accuracy": 4.2,
      "Essay Structure": 3.8,
      "Clarity of Expression": 4.0,
      "Argumentation": 3.5,
      "Writing Style and Logic": 3.9,
      "Conclusion": 3.7,
      "Overall Impression": 3.8
    },
    "Summary": "A compelling letter addressing...",
    "Identity": {
      "Revealed": false,
      "Reason": "No identifying information found"
    },
    "Language": "English",
    "Goethe": {
      "GScore": 3.5,
      "Explanation": "The letter effectively applies..."
    },
    "Quote": {
      "QText": "Act only according to that maxim...",
      "Reference": "Groundwork of the Metaphysics of Morals",
      "Relevance": "This quote directly relates to..."
    },
    "DTSentiment": "The letter expresses...",
    "Corruption": "The author discusses...",
    "Compensation": "The letter argues...",
    "Impact": "The essay analyzes...",
    "AsGerman": "The author reflects...",
    "StateInstitute": "The letter recommends..."
  },
  "translations": {
    "OLANG": "en",
    "EN": "<p>Original English text...</p>",
    "DE": "<p>Deutsche Übersetzung...</p>",
    "FR": "<p>Traduction française...</p>",
    "IT": "<p>Traduzione italiana...</p>",
    "ES": "<p>Traducción española...</p>"
  }
}
```

## Error Handling

### Retry Strategy

```typescript
// src/lib/ai-screening/retry-utils.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 4xx errors (except 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      
      // Calculate exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Add jitter
      const jitter = Math.random() * 1000;
      
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay + jitter}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError!;
}
```

### Error Categories

1. **Moderation API Errors**
   - Network failures → Retry with exponential backoff
   - Rate limits → Wait and retry
   - Invalid input → Mark as REVIEW

2. **Evaluation API Errors**
   - JSON parsing failures → Mark as REVIEW, log raw response
   - Missing fields → Mark as REVIEW
   - Network failures → Retry

3. **Translation API Errors**
   - Non-critical → Log error, continue with partial translations
   - Complete failure → Mark as REVIEW

4. **Database Errors**
   - Connection failures → Retry
   - Constraint violations → Log and alert admin

## Testing Strategy

### Unit Tests

1. **Moderation Service**
   - Test flagged content detection
   - Test clean content passing
   - Test API error handling

2. **Evaluation Service**
   - Test JSON parsing
   - Test pass/fail criteria logic
   - Test validation of required fields

3. **Translation Service**
   - Test language detection
   - Test translation format
   - Test HTML paragraph formatting

4. **Screening Service**
   - Test phase orchestration
   - Test status determination
   - Test error recovery

### Integration Tests

1. **End-to-End Screening**
   - Submit letter → Payment → Screening → Results
   - Test all three phases execute in order
   - Verify database updates

2. **Webhook Integration**
   - Test screening trigger after payment
   - Test idempotency
   - Test error handling

3. **Admin Dashboard**
   - Test filtering by screening status
   - Test manual override
   - Test audit logging

### Manual Testing Scenarios

1. **Content Moderation**
   - Submit letter with hate speech → Should fail moderation
   - Submit clean letter → Should pass to evaluation

2. **Evaluation Criteria**
   - Submit letter revealing identity → Should fail
   - Submit low-quality letter → Should fail
   - Submit borderline letter → Should go to REVIEW
   - Submit high-quality letter → Should pass

3. **User Flow**
   - Failed letter → Option A → Confirmation
   - Failed letter → Option B1 → Confirmation
   - Failed letter → Option B2 → Payment → Verification pending

4. **Admin Review**
   - View REVIEW submissions
   - Manually override to PASSED
   - Manually override to FAILED
   - Check audit logs


## Security Considerations

### API Key Management
- OpenAI API key stored in environment variables only
- Never expose API key in client-side code
- Use server-side API routes for all OpenAI calls
- Rotate keys periodically

### Access Control
- Screening results only visible to submission owner and admins
- Admin settings protected by role check
- Audit log all admin actions
- Rate limit API endpoints

### Data Privacy
- Store only necessary screening data
- Redact sensitive information from logs
- Comply with GDPR for data retention
- Allow users to request data deletion

### Input Validation
- Sanitize letter text before sending to AI
- Validate JSON responses from AI
- Prevent prompt injection attacks
- Limit letter length to prevent excessive costs

### Rate Limiting
- Limit screening requests per user
- Implement queue for high-volume periods
- Monitor OpenAI API usage
- Set spending limits in OpenAI dashboard

## Performance Considerations

### Async Processing
- Execute screening asynchronously after payment
- Don't block webhook response
- Use background jobs for long-running tasks
- Implement timeout handling

### Caching
- Cache AI settings (5 minute TTL)
- Cache prompt templates
- Don't cache screening results (always fresh)

### Database Optimization
- Index on submission_id in ai_screenings
- Index on status in ai_screenings
- Use JSONB for flexible scores storage
- Paginate admin screening dashboard

### Cost Optimization
- Monitor token usage per screening
- Set max_tokens to prevent runaway costs
- Use cheaper models where appropriate
- Implement spending alerts

## Deployment Considerations

### Environment Variables

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Existing variables
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### Database Migrations

```sql
-- Migration: Add AI screening enums and fields

-- Add new submission statuses
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'ELIMINATED';
ALTER TYPE submission_status ADD VALUE IF NOT EXISTS 'PEER_VERIFICATION_PENDING';

-- Add new payment purpose
ALTER TYPE payment_purpose ADD VALUE IF NOT EXISTS 'PEER_VERIFICATION';

-- Add phase column to ai_screenings
ALTER TABLE ai_screenings 
ADD COLUMN IF NOT EXISTS phase TEXT 
CHECK (phase IN ('MODERATION', 'EVALUATION', 'TRANSLATION', 'COMPLETE'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_screenings_status ON ai_screenings(status);
CREATE INDEX IF NOT EXISTS idx_ai_screenings_submission ON ai_screenings(submission_id);
```

### Seed Data

```sql
-- Insert default AI settings
INSERT INTO cms_settings (key, value_json) VALUES
  ('ai_model_name', '"gpt-5-mini"'),
  ('ai_max_tokens', '8000'),
  ('ai_temperature', '0.2'),
  ('ai_evaluation_prompt', '"<instructions>Analyze the letter enclosed within the <letter> and </letter> tags below...</instructions><letter>{Letter}</letter>"'),
  ('ai_translation_prompt', '"The original letter is the text found exclusively within the <letter> and </letter> tags...</letter>{Letter}</letter>"')
ON CONFLICT (key) DO NOTHING;
```

### Monitoring

- Set up Sentry alerts for screening failures
- Monitor OpenAI API response times
- Track screening success/failure rates
- Alert on high REVIEW queue

### Rollback Plan

1. Disable AI screening in webhook
2. Mark all PROCESSING submissions as SUBMITTED
3. Manually review affected submissions
4. Fix issues and re-enable

## Future Enhancements

### Phase 2 Features

1. **Peer Verification Implementation**
   - Assign 10 reviewers to disputed submissions
   - Blind review (reviewers don't know AI decision)
   - Aggregate peer scores
   - Override AI decision if peers disagree
   - (Separate spec required)

2. **AI Model Improvements**
   - A/B test different models
   - Fine-tune on contest-specific data
   - Implement confidence scores
   - Add explainability features

3. **Admin Tools**
   - Bulk re-screening
   - Screening analytics dashboard
   - Prompt version history
   - Cost tracking per submission

4. **User Features**
   - Preview screening before payment
   - AI feedback on draft letters
   - Comparison with passing letters
   - Appeal process improvements

## Notes

- The peer verification feature (Option B2) requires a separate spec for implementation
- This spec focuses on the AI screening pipeline and user-facing results
- Peer verification will involve assigning reviewers, collecting reviews, and determining outcomes
- The $20 payment for peer verification is handled in this spec, but the review process is not

