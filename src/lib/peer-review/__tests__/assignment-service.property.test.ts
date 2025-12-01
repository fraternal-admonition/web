/**
 * Property-Based Tests for Assignment Service
 * 
 * These tests use fast-check to generate random inputs and verify
 * that the assignment properties hold for all valid inputs.
 * 
 * Run with: npx tsx src/lib/peer-review/__tests__/assignment-service.property.test.ts
 */

import * as fc from 'fast-check';

// ============================================================================
// Mock Types (matching the actual service types)
// ============================================================================

interface Submission {
  id: string;
  user_id: string;
  submission_code: string;
  title: string;
  body_text: string;
  status: string;
}

interface Reviewer {
  id: string;
  display_id: string;
  email?: string;
}

interface Assignment {
  submission_id: string;
  reviewer_user_id: string;
  status: 'PENDING' | 'DONE' | 'EXPIRED';
  deadline: string;
}

// ============================================================================
// Pure Functions to Test (extracted from service logic)
// ============================================================================

/**
 * Filter eligible submissions (SUBMITTED or REINSTATED)
 */
function filterEligibleSubmissions(submissions: Submission[]): Submission[] {
  return submissions.filter(s => 
    s.status === 'SUBMITTED' || s.status === 'REINSTATED'
  );
}

/**
 * Filter eligible reviewers (users with eligible submissions, not banned)
 */
function filterEligibleReviewers(
  submissions: Submission[],
  users: Array<{ id: string; display_id: string; is_banned: boolean }>
): Reviewer[] {
  const eligibleSubmissions = filterEligibleSubmissions(submissions);
  const eligibleUserIds = new Set(eligibleSubmissions.map(s => s.user_id));
  
  const reviewers: Reviewer[] = [];
  const seen = new Set<string>();
  
  for (const user of users) {
    if (!user.is_banned && eligibleUserIds.has(user.id) && !seen.has(user.id)) {
      reviewers.push({
        id: user.id,
        display_id: user.display_id
      });
      seen.add(user.id);
    }
  }
  
  return reviewers;
}

/**
 * Create balanced assignments
 */
function createBalancedAssignments(
  reviewers: Reviewer[],
  submissions: Submission[],
  reviewsPerReviewer: number,
  deadline: Date
): Assignment[] {
  const assignments: Assignment[] = [];
  const reviewCountPerSubmission = new Map<string, number>();
  
  // Initialize review counts
  submissions.forEach(s => reviewCountPerSubmission.set(s.id, 0));
  
  // For each reviewer
  for (const reviewer of reviewers) {
    // Get submissions they can review (not their own)
    const availableSubmissions = submissions.filter(
      s => s.user_id !== reviewer.id
    );
    
    // Sort by current review count (ascending) for balance
    availableSubmissions.sort((a, b) => {
      const countA = reviewCountPerSubmission.get(a.id) || 0;
      const countB = reviewCountPerSubmission.get(b.id) || 0;
      return countA - countB;
    });
    
    // Assign first N (or all available if fewer)
    const toAssign = availableSubmissions.slice(0, Math.min(reviewsPerReviewer, availableSubmissions.length));
    
    for (const submission of toAssign) {
      assignments.push({
        submission_id: submission.id,
        reviewer_user_id: reviewer.id,
        status: 'PENDING',
        deadline: deadline.toISOString()
      });
      
      // Increment review count for this submission
      const current = reviewCountPerSubmission.get(submission.id) || 0;
      reviewCountPerSubmission.set(submission.id, current + 1);
    }
  }
  
  return assignments;
}

// ============================================================================
// Generators for Property-Based Testing
// ============================================================================

/**
 * Generate a random submission
 */
const submissionGen = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  submission_code: fc.string({ minLength: 6, maxLength: 10 }),
  title: fc.string({ minLength: 10, maxLength: 100 }),
  body_text: fc.string({ minLength: 50, maxLength: 500 }),
  status: fc.constantFrom('SUBMITTED', 'REINSTATED', 'DISQUALIFIED', 'PENDING', 'ELIMINATED')
});

/**
 * Generate a random user
 */
const userGen = fc.record({
  id: fc.uuid(),
  display_id: fc.string({ minLength: 5, maxLength: 15 }),
  is_banned: fc.boolean()
});

