-- Seed data for Peer Verification Testing

-- 1. Create a test contest (if not exists)
INSERT INTO contests (id, title, status, current_phase, peer_start_at, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test Contest for Peer Verification',
  'ACTIVE',
  'PEER_REVIEW',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create a test author (User A)
-- Note: In a real scenario, this user needs to be in auth.users too. 
-- For testing logic that only relies on public.users, this might be enough, 
-- but for full flow (logging in), you need a real user.
-- We will assume the user running the test will use their OWN user_id for the author
-- OR we create a placeholder that can be used for assignment logic.

-- Let's create 15 dummy reviewers
DO $$
DECLARE
  i INT;
  reviewer_id UUID;
BEGIN
  FOR i IN 1..15 LOOP
    reviewer_id := gen_random_uuid();
    
    -- Create reviewer in public.users
    INSERT INTO public.users (id, display_id, is_banned, integrity_score, qualified_evaluator)
    VALUES (
      reviewer_id,
      'Reviewer ' || i,
      false,
      0,
      false
    );

    -- Create a dummy submission for this reviewer so they are "eligible"
    -- (Eligibility requires having a submission in SUBMITTED or ELIMINATED status)
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
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000001',
      reviewer_id,
      'Reviewer Submission ' || i,
      'This is a dummy submission to make the reviewer eligible.',
      'SUBMITTED',
      'REV-' || i,
      NOW()
    );
  END LOOP;
END $$;

-- 3. Create Control Submissions (for the blind review)
-- Create 5 AI-Passed (SUBMITTED)
DO $$
DECLARE
  i INT;
BEGIN
  FOR i IN 1..5 LOOP
    INSERT INTO submissions (
      id,
      contest_id,
      user_id, -- Assign to random user or a system user
      title,
      body_text,
      status,
      submission_code,
      created_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000001',
      gen_random_uuid(), -- Random user ID (doesn't need to exist in users table for this check usually, but better if it does)
      'Control Passed ' || i,
      'This is a control submission that passed AI screening. It should be reinstated.',
      'SUBMITTED',
      'CTRL-PASS-' || i,
      NOW()
    );
  END LOOP;
END $$;

-- Create 5 AI-Eliminated (ELIMINATED_ACCEPTED)
DO $$
DECLARE
  i INT;
BEGIN
  FOR i IN 1..5 LOOP
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
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000001',
      gen_random_uuid(),
      'Control Eliminated ' || i,
      'This is a control submission that failed AI screening. It should be eliminated.',
      'ELIMINATED_ACCEPTED',
      'CTRL-FAIL-' || i,
      NOW()
    );
  END LOOP;
END $$;

-- 4. Create the Target Submission (The one to be verified)
-- REPLACE 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- so you can see the emails and dashboard.
-- We'll insert a placeholder, you should update it or insert manually.
/*
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
  '00000000-0000-0000-0000-000000000001',
  'YOUR_USER_ID_HERE', 
  'My Appeal Submission',
  'I believe this was unfairly judged by AI.',
  'ELIMINATED', -- Must be ELIMINATED initially
  'APPEAL-001',
  NOW()
);
*/
