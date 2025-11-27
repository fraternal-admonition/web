# Peer Verification Testing Guide

This guide explains how to verify the full peer verification flow, from submission to results.

## Prerequisites

1.  **Database Access**: You need access to run SQL queries in the Supabase dashboard.
2.  **Local Environment**: The app should be running locally (`npm run dev`).

## Step 1: Setup Test Data

Run the provided SQL script to create a test contest, dummy reviewers, and control submissions.

1.  Open `docs/testing/seed-peer-verification.sql`.
2.  Copy the content.
3.  Go to your Supabase Dashboard -> SQL Editor.
4.  Paste and run the script.
5.  **Important**: You need a submission linked to **your** user account to test the flow as an author.
    *   Run this query (replace `YOUR_USER_ID` with your actual ID from `auth.users`):
    ```sql
    INSERT INTO submissions (
      id,
      contest_id,
      user_id,
      title,
      body_text,
      status,
      submission_code,
      created_at
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      'b51037e8-b701-46e0-89f4-dbffb7447d78',
      '2542d92a-9ea7-4312-88c6-35a93103647f', 
      'My Appeal Submission',
      'I believe this was unfairly judged by AI.',
      'ELIMINATED',
      'APPEAL-001',
      NOW()
    );
    ```

## Step 2: Trigger Verification (Bypassing Payment)

Instead of making a real Stripe payment, use the test API route we created.

1.  Make a POST request to the test endpoint:
    ```bash
    curl -X POST http://localhost:3000/api/test/trigger-assignment \
      -H "Content-Type: application/json" \
      -d '{"submissionId": "11111111-1111-1111-1111-111111111111"}'
    ```
    *   Or use Postman/Thunder Client.
2.  Check the response. It should show `success: true` and details about assigned reviewers.

## Step 3: Verify Assignments

1.  Check the database to see the assignments:
    ```sql
    SELECT * FROM peer_assignments WHERE submission_id = '11111111-1111-1111-1111-111111111111';
    ```
2.  You should see 10 assignments.

## Step 4: Perform Reviews (As a Reviewer)

To test the review interface, you need to log in as one of the dummy reviewers. Since we created them in `public.users` but they might not have `auth.users` accounts, you have two options:

**Option A: Temporarily assign an assignment to YOUR user**
1.  Pick one assignment ID from the previous step.
2.  Update it to be assigned to you:
    ```sql
    UPDATE peer_assignments 
    SET reviewer_user_id = 'YOUR_USER_ID' 
    WHERE id = 'SOME_ASSIGNMENT_ID';
    ```
3.  Go to `http://localhost:3000/dashboard/peer-verification-tasks`.
4.  You should see the task.
5.  Click "Start Review", wait 10 seconds, and submit a vote.

**Option B: Create a real test user for a reviewer**
1.  Sign up a new user in the app (e.g., `reviewer@test.com`).
2.  Get their ID from Supabase.
3.  Update an assignment to point to this new user.

## Step 5: Verify Results Calculation

The results are calculated when **all** assignments are `DONE` (or expired, though the current logic might wait for all).

1.  To trigger the calculation, you need to complete all reviews.
2.  **Shortcut**: Manually update the other assignments to `DONE` in the database:
    ```sql
    -- Mark all other assignments as DONE with a 'REINSTATE' vote
    -- First, create the reviews
    INSERT INTO peer_reviews (id, assignment_id, decision, comment_100, created_at)
    SELECT 
      gen_random_uuid(), 
      id, 
      'REINSTATE', 
      'Auto-generated vote', 
      NOW()
    FROM peer_assignments 
    WHERE submission_id = '11111111-1111-1111-1111-111111111111' 
      AND status = 'PENDING';

    -- Then update assignments status
    UPDATE peer_assignments 
    SET status = 'DONE' 
    WHERE submission_id = '11111111-1111-1111-1111-111111111111';
    ```
3.  **Trigger Calculation**: Use the test endpoint to force calculation:
    ```bash
    curl -X POST http://localhost:3000/api/test/calculate-results \
      -H "Content-Type: application/json" \
      -d '{"submissionId": "11111111-1111-1111-1111-111111111111"}'
    ```

## Step 6: Check Final Status

1.  Check the submission status:
    ```sql
    SELECT status, peer_verification_result FROM submissions WHERE id = '11111111-1111-1111-1111-111111111111';
    ```
2.  It should be `REINSTATED` (since we forced 'REINSTATE' votes).

## Cleanup

1.  Delete the test API route `src/app/api/test/trigger-assignment/route.ts` when done.
2.  Clean up test data in the database if needed.