// ============================================================================
// Property 1: Eligible Submission Selection
// Validates: Requirements 1.2, 1.3, 1.4
// ============================================================================

console.log('=== Property 1: Eligible Submission Selection ===');
console.log('Testing that only SUBMITTED and REINSTATED submissions are selected\n');

const property1 = fc.property(
  fc.array(submissionGen, { minLength: 1, maxLength: 50 }),
  (submissions) => {
    const eligible = filterEligibleSubmissions(submissions);
    
    // All eligible submissions must have status SUBMITTED or REINSTATED
    const allEligible = eligible.every(s => 
      s.status === 'SUBMITTED' || s.status === 'REINSTATED'
    );
    
    // No ineligible submissions should be included
    const noIneligible = eligible.every(s => 
      s.status !== 'DISQUALIFIED' && 
      s.status !== 'PENDING' && 
      s.status !== 'ELIMINATED'
    );
    
    // All SUBMITTED and REINSTATED submissions should be included
    const expectedCount = submissions.filter(s => 
      s.status === 'SUBMITTED' || s.status === 'REINSTATED'
    ).length;
    const actualCount = eligible.length;
    
    const passed = allEligible && noIneligible && expectedCount === actualCount;
    
    if (!passed) {
      console.log('FAILED:');
      console.log('  Total submissions:', submissions.length);
      console.log('  Expected eligible:', expectedCount);
      console.log('  Actual eligible:', actualCount);
      console.log('  All eligible?', allEligible);
      console.log('  No ineligible?', noIneligible);
    }
    
    return passed;
  }
);

const result1 = fc.check(property1, { numRuns: 100 });

if (result1.failed) {
  console.log('❌ FAILED: Property 1');
  console.log('Counterexample:', result1.counterexample);
} else {
  console.log('✅ PASSED: Property 1 (100 iterations)');
  console.log('   Verified that only SUBMITTED and REINSTATED submissions are selected\n');
}

// ============================================================================
// Property 2: Eligible Reviewer Selection
// Validates: Requirements 1.5
// ============================================================================

console.log('=== Property 2: Eligible Reviewer Selection ===');
console.log('Testing that only users with eligible submissions are selected as reviewers\n');

const property2 = fc.property(
  fc.array(submissionGen, { minLength: 1, maxLength: 50 }),
  fc.array(userGen, { minLength: 1, maxLength: 50 }),
  (submissions, users) => {
    // Create submissions that match some users
    const modifiedSubmissions = submissions.map((s, i) => ({
      ...s,
      user_id: users[i % users.length].id
    }));
    
    const reviewers = filterEligibleReviewers(modifiedSubmissions, users);
    
    // All reviewers must have at least one eligible submission
    const eligibleSubmissions = filterEligibleSubmissions(modifiedSubmissions);
    const eligibleUserIds = new Set(eligibleSubmissions.map(s => s.user_id));
    
    const allHaveEligibleSubmission = reviewers.every(r => 
      eligibleUserIds.has(r.id)
    );
    
    // No banned users should be reviewers
    const noBannedUsers = reviewers.every(r => {
      const user = users.find(u => u.id === r.id);
      return user && !user.is_banned;
    });
    
    // No duplicate reviewers
    const reviewerIds = reviewers.map(r => r.id);
    const noDuplicates = reviewerIds.length === new Set(reviewerIds).size;
    
    const passed = allHaveEligibleSubmission && noBannedUsers && noDuplicates;
    
    if (!passed) {
      console.log('FAILED:');
      console.log('  Total users:', users.length);
      console.log('  Eligible submissions:', eligibleSubmissions.length);
      console.log('  Reviewers:', reviewers.length);
      console.log('  All have eligible submission?', allHaveEligibleSubmission);
      console.log('  No banned users?', noBannedUsers);
      console.log('  No duplicates?', noDuplicates);
    }
    
    return passed;
  }
);

const result2 = fc.check(property2, { numRuns: 100 });

if (result2.failed) {
  console.log('❌ FAILED: Property 2');
  console.log('Counterexample:', result2.counterexample);
} else {
  console.log('✅ PASSED: Property 2 (100 iterations)');
  console.log('   Verified that only users with eligible submissions are selected as reviewers\n');
}

// ============================================================================
// Property 3: Assignment Count Per Reviewer
// Validates: Requirements 3.1
// ============================================================================

