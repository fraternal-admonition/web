/**
 * Peer Review Phase 5 - Scoring Service
 * 
 * This service calculates peer scores for submissions using trimmed mean
 * to remove outliers and ensure fair scoring.
 * 
 * Key responsibilities:
 * - Aggregate all reviews for a submission
 * - Calculate trimmed mean for each criterion (if 5+ reviews)
 * - Calculate simple mean for each criterion (if <5 reviews)
 * - Calculate overall score as average of four criteria
 * - Store score in submissions.score_peer column
 * 
 * Scoring Algorithm:
 * 1. Get all completed reviews for the submission
 * 2. Extract scores for each criterion (clarity, argument, style, moral_depth)
 * 3. For each criterion:
 *    - If 5+ reviews: sort, remove highest and lowest, calculate mean
 *    - If <5 reviews: calculate simple mean
 * 4. Calculate overall score = average of 4 criterion means
 * 5. Store in submissions.score_peer (rounded to 2 decimal places)
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Review {
  id: string;
  assignment_id: string;
  clarity: number;
  argument: number;
  style: number;
  moral_depth: number;
  comment_100: string;
  created_at: string;
}

export interface CriterionScores {
  clarity: number[];
  argument: number[];
  style: number[];
  moral_depth: number[];
}

export interface CriterionMeans {
  clarity: number;
  argument: number;
  style: number;
  moral_depth: number;
}

export interface ScoreCalculationResult {
  submissionId: string;
  reviewCount: number;
  criterionMeans: CriterionMeans;
  overallScore: number;
  usedTrimmedMean: boolean;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Calculate peer score for a submission
 * 
 * This is the main entry point called when all reviews for a submission are complete.
 * It aggregates reviews, calculates trimmed/simple means, and stores the result.
 * 
 * @param submissionId - UUID of the submission
 * @returns The calculated overall peer score (1-5 scale)
 */
export async function calculatePeerScore(submissionId: string): Promise<number> {
  console.log(`📊 Calculating peer score for submission ${submissionId}`);

  try {
    // 1. Get all completed reviews for this submission
    const reviews = await getReviews(submissionId);

    if (reviews.length === 0) {
      console.log(`⚠️  No reviews found for submission ${submissionId}, setting score to 0`);
      await updateSubmissionScore(submissionId, 0);
      return 0;
    }

    console.log(`   Found ${reviews.length} reviews`);

    // 2. Extract scores for each criterion
    const scores: CriterionScores = {
      clarity: reviews.map(r => r.clarity),
      argument: reviews.map(r => r.argument),
      style: reviews.map(r => r.style),
      moral_depth: reviews.map(r => r.moral_depth)
    };

    // 3. Calculate trimmed mean for each criterion
    const usedTrimmedMean = reviews.length >= 5;
    const criterionMeans: CriterionMeans = {
      clarity: calculateTrimmedMean(scores.clarity),
      argument: calculateTrimmedMean(scores.argument),
      style: calculateTrimmedMean(scores.style),
      moral_depth: calculateTrimmedMean(scores.moral_depth)
    };

    console.log(`   Criterion means (${usedTrimmedMean ? 'trimmed' : 'simple'}):`, {
      clarity: criterionMeans.clarity.toFixed(2),
      argument: criterionMeans.argument.toFixed(2),
      style: criterionMeans.style.toFixed(2),
      moral_depth: criterionMeans.moral_depth.toFixed(2)
    });

    // 4. Calculate overall score (average of 4 criteria)
    const overallScore = calculateOverallScore(
      criterionMeans.clarity,
      criterionMeans.argument,
      criterionMeans.style,
      criterionMeans.moral_depth
    );

    console.log(`   Overall score: ${overallScore.toFixed(2)}`);

    // 5. Store in submissions.score_peer
    await updateSubmissionScore(submissionId, overallScore);

    console.log(`✓ Peer score calculated and stored for submission ${submissionId}`);

    return overallScore;
  } catch (error) {
    console.error(`❌ Error calculating peer score for submission ${submissionId}:`, error);
    throw error;
  }
}

/**
 * Get all reviews for a submission
 * 
 * Queries peer_review_reviews via peer_review_assignments to get all completed reviews.
 * 
 * @param submissionId - UUID of the submission
 * @returns Array of review records
 */
