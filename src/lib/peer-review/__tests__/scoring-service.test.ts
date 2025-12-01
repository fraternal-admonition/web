/**
 * Unit Tests for Scoring Service
 * 
 * These tests verify the core scoring logic:
 * - Trimmed mean calculation (5+ reviews)
 * - Simple mean calculation (<5 reviews)
 * - Overall score calculation
 * - Edge cases (empty arrays, all same scores, extreme outliers)
 * 
 * Run with: npx tsx src/lib/peer-review/__tests__/scoring-service.test.ts
 */

import { calculateTrimmedMean, calculateOverallScore } from '../scoring-service';

// ============================================================================
// Test Framework
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      testsPassed++;
    } else {
      console.log(`❌ ${name}`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ ${name} - Exception: ${error}`);
    testsFailed++;
  }
}

function assertClose(actual: number, expected: number, tolerance: number = 0.0001): boolean {
  return Math.abs(actual - expected) < tolerance;
}

console.log('=== Unit Tests for Score Calculation ===\n');

// ============================================================================
// Trimmed Mean Tests (5+ reviews)
// ============================================================================

console.log('--- Trimmed Mean with 5+ Reviews ---');

test('Should calculate trimmed mean for exactly 5 scores', () => {
  const scores = [1, 2, 3, 4, 5]; // Remove 1 and 5, average [2,3,4] = 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

test('Should calculate trimmed mean for 7 scores', () => {
  const scores = [1, 2, 3, 3, 4, 4, 5]; // Remove 1 and 5, average [2,3,3,4,4] = 3.2
  const result = calculateTrimmedMean(scores);
  return result === 3.2;
});

test('Should calculate trimmed mean for 10 scores', () => {
  const scores = [1, 2, 2, 3, 3, 3, 4, 4, 4, 5]; // Remove 1 and 5, average middle 8
  const result = calculateTrimmedMean(scores);
  const expected = (2 + 2 + 3 + 3 + 3 + 4 + 4 + 4) / 8; // = 3.125
  return assertClose(result, expected);
});

test('Should handle all same scores with trimming', () => {
  const scores = [3, 3, 3, 3, 3, 3]; // Remove two 3s, average remaining 3s = 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

test('Should remove extreme outliers with trimming', () => {
  const scores = [1, 3, 3, 3, 5]; // Remove 1 and 5, average [3,3,3] = 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

test('Should handle scores with decimal results', () => {
  const scores = [1, 2, 3, 4, 4]; // Remove 1 and 4, average [2,3,4] = 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

test('Should trim correctly when min/max appear multiple times', () => {
  const scores = [1, 1, 3, 5, 5]; // Remove one 1 and one 5, average [1,3,5] = 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

// ============================================================================
// Simple Mean Tests (<5 reviews)
// ============================================================================

console.log('\n--- Simple Mean with <5 Reviews ---');

test('Should calculate simple mean for 1 score', () => {
  const scores = [4];
  const result = calculateTrimmedMean(scores);
  return result === 4;
});

test('Should calculate simple mean for 2 scores', () => {
  const scores = [3, 5]; // (3+5)/2 = 4
  const result = calculateTrimmedMean(scores);
  return result === 4;
});

test('Should calculate simple mean for 3 scores', () => {
  const scores = [2, 3, 4]; // (2+3+4)/3 = 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

test('Should calculate simple mean for 4 scores', () => {
  const scores = [1, 2, 3, 5]; // (1+2+3+5)/4 = 2.75
  const result = calculateTrimmedMean(scores);
  return result === 2.75;
});

test('Should handle decimal results for simple mean', () => {
  const scores = [2, 3]; // (2+3)/2 = 2.5
  const result = calculateTrimmedMean(scores);
  return result === 2.5;
});

test('Should not trim when exactly 4 scores', () => {
  const scores = [1, 2, 4, 5]; // All included: (1+2+4+5)/4 = 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

// ============================================================================
// Overall Score Calculation Tests
// ============================================================================

console.log('\n--- Overall Score Calculation ---');

test('Should calculate overall score from four criteria', () => {
  const result = calculateOverallScore(4.5, 3.8, 4.2, 4.0);
  const expected = (4.5 + 3.8 + 4.2 + 4.0) / 4; // = 4.125
  const rounded = Math.round(expected * 100) / 100; // = 4.13
  return result === rounded;
});

test('Should round overall score to 2 decimal places', () => {
  const result = calculateOverallScore(3.333, 4.666, 2.111, 5.0);
  const expected = (3.333 + 4.666 + 2.111 + 5.0) / 4; // = 3.7775
  const rounded = Math.round(expected * 100) / 100; // = 3.78
  return result === rounded;
});

test('Should handle all same criterion scores', () => {
  const result = calculateOverallScore(3.5, 3.5, 3.5, 3.5);
  return result === 3.5;
});

test('Should handle minimum scores (all 1)', () => {
  const result = calculateOverallScore(1, 1, 1, 1);
  return result === 1;
});

test('Should handle maximum scores (all 5)', () => {
  const result = calculateOverallScore(5, 5, 5, 5);
  return result === 5;
});

test('Should handle mixed integer and decimal scores', () => {
  const result = calculateOverallScore(3, 4.5, 2, 5);
  const expected = (3 + 4.5 + 2 + 5) / 4; // = 3.625
  const rounded = Math.round(expected * 100) / 100; // = 3.63
  return result === rounded;
});

test('Should calculate correctly with very close values', () => {
  const result = calculateOverallScore(3.11, 3.12, 3.13, 3.14);
  const expected = (3.11 + 3.12 + 3.13 + 3.14) / 4; // = 3.125
  const rounded = Math.round(expected * 100) / 100; // = 3.13
  return result === rounded;
});

// ============================================================================
// Edge Cases
// ============================================================================

console.log('\n--- Edge Cases ---');

test('Should return 0 for empty array', () => {
  const scores: number[] = [];
  const result = calculateTrimmedMean(scores);
  return result === 0;
});

test('Should handle boundary case: exactly 5 scores (switches to trimmed)', () => {
  const scores = [1, 2, 3, 4, 5];
  const result = calculateTrimmedMean(scores);
  // With 5 scores, should trim (remove 1 and 5, average [2,3,4] = 3)
  return result === 3;
});

test('Should handle boundary case: exactly 4 scores (stays simple)', () => {
  const scores = [1, 2, 3, 4];
  const result = calculateTrimmedMean(scores);
  // With 4 scores, should NOT trim (average all: (1+2+3+4)/4 = 2.5)
  return result === 2.5;
});

test('Should handle all minimum scores (all 1s)', () => {
  const scores = [1, 1, 1, 1, 1];
  const result = calculateTrimmedMean(scores);
  return result === 1;
});

test('Should handle all maximum scores (all 5s)', () => {
  const scores = [5, 5, 5, 5, 5];
  const result = calculateTrimmedMean(scores);
  return result === 5;
});

test('Should handle large number of scores', () => {
  const scores = Array(100).fill(3); // 100 scores of 3
  const result = calculateTrimmedMean(scores);
  return result === 3;
});

test('Should handle scores with high variance', () => {
  const scores = [1, 1, 1, 5, 5, 5]; // Remove one 1 and one 5
  const result = calculateTrimmedMean(scores);
  const expected = (1 + 1 + 5 + 5) / 4; // = 3
  return result === expected;
});

// ============================================================================
// Integration Tests
// ============================================================================

console.log('\n--- Integration Tests ---');

test('Should calculate complete peer score workflow (5+ reviews)', () => {
  // Simulate 7 reviews with scores for each criterion
  const clarityScores = [3, 4, 4, 5, 5, 2, 1]; // Trimmed: [2,3,4,4,5] = 3.6
  const argumentScores = [4, 4, 3, 5, 5, 2, 1]; // Trimmed: [2,3,4,4,5] = 3.6
  const styleScores = [3, 3, 4, 4, 5, 2, 1]; // Trimmed: [2,3,3,4,4] = 3.2
  const moralDepthScores = [4, 4, 4, 5, 5, 3, 1]; // Trimmed: [3,4,4,4,5] = 4.0
  
  const clarityMean = calculateTrimmedMean(clarityScores);
  const argumentMean = calculateTrimmedMean(argumentScores);
  const styleMean = calculateTrimmedMean(styleScores);
  const moralDepthMean = calculateTrimmedMean(moralDepthScores);
  
  const overallScore = calculateOverallScore(clarityMean, argumentMean, styleMean, moralDepthMean);
  
  // Expected: (3.6 + 3.6 + 3.2 + 4.0) / 4 = 3.6
  return assertClose(overallScore, 3.6);
});

test('Should calculate complete peer score workflow (<5 reviews)', () => {
  // Simulate 3 reviews with scores for each criterion
  const clarityScores = [3, 4, 5]; // Simple mean: 4
  const argumentScores = [2, 3, 4]; // Simple mean: 3
  const styleScores = [4, 4, 5]; // Simple mean: 4.33...
  const moralDepthScores = [3, 3, 3]; // Simple mean: 3
  
  const clarityMean = calculateTrimmedMean(clarityScores);
  const argumentMean = calculateTrimmedMean(argumentScores);
  const styleMean = calculateTrimmedMean(styleScores);
  const moralDepthMean = calculateTrimmedMean(moralDepthScores);
  
  const overallScore = calculateOverallScore(clarityMean, argumentMean, styleMean, moralDepthMean);
  
  // Expected: (4 + 3 + 4.333... + 3) / 4 = 3.583... → 3.58
  return assertClose(overallScore, 3.58);
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== Test Summary ===');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\n❌ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED');
}