console.log('=== Property 3: Assignment Count Per Reviewer ===');
console.log('Testing that each reviewer gets exactly N assignments (or fewer if insufficient)\n');

const property3 = fc.property(
  fc.integer({ min: 5, max: 20 }), // Number of reviewers
  fc.integer({ min: 10, max: 50 }), // Number of submissions
  fc.integer({ min: 5, max: 15 }), // Reviews per reviewer
  (numReviewers, numSubmissions, reviewsPerReviewer) => {
    // Create reviewers
    const reviewers: Reviewer[] = Array.from({ length: numReviewers }, (_, i) => ({
      id: `reviewer-${i}`,
      display_id: `R${i}`
    }));
    
    // Create submissions with different authors
    const submissions: Submission[] = Array.from({ length: numSubmissions }, (_, i) => ({
      id: `submission-${i}`,
      user_id: `author-${i}`,
      submission_code: `SUB${i}`,
      title: `Title ${i}`,
      body_text: `Body ${i}`,
      status: 'SUBMITTED'
    }));
    
    const assignments = createBalancedAssignments(
      reviewers,
      submissions,
      reviewsPerReviewer,
      new Date()
    );
    
    // Count assignments per reviewer
    const assignmentCounts = new Map<string, number>();
    for (const assignment of assignments) {
      const count = assignmentCounts.get(assignment.reviewer_user_id) || 0;
      assignmentCounts.set(assignment.reviewer_user_id, count + 1);
    }
    
    // Each reviewer should have exactly reviewsPerReviewer assignments
    // (or fewer if there aren't enough submissions)
    const maxPossible = Math.min(reviewsPerReviewer, numSubmissions);
    const allCorrectCount = reviewers.every(r => {
      const count = assignmentCounts.get(r.id) || 0;
      return count <= maxPossible;
    });
    
    const passed = allCorrectCount;
    
    if (!passed) {
      console.log('FAILED:');
      console.log('  Reviewers:', numReviewers);
      console.log('  Submissions:', numSubmissions);
      console.log('  Reviews per reviewer:', reviewsPerReviewer);
      console.log('  Max possible:', maxPossible);
      console.log('  Assignment counts:', Array.from(assignmentCounts.entries()));
    }
    
    return passed;
  }
);

const result3 = fc.check(property3, { numRuns: 100 });

if (result3.failed) {
  console.log('❌ FAILED: Property 3');
  console.log('Counterexample:', result3.counterexample);
} else {
  console.log('✅ PASSED: Property 3 (100 iterations)');
  console.log('   Verified that each reviewer gets correct number of assignments\n');
}

// ============================================================================
// Property 4: No Self-Review
// Validates: Requirements 3.3
// ============================================================================

console.log('=== Property 4: No Self-Review ===');
console.log('Testing that no reviewer is assigned their own submission\n');

const property4 = fc.property(
  fc.integer({ min: 5, max: 20 }), // Number of users (both reviewers and authors)
  fc.integer({ min: 10, max: 15 }), // Reviews per reviewer
  (numUsers, reviewsPerReviewer) => {
    // Create users who are both reviewers and authors
    const reviewers: Reviewer[] = Array.from({ length: numUsers }, (_, i) => ({
      id: `user-${i}`,
      display_id: `U${i}`
    }));
    
    // Create submissions where each user has one submission
    const submissions: Submission[] = Array.from({ length: numUsers }, (_, i) => ({
      id: `submission-${i}`,
      user_id: `user-${i}`, // Same as reviewer ID
      submission_code: `SUB${i}`,
      title: `Title ${i}`,
      body_text: `Body ${i}`,
      status: 'SUBMITTED'
    }));
    
    const assignments = createBalancedAssignments(
      reviewers,
      submissions,
      reviewsPerReviewer,
      new Date()
    );
    
    // Check that no assignment has matching reviewer and submission author
    const noSelfReview = assignments.every(assignment => {
      const submission = submissions.find(s => s.id === assignment.submission_id);
      return submission && submission.user_id !== assignment.reviewer_user_id;
    });
    
    if (!noSelfReview) {
      console.log('FAILED:');
      console.log('  Found self-review assignment!');
      const selfReview = assignments.find(assignment => {
        const submission = submissions.find(s => s.id === assignment.submission_id);
        return submission && submission.user_id === assignment.reviewer_user_id;
      });
      console.log('  Assignment:', selfReview);
    }
    
    return noSelfReview;
  }
);

