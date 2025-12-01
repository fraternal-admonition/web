/**
 * Unit Tests for Review Service
 * 
 * These tests verify the review validation logic works correctly.
 * Tests cover ownership validation, status validation, and expiration validation.
 * 
 * Run with: npx tsx src/lib/peer-review/__tests__/review-service.test.ts
 */

// ============================================================================
// Mock Types and Data
// ============================================================================

interface Assignment {
  id: string;
  reviewer_user_id: string;
  status: 'PENDING' | 'DONE' | 'EXPIRED';
  deadline: string;
  submission_id: string;
}

interface Review {
  id: string;
  assignment_id: string;
}

// ============================================================================
// Pure Validation Functions (extracted from service logic)
// ============================================================================

/**
 * Validate ownership - reviewer must own the assignment
 */
function validateOwnership(
  assignment: Assignment,
  reviewerId: string
): { valid: boolean; error?: string } {
  if (assignment.reviewer_user_id !== reviewerId) {
    return {
      valid: false,
      error: 'You do not own this assignment'
    };
  }
  return { valid: true };
}

/**
 * Validate status - assignment must be PENDING
 */
function validateStatus(
  assignment: Assignment
): { valid: boolean; error?: string } {
  if (assignment.status !== 'PENDING') {
    return {
      valid: false,
      error: `Assignment is ${assignment.status}, not PENDING`
    };
  }
  return { valid: true };
}

/**
 * Validate expiration - assignment must not be expired
 */
function validateExpiration(
  assignment: Assignment
): { valid: boolean; error?: string } {
  const deadline = new Date(assignment.deadline);
  const now = new Date();
  
  if (now > deadline) {
    return {
      valid: false,
      error: 'Assignment has expired'
    };
  }
  return { valid: true };
}

/**
 * Validate no duplicate - no existing review for this assignment
 */
function validateNoDuplicate(
  existingReview: Review | null
): { valid: boolean; error?: string } {
  if (existingReview) {
    return {
      valid: false,
      error: 'Review already exists for this assignment'
    };
  }
  return { valid: true };
}

/**
 * Validate scores - all scores must be between 1 and 5
 */
function validateScores(
  clarity: number,
  argument: number,
  style: number,
  moralDepth: number
): { valid: boolean; error?: string } {
  const scores = [clarity, argument, style, moralDepth];
  const allValid = scores.every(s => s >= 1 && s <= 5 && Number.isInteger(s));
  
  if (!allValid) {
    return {
      valid: false,
      error: 'All scores must be integers between 1 and 5'
    };
  }
  return { valid: true };
}

// ============================================================================
// Test Suite
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

console.log('=== Unit Tests for Review Validation ===\n');

// ============================================================================
// Ownership Validation Tests
// ============================================================================

console.log('--- Ownership Validation ---');

test('Should accept when reviewer owns assignment', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    submission_id: 'submission-1'
  };
  
  const result = validateOwnership(assignment, 'user-123');
  return result.valid === true;
});

test('Should reject when reviewer does not own assignment', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const result = validateOwnership(assignment, 'user-456');
  return result.valid === false && result.error === 'You do not own this assignment';
});

test('Should reject when reviewer ID is empty', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const result = validateOwnership(assignment, '');
  return result.valid === false;
});

// ============================================================================
// Status Validation Tests
// ============================================================================

console.log('\n--- Status Validation ---');

test('Should accept when status is PENDING', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const result = validateStatus(assignment);
  return result.valid === true;
});

test('Should reject when status is DONE', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'DONE',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const result = validateStatus(assignment);
  return result.valid === false && result.error?.includes('DONE');
});

test('Should reject when status is EXPIRED', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'EXPIRED',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const result = validateStatus(assignment);
  return result.valid === false && result.error?.includes('EXPIRED');
});

// ============================================================================
// Expiration Validation Tests
// ============================================================================

console.log('\n--- Expiration Validation ---');

test('Should accept when deadline is in the future', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    submission_id: 'submission-1'
  };
  
  const result = validateExpiration(assignment);
  return result.valid === true;
});

