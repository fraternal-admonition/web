/**
 * Property-Based Tests for Scoring Service
 * 
 * These tests use fast-check to generate random inputs and verify
 * that the scoring properties hold for all valid inputs.
 * 
 * Run with: npx tsx src/lib/peer-review/__tests__/scoring-service.property.test.ts
 */

import * as fc from 'fast-check';
import { calculateTrimmedMean, calculateOverallScore } from '../scoring-service';

// ============================================================================
// Property 11: Trimmed Mean for Large Samples
// Validates: Requirements 13.2
// ============================================================================

console.log('=== Property 11: Trimmed Mean for Large Samples ===');
console.log('Testing that for 5+ reviews, highest and lowest are excluded\n');

/**
 * Property: For any array of 5 or more scores (1-5),
 * the trimmed mean should exclude the highest and lowest values
 */
const property11 = fc.property(
  // Generate arrays of 5-20 scores, each between 1-5
  fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 5, maxLength: 20 }),
  (scores) => {
    // Calculate trimmed mean
    const result = calculateTrimmedMean(scores);
    
    // Manually calculate what the trimmed mean should be
    const sorted = [...scores].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1); // Remove first and last
    const expectedMean = trimmed.reduce((sum, v) => sum + v, 0) / trimmed.length;
    
    // Verify the result matches expected
    const matches = Math.abs(result - expectedMean) < 0.0001; // Allow for floating point precision
    
    if (!matches) {
      console.log('FAILED:');
      console.log('  Input:', scores);
      console.log('  Sorted:', sorted);
      console.log('  Trimmed:', trimmed);
      console.log('  Expected:', expectedMean);
      console.log('  Got:', result);
    }
    
    return matches;
  }
);

// Run the property test with 100 iterations
const result11 = fc.check(property11, { numRuns: 100 });

if (result11.failed) {
  console.log('❌ FAILED: Property 11');
  console.log('Counterexample:', result11.counterexample);
} else {
  console.log('✅ PASSED: Property 11 (100 iterations)');
  console.log('   Verified that trimmed mean excludes highest and lowest for 5+ reviews\n');
}

// ============================================================================
// Property 12: Simple Mean for Small Samples
// Validates: Requirements 13.3
// ============================================================================

console.log('=== Property 12: Simple Mean for Small Samples ===');
console.log('Testing that for <5 reviews, all values are included\n');

/**
 * Property: For any array of fewer than 5 scores (1-5),
 * the mean should include all values (no trimming)
 */
const property12 = fc.property(
  // Generate arrays of 1-4 scores, each between 1-5
  fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 4 }),
  (scores) => {
    // Calculate mean (should be simple mean, no trimming)
    const result = calculateTrimmedMean(scores);
    
    // Manually calculate what the simple mean should be
    const expectedMean = scores.reduce((sum, v) => sum + v, 0) / scores.length;
    
    // Verify the result matches expected
    const matches = Math.abs(result - expectedMean) < 0.0001; // Allow for floating point precision
    
    if (!matches) {
      console.log('FAILED:');
      console.log('  Input:', scores);
      console.log('  Expected (simple mean):', expectedMean);
      console.log('  Got:', result);
    }
    
    return matches;
  }
);

// Run the property test with 100 iterations
const result12 = fc.check(property12, { numRuns: 100 });

if (result12.failed) {
  console.log('❌ FAILED: Property 12');
  console.log('Counterexample:', result12.counterexample);
} else {
  console.log('✅ PASSED: Property 12 (100 iterations)');
  console.log('   Verified that simple mean includes all values for <5 reviews\n');
}

// ============================================================================
// Property 13: Four-Criteria Average
// Validates: Requirements 13.4
// ============================================================================

console.log('=== Property 13: Four-Criteria Average ===');
console.log('Testing that overall score equals average of four criterion means\n');

/**
 * Property: For any four criterion means (1-5),
 * the overall score should equal their average (rounded to 2 decimal places)
 */
const property13 = fc.property(
  // Generate four random criterion means between 1.0 and 5.0
  // Filter out NaN and Infinity values
  fc.float({ min: 1.0, max: 5.0, noNaN: true }),
  fc.float({ min: 1.0, max: 5.0, noNaN: true }),
  fc.float({ min: 1.0, max: 5.0, noNaN: true }),
  fc.float({ min: 1.0, max: 5.0, noNaN: true }),
  (clarity, argument, style, moralDepth) => {
    // Calculate overall score
    const result = calculateOverallScore(clarity, argument, style, moralDepth);
    
    // Manually calculate what the average should be
    const sum = clarity + argument + style + moralDepth;
    const average = sum / 4;
    const expectedScore = Math.round(average * 100) / 100; // Round to 2 decimal places
    
    // Verify the result matches expected
    const matches = Math.abs(result - expectedScore) < 0.0001; // Allow for floating point precision
    
    if (!matches) {
      console.log('FAILED:');
      console.log('  Clarity:', clarity);
      console.log('  Argument:', argument);
      console.log('  Style:', style);
      console.log('  Moral Depth:', moralDepth);
      console.log('  Expected:', expectedScore);
      console.log('  Got:', result);
    }
    
    return matches;
  }
);

// Run the property test with 100 iterations
const result13 = fc.check(property13, { numRuns: 100 });

if (result13.failed) {
  console.log('❌ FAILED: Property 13');
  console.log('Counterexample:', result13.counterexample);
} else {
  console.log('✅ PASSED: Property 13 (100 iterations)');
  console.log('   Verified that overall score equals average of four criteria\n');
}

// ============================================================================
// Summary
// ============================================================================

console.log('=== Property-Based Test Summary ===');
const allPassed = !result11.failed && !result12.failed && !result13.failed;

if (allPassed) {
  console.log('✅ ALL PROPERTIES PASSED');
  console.log('   - Property 11: Trimmed Mean for Large Samples (100 iterations)');
  console.log('   - Property 12: Simple Mean for Small Samples (100 iterations)');
  console.log('   - Property 13: Four-Criteria Average (100 iterations)');
  console.log('\n   Total: 300 random test cases passed');
} else {
  console.log('❌ SOME PROPERTIES FAILED');
  if (result11.failed) console.log('   - Property 11 FAILED');
  if (result12.failed) console.log('   - Property 12 FAILED');
  if (result13.failed) console.log('   - Property 13 FAILED');
  process.exit(1);
}
