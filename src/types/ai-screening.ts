/**
 * AI Screening Types
 * Types for the AI screening pipeline that evaluates submitted letters
 */

export type AIScreeningPhase = 
  | 'MODERATION' 
  | 'EVALUATION' 
  | 'TRANSLATION' 
  | 'COMPLETE';

export type AIScreeningStatus = 
  | 'PASSED' 
  | 'FAILED' 
  | 'REVIEW';

/**
 * Result from OpenAI Moderation API
 */
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

/**
 * Rating scores from evaluation (1-5 scale)
 */
export interface EvaluationRating {
  'Grammatical Accuracy': number;
  'Essay Structure': number;
  'Clarity of Expression': number;
  'Argumentation': number;
  'Writing Style and Logic': number;
  'Conclusion': number;
  'Overall Impression': number;
}

/**
 * Complete evaluation result from GPT-5-mini
 */
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

/**
 * Translation result with all languages
 */
export interface TranslationResult {
  OLANG: string; // ISO 639-1 code of original language
  EN: string;    // English translation (HTML paragraphs)
  DE: string;    // German translation (HTML paragraphs)
  FR: string;    // French translation (HTML paragraphs)
  IT: string;    // Italian translation (HTML paragraphs)
  ES: string;    // Spanish translation (HTML paragraphs)
}

/**
 * Combined scores from all screening phases
 */
export interface AIScreeningScores {
  moderation?: ModerationResult;
  evaluation?: EvaluationResult;
  translations?: TranslationResult;
}

/**
 * Complete AI screening record
 */
export interface AIScreening {
  id: string;
  submission_id: string;
  status: AIScreeningStatus;
  phase: AIScreeningPhase | null;
  model_name: string | null;
  model_version: string | null;
  prompt_hash: string | null;
  scores: AIScreeningScores;
  notes: string | null;
  created_at: string;
}

/**
 * Submission with AI screening data
 */
export interface SubmissionWithScreening {
  id: string;
  submission_code: string;
  title: string;
  status: string;
  ai_screenings?: AIScreening[];
}