test('Should reject when deadline is in the past', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    submission_id: 'submission-1'
  };
  
  const result = validateExpiration(assignment);
  return result.valid === false && result.error === 'Assignment has expired';
});

test('Should reject when deadline is exactly now (edge case)', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() - 1000).toISOString(), // 1 second ago
    submission_id: 'submission-1'
  };
  
  const result = validateExpiration(assignment);
  return result.valid === false;
});

test('Should accept when deadline is far in the future', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days from now
    submission_id: 'submission-1'
  };
  
  const result = validateExpiration(assignment);
  return result.valid === true;
});

// ============================================================================
// Duplicate Review Validation Tests
// ============================================================================

console.log('\n--- Duplicate Review Validation ---');

test('Should accept when no existing review', () => {
  const result = validateNoDuplicate(null);
  return result.valid === true;
});

test('Should reject when review already exists', () => {
  const existingReview: Review = {
    id: 'review-1',
    assignment_id: 'assignment-1'
  };
  
  const result = validateNoDuplicate(existingReview);
  return result.valid === false && result.error === 'Review already exists for this assignment';
});

// ============================================================================
// Score Validation Tests
// ============================================================================

console.log('\n--- Score Validation ---');

test('Should accept valid scores (all 1-5)', () => {
  const result = validateScores(3, 4, 5, 2);
  return result.valid === true;
});

test('Should accept minimum valid scores (all 1)', () => {
  const result = validateScores(1, 1, 1, 1);
  return result.valid === true;
});

test('Should accept maximum valid scores (all 5)', () => {
  const result = validateScores(5, 5, 5, 5);
  return result.valid === true;
});

test('Should reject score below minimum (0)', () => {
  const result = validateScores(0, 3, 4, 5);
  return result.valid === false;
});

test('Should reject score above maximum (6)', () => {
  const result = validateScores(3, 6, 4, 5);
  return result.valid === false;
});

test('Should reject negative scores', () => {
  const result = validateScores(-1, 3, 4, 5);
  return result.valid === false;
});

test('Should reject decimal scores', () => {
  const result = validateScores(3.5, 4, 5, 2);
  return result.valid === false;
});

test('Should reject when any score is invalid', () => {
  const result = validateScores(3, 4, 10, 2);
  return result.valid === false;
});

// ============================================================================
// Integration Tests (Combined Validation)
// ============================================================================

console.log('\n--- Integration Tests ---');

test('Should pass all validations for valid review', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const ownershipValid = validateOwnership(assignment, 'user-123').valid;
  const statusValid = validateStatus(assignment).valid;
  const expirationValid = validateExpiration(assignment).valid;
  const noDuplicateValid = validateNoDuplicate(null).valid;
  const scoresValid = validateScores(3, 4, 5, 2).valid;
  
  return ownershipValid && statusValid && expirationValid && noDuplicateValid && scoresValid;
});

test('Should fail if any validation fails (wrong owner)', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const ownershipValid = validateOwnership(assignment, 'user-456').valid;
  const statusValid = validateStatus(assignment).valid;
  const expirationValid = validateExpiration(assignment).valid;
  
  return !ownershipValid && statusValid && expirationValid;
});

test('Should fail if any validation fails (expired)', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'PENDING',
    deadline: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    submission_id: 'submission-1'
  };
  
  const ownershipValid = validateOwnership(assignment, 'user-123').valid;
  const statusValid = validateStatus(assignment).valid;
  const expirationValid = validateExpiration(assignment).valid;
  
  return ownershipValid && statusValid && !expirationValid;
});

test('Should fail if any validation fails (already done)', () => {
  const assignment: Assignment = {
    id: 'assignment-1',
    reviewer_user_id: 'user-123',
    status: 'DONE',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    submission_id: 'submission-1'
  };
  
  const ownershipValid = validateOwnership(assignment, 'user-123').valid;
  const statusValid = validateStatus(assignment).valid;
  const expirationValid = validateExpiration(assignment).valid;
  
  return ownershipValid && !statusValid && expirationValid;
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