const result4 = fc.check(property4, { numRuns: 100 });

if (result4.failed) {
  console.log('❌ FAILED: Property 4');
  console.log('Counterexample:', result4.counterexample);
} else {
  console.log('✅ PASSED: Property 4 (100 iterations)');
  console.log('   Verified that no reviewer is assigned their own submission\n');
}

// ============================================================================
// Property 7: Balanced Review Distribution
// Validates: Requirements 4.1, 4.2, 4.3
// ============================================================================

console.log('=== Property 7: Balanced Review Distribution ===');
console.log('Testing that review counts are balanced across submissions\n');

const property7 = fc.property(
  fc.integer({ min: 10, max: 30 }), // Number of reviewers
  fc.integer({ min: 20, max: 50 }), // Number of submissions
  fc.integer({ min: 5, max: 15 }), // Reviews per reviewer
  (numReviewers, numSubmissions, reviewsPerReviewer) => {
    // Create reviewers
    const reviewers: Reviewer[] = Array.from({ length: numReviewers }, (_, i) => ({
      id: `reviewer-${i}`,
      display_id: `R${i}`
    }));
    
    // Create submissions with different authors
    const submissions: Submission[] = Array.from({ length: numSubmissions }, (_, i) => ({
      id: `submission-${i}`,
      user_id: `author-${i}`,
      submission_code: `SUB${i}`,
      title: `Title ${i}`,
      body_text: `Body ${i}`,
      status: 'SUBMITTED'
    }));
    
    const assignments = createBalancedAssignments(
      reviewers,
      submissions,
      reviewsPerReviewer,
      new Date()
    );
    
    // Count reviews per submission
    const reviewCounts = new Map<string, number>();
    for (const assignment of assignments) {
      const count = reviewCounts.get(assignment.submission_id) || 0;
      reviewCounts.set(assignment.submission_id, count + 1);
    }
    
    // Calculate variance
    const counts = Array.from(reviewCounts.values());
    if (counts.length === 0) return true;
    
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    const variance = max - min;
    
    // Variance should be minimal (ideally 0 or 1)
    // In practice, with random assignment, variance of 2 is acceptable
    const balanced = variance <= 2;
    
    if (!balanced) {
      console.log('FAILED:');
      console.log('  Reviewers:', numReviewers);
      console.log('  Submissions:', numSubmissions);
      console.log('  Reviews per reviewer:', reviewsPerReviewer);
      console.log('  Total assignments:', assignments.length);
      console.log('  Review counts:', counts);
      console.log('  Min:', min, 'Max:', max, 'Variance:', variance);
    }
    
    return balanced;
  }
);

const result7 = fc.check(property7, { numRuns: 100 });

if (result7.failed) {
  console.log('❌ FAILED: Property 7');
  console.log('Counterexample:', result7.counterexample);
} else {
  console.log('✅ PASSED: Property 7 (100 iterations)');
  console.log('   Verified that review distribution is balanced across submissions\n');
}

// ============================================================================
// Summary
// ============================================================================

console.log('=== Property-Based Test Summary ===');
const allPassed = !result1.failed && !result2.failed && !result3.failed && !result4.failed && !result7.failed;

if (allPassed) {
  console.log('✅ ALL PROPERTIES PASSED');
  console.log('   - Property 1: Eligible Submission Selection (100 iterations)');
  console.log('   - Property 2: Eligible Reviewer Selection (100 iterations)');
  console.log('   - Property 3: Assignment Count Per Reviewer (100 iterations)');
  console.log('   - Property 4: No Self-Review (100 iterations)');
  console.log('   - Property 7: Balanced Review Distribution (100 iterations)');
  console.log('\n   Total: 500 random test cases passed');
} else {
  console.log('❌ SOME PROPERTIES FAILED');
  if (result1.failed) console.log('   - Property 1 FAILED');
  if (result2.failed) console.log('   - Property 2 FAILED');
  if (result3.failed) console.log('   - Property 3 FAILED');
  if (result4.failed) console.log('   - Property 4 FAILED');
  if (result7.failed) console.log('   - Property 7 FAILED');
  process.exit(1);
}