async function getReviews(submissionId: string): Promise<Review[]> {
  const supabase = await createClient();

  try {
    // Query reviews by joining through assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('peer_review_assignments')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('status', 'DONE');

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    if (!assignments || assignments.length === 0) {
      return [];
    }

    const assignmentIds = assignments.map(a => a.id);

    // Get all reviews for these assignments
    const { data: reviews, error: reviewsError } = await supabase
      .from('peer_review_reviews')
      .select('*')
      .in('assignment_id', assignmentIds);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      throw reviewsError;
    }

    return reviews || [];
  } catch (error) {
    console.error('Error in getReviews:', error);
    throw error;
  }
}

/**
 * Calculate trimmed mean for a criterion
 * 
 * If 5 or more values: sort, remove highest and lowest, calculate mean
 * If fewer than 5 values: calculate simple mean
 * 
 * This removes outliers for submissions with sufficient reviews.
 * 
 * @param values - Array of scores (1-5) for a single criterion
 * @returns The trimmed or simple mean
 */
export function calculateTrimmedMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  if (values.length < 5) {
    // Simple mean for fewer than 5 reviews
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  }

  // Trimmed mean for 5 or more reviews
  // Sort and remove highest and lowest
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1); // Remove first and last

  const sum = trimmed.reduce((acc, v) => acc + v, 0);
  return sum / trimmed.length;
}

/**
 * Calculate overall score from four criterion means
 * 
 * The overall peer score is the average of the four criteria:
 * - Clarity
 * - Argument
 * - Style
 * - Moral Depth
 * 
 * @param clarity - Mean score for clarity (1-5)
 * @param argument - Mean score for argument (1-5)
 * @param style - Mean score for style (1-5)
 * @param moralDepth - Mean score for moral depth (1-5)
 * @returns The overall score (1-5), rounded to 2 decimal places
 */
export function calculateOverallScore(
  clarity: number,
  argument: number,
  style: number,
  moralDepth: number
): number {
  const sum = clarity + argument + style + moralDepth;
  const average = sum / 4;
  
  // Round to 2 decimal places
  return Math.round(average * 100) / 100;
}

/**
 * Update submission score in database
 * 
 * Stores the calculated peer score in submissions.score_peer column.
 * Also updates the updated_at timestamp.
 * 
 * Uses admin client to bypass RLS policies.
 * 
 * @param submissionId - UUID of the submission
 * @param score - The calculated peer score (0-5)
 */
async function updateSubmissionScore(
  submissionId: string,
  score: number
): Promise<void> {
  // Use admin client to bypass RLS - scoring service needs elevated permissions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
    throw new Error('Missing service role key');
  }

  const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log(`   🔧 Updating score using admin client...`);
    const { error } = await adminClient
      .from('submissions')
      .update({
        score_peer: score,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) {
      console.error('❌ Error updating submission score:', error);
      throw error;
    }

    console.log(`   ✅ Updated submissions.score_peer = ${score.toFixed(2)}`);
  } catch (error) {
    console.error('❌ Error in updateSubmissionScore:', error);
    throw error;
  }
}

// ============================================================================
// Utility Functions for Testing and Debugging
// ============================================================================

/**
 * Get detailed score calculation result (for testing/debugging)
 * 
 * Returns full breakdown of the score calculation including:
 * - Review count
 * - Individual criterion means
 * - Overall score
 * - Whether trimmed mean was used
 * 
 * @param submissionId - UUID of the submission
 * @returns Detailed score calculation result
 */
export async function getScoreCalculationDetails(
  submissionId: string
): Promise<ScoreCalculationResult | null> {
  try {
    const reviews = await getReviews(submissionId);

    if (reviews.length === 0) {
      return null;
    }

    const scores: CriterionScores = {
      clarity: reviews.map(r => r.clarity),
      argument: reviews.map(r => r.argument),
      style: reviews.map(r => r.style),
      moral_depth: reviews.map(r => r.moral_depth)
    };

    const criterionMeans: CriterionMeans = {
      clarity: calculateTrimmedMean(scores.clarity),
      argument: calculateTrimmedMean(scores.argument),
      style: calculateTrimmedMean(scores.style),
      moral_depth: calculateTrimmedMean(scores.moral_depth)
    };

    const overallScore = calculateOverallScore(
      criterionMeans.clarity,
      criterionMeans.argument,
      criterionMeans.style,
      criterionMeans.moral_depth
    );

    return {
      submissionId,
      reviewCount: reviews.length,
      criterionMeans,
      overallScore,
      usedTrimmedMean: reviews.length >= 5
    };
  } catch (error) {
    console.error('Error in getScoreCalculationDetails:', error);
    return null;
  }
}
