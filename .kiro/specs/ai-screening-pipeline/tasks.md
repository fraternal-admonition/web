# Implementation Plan

## Overview

This implementation plan breaks down the AI Screening Pipeline feature into discrete, manageable tasks. Each task builds incrementally on previous work, following test-driven development principles where appropriate. The plan prioritizes core functionality first, with optional testing tasks marked with an asterisk (*).

## Task List

- [x] 1. Database schema updates and migrations



  - Create migration file for new submission statuses (PROCESSING, ELIMINATED, PEER_VERIFICATION_PENDING)
  - Add PEER_VERIFICATION to payment_purpose enum
  - Add phase column to ai_screenings table
  - Create indexes for ai_screenings (status, submission_id)
  - Seed default AI settings in cms_settings
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9_

- [x] 2. TypeScript types and interfaces



  - [x] 2.1 Create AI screening types file

    - Define AIScreeningPhase, AIScreeningStatus enums
    - Define ModerationResult interface
    - Define EvaluationResult interface with all nested structures
    - Define TranslationResult interface
    - Define AIScreeningScores interface
    - Define AIScreening interface
    - _Requirements: All type-related requirements_

- [x] 3. AI settings schema and admin UI


  - [x] 3.1 Update CMS settings schema

    - Add 'ai_screening' category to SETTING_CATEGORIES
    - Add ai_model_name setting (string, default 'gpt-5-mini')
    - Add ai_max_tokens setting (number, default 8000, validation 1000-16000)
    - Add ai_temperature setting (number, default 0.2, validation 0.0-2.0)
    - Add ai_evaluation_prompt setting (textarea, required, min 100 chars)
    - Add ai_translation_prompt setting (textarea, required, min 100 chars)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11_


  - [ ] 3.2 Create default prompt constants
    - Create file with DEFAULT_EVALUATION_PROMPT (adapted from user's prompt)
    - Create DEFAULT_TRANSLATION_PROMPT (adapted from user's prompt)
    - Replace all "essay" references with "letter"
    - Ensure {Letter} placeholder is present
    - _Requirements: 17.3, 17.4, 17.8, 17.9_

- [x] 4. Moderation service implementation



  - [x] 4.1 Create moderation service module


    - Install OpenAI SDK (npm install openai)
    - Create src/lib/ai-screening/moderation-service.ts
    - Implement moderateContent function using OpenAI Moderation API
    - Return ModerationResult with flagged status and categories
    - Add error handling for API failures
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 4.2 Write unit tests for moderation service
    - Test flagged content detection
    - Test clean content passing
    - Test API error handling
    - Mock OpenAI API responses
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Evaluation service implementation


  - [x] 5.1 Create evaluation service module


    - Create src/lib/ai-screening/evaluation-service.ts
    - Implement evaluateLetter function with GPT-5-mini
    - Replace {Letter} placeholder in prompt
    - Parse JSON response into EvaluationResult
    - Validate all required fields are present
    - Add error handling for API failures and JSON parsing
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 5.2 Write unit tests for evaluation service
    - Test JSON parsing with valid response
    - Test validation of required fields
    - Test error handling for invalid JSON
    - Mock OpenAI API responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 6. Translation service implementation



  - [x] 6.1 Create translation service module


    - Create src/lib/ai-screening/translation-service.ts
    - Implement translateLetter function with GPT-5-mini
    - Replace {Letter} placeholder in prompt
    - Parse JSON response into TranslationResult
    - Validate all language fields are present (OLANG, EN, DE, FR, IT, ES)
    - Add error handling for API failures
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 6.2 Write unit tests for translation service
    - Test JSON parsing with valid response
    - Test validation of required language fields
    - Test error handling for invalid JSON
    - Mock OpenAI API responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 7. Retry utility implementation



  - [x] 7.1 Create retry utility module

    - Create src/lib/ai-screening/retry-utils.ts
    - Implement withRetry function with exponential backoff
    - Add jitter to prevent thundering herd
    - Handle 4xx errors (don't retry except 429)
    - Handle 5xx errors (retry with backoff)
    - Handle rate limit errors (respect retry-after header)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [ ]* 7.2 Write unit tests for retry utility
    - Test successful retry after failure
    - Test max retries exhausted
    - Test 4xx error handling (no retry)
    - Test 429 rate limit handling
    - Test exponential backoff timing
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 8. Main screening service orchestrator




  - [x] 8.1 Create screening service module

    - Create src/lib/ai-screening/screening-service.ts
    - Implement executeAIScreening function
    - Load AI configuration from cms_settings
    - Generate prompt hash for audit trail
    - Initialize ai_screenings record
    - Update submission status to PROCESSING
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_


  - [x] 8.2 Implement phase 1: Moderation

    - Call moderateContent service
    - Update ai_screenings with moderation results
    - If flagged, stop pipeline and mark FAILED
    - If clean, continue to evaluation
    - Store flagged categories in scores JSON
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_



  - [ ] 8.3 Implement phase 2: Evaluation
    - Call evaluateLetter service with config
    - Update ai_screenings with evaluation results
    - Store all evaluation fields in scores JSON
    - Determine pass/fail/review status based on criteria
    - Continue to translation regardless of status

    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15, 3.16_


  - [ ] 8.4 Implement phase 3: Translation
    - Call translateLetter service with config
    - Update ai_screenings with translation results
    - Store all translations in scores JSON
    - Execute regardless of evaluation pass/fail

    - Handle translation errors gracefully (non-critical)

    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ] 8.5 Implement finalization logic
    - Update submission status based on screening result (SUBMITTED if passed, ELIMINATED if failed)
    - Set ai_screenings phase to COMPLETE
    - Set ai_screenings status (PASSED/FAILED/REVIEW)
    - Send email notification to user
    - Handle errors and mark as REVIEW if needed
    - _Requirements: 1.5, 1.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_

  - [ ]* 8.6 Write integration tests for screening service
    - Test full pipeline execution (moderation → evaluation → translation)
    - Test moderation failure stops pipeline
    - Test evaluation pass/fail criteria
    - Test error recovery and REVIEW status
    - Mock all AI service calls
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 9. Webhook integration




  - [x] 9.1 Update Stripe webhook handler

    - Import executeAIScreening function
    - After updating submission to SUBMITTED, trigger AI screening
    - Execute screening asynchronously (don't block webhook response)
    - Add error handling (log but don't fail webhook)
    - Add logging for screening trigger
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 9.2 Test webhook integration
    - Test screening triggered after payment
    - Test webhook completes even if screening fails
    - Test idempotency (don't re-screen if already processed)
    - Use Stripe CLI for webhook testing
    - _Requirements: 1.1, 1.2_

- [x] 10. Screening results page








  - [x] 10.1 Create results page route

    - Create src/app/contest/screening-results/[submissionId]/page.tsx
    - Fetch submission with ai_screenings data
    - Verify user owns submission (authorization)
    - Redirect to signin if not authenticated
    - Redirect to dashboard if submission not found

    - Pass data to client component
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12_


  - [x] 10.2 Create results client component
    - Create ScreeningResultsClient component
    - Display submission code prominently
    - Show status banner (passed/failed/review)
    - Display moderation results if flagged
    - Display evaluation scores in organized sections

    - Display translations in tabs (EN, DE, FR, IT, ES)
    - Show detected original language
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12_


  - [x] 10.3 Implement user response options (failed letters)
    - Show Option A and Option B buttons if letter failed
    - Handle Option A selection (agreement)
    - Handle Option B selection (disagreement)

    - Show Option B1 and B2 sub-choices
    - Display appropriate confirmation messages
    - Record user choices in ai_screenings.notes

    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 10.4 Implement peer verification payment flow
    - Create payment button for Option B2
    - Show $20 fee and explanation
    - Create API route for peer verification checkout
    - Handle Stripe checkout session creation
    - Redirect to Stripe for payment
    - Handle success/cancel redirects
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_


- [x] 11. Peer verification payment API


  - [x] 11.1 Create peer verification checkout API route


    - Create src/app/api/payments/peer-verification/route.ts
    - Validate submission_id from request body
    - Verify user owns submission
    - Verify submission status is ELIMINATED
    - Verify peer verification not already requested
    - Create payment record with purpose PEER_VERIFICATION
    - Create Stripe checkout session with $20 amount
    - Include submission_id in metadata
    - Return checkout URL
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_


  - [x] 11.2 Update webhook handler for peer verification

    - Handle checkout.session.completed for PEER_VERIFICATION purpose
    - Update payment status to PAID
    - Update submission status to PEER_VERIFICATION_PENDING
    - Create flag record with entity_type SUBMISSION and reason PEER_VERIFICATION_REQUESTED
    - Send confirmation email to user
    - _Requirements: 8.6, 8.7, 8.8, 8.9, 8.10_


  - [x] 11.3 Create peer verification confirmation page

    - Create src/app/contest/peer-verification-confirmed/[submissionId]/page.tsx
    - Display success message
    - Show submission code
    - Explain next steps (peer review process)
    - Provide link to dashboard to track status
    - _Requirements: 8.10_

- [x] 12. Dashboard integration
  - [x] 12.1 Update dashboard to show screening status
    - Fetch ai_screenings data with submissions
    - Display screening status for each submission
    - Show "AI Screening in Progress" for PROCESSING status
    - Show "Passed AI Screening" for PASSED status
    - Show "Eliminated by AI" for FAILED status with link to results
    - Show "Under Manual Review" for REVIEW status
    - Show "Peer Verification Requested" for PEER_VERIFICATION_PENDING
    - Add quick action button to "Submit New Letter" for eliminated submissions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 13. Email notifications
  - [x] 13.1 Create screening results email template
    - Create email template for passed letters
    - Create email template for failed letters
    - Include submission code in both templates
    - Include link to screening results page
    - Mention peer verification option in failed email
    - Use transactional email service
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

  - [x] 13.2 Implement email sending in screening service
    - Call sendScreeningResultsEmail after finalization
    - Pass submission code, status, and user email
    - Handle email sending errors gracefully (log but don't fail screening)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

  - [x] 13.3 Create peer verification confirmation email
    - Create email template for peer verification confirmation
    - Include submission code and next steps
    - Explain peer review process
    - Provide link to dashboard
    - _Requirements: 8.10_

- [x] 14. Admin screening dashboard
  - [x] 14.1 Update admin submissions list
    - Add ai_screenings.status column to table
    - Add filter dropdown for screening status (PASSED, FAILED, REVIEW, PEER_VERIFICATION_PENDING)
    - Display screening status badge with color coding
    - Add "Screening Status" to search/filter options
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [x] 14.2 Create admin submission detail page with screening results
    - Display full ai_screenings data
    - Show all evaluation scores in readable format
    - Show translations in tabs
    - Display model_name, model_version, prompt_hash
    - Show screening phase and status
    - Display moderation results if flagged
    - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

  - [x] 14.3 Implement manual override functionality
    - Add "Override to PASSED" button for REVIEW submissions
    - Add "Override to FAILED" button for REVIEW submissions
    - Create API route for manual override
    - Update ai_screenings.status and submission.status
    - Log action in audit_logs
    - Show confirmation dialog before override
    - _Requirements: 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 14.4 Add peer verification flag indicator
    - Display flag icon for submissions with PEER_VERIFICATION_PENDING status
    - Show flag details (reason, created_at)
    - Provide link to view peer verification details
    - _Requirements: 11.9_

- [ ] 15. Admin settings UI updates
  - [ ] 15.1 Verify AI settings display in admin
    - Navigate to /admin/cms/settings
    - Verify "AI Screening" category is visible
    - Verify all AI settings are displayed (model, max_tokens, temperature, prompts)
    - Test editing each setting
    - Test validation (min/max for numbers, required fields)
    - Test saving changes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11_

- [ ] 16. Contest phase integration
  - [ ] 16.1 Update contest phase checks
    - Verify screening only triggers during SUBMISSIONS_OPEN phase
    - Handle in-progress screenings when phase changes to SUBMISSIONS_CLOSED
    - Update peer review eligibility to only include PASSED submissions
    - Exclude ELIMINATED and PEER_VERIFICATION_PENDING from peer review pool
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 17. Security and authorization
  - [x] 17.1 Implement security checks
    - Verify user authentication for all screening-related routes
    - Verify submission ownership before showing results
    - Verify admin role for manual override
    - Verify payment confirmation before triggering screening
    - Implement rate limiting on peer verification payment
    - Verify peer verification not already requested
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

  - [x] 17.2 Add audit logging
    - Log all manual overrides in audit_logs
    - Log peer verification requests
    - Log screening failures
    - Log admin access to screening results
    - _Requirements: 11.8, 15.9_

- [ ] 18. Error handling and monitoring
  - [ ] 18.1 Implement comprehensive error handling
    - Add try-catch blocks in all AI service calls
    - Implement retry logic with exponential backoff
    - Handle JSON parsing errors gracefully
    - Mark submissions as REVIEW on technical errors
    - Log all errors with context
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

  - [ ] 18.2 Add monitoring and alerts
    - Set up Sentry alerts for screening failures
    - Monitor OpenAI API response times
    - Track screening success/failure rates
    - Alert on high REVIEW queue
    - Monitor OpenAI API costs
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ] 19. Testing and validation
  - [ ]* 19.1 End-to-end testing
    - Test complete flow: submit → pay → screening → results
    - Test moderation failure path
    - Test evaluation failure path
    - Test pass path
    - Test Option A, B1, B2 flows
    - Test peer verification payment
    - Test admin override
    - _Requirements: All requirements_

  - [ ]* 19.2 Load testing
    - Test concurrent screening requests
    - Test OpenAI API rate limits
    - Test database performance under load
    - Test webhook processing under high volume
    - _Requirements: Performance-related requirements_

- [ ] 20. Documentation and deployment
  - [ ] 20.1 Update environment variables documentation
    - Document OPENAI_API_KEY requirement
    - Update .env.example file
    - Document AI settings configuration
    - Document deployment steps
    - _Requirements: All deployment-related requirements_

  - [ ] 20.2 Create admin guide
    - Document how to configure AI prompts
    - Document how to review REVIEW submissions
    - Document how to manually override
    - Document how to monitor screening health
    - Document peer verification process
    - _Requirements: Admin-related requirements_

  - [ ] 20.3 Deploy and verify
    - Run database migrations
    - Seed default AI settings
    - Verify OpenAI API key is configured
    - Test screening on staging environment
    - Monitor first production screenings
    - _Requirements: All requirements_

## Notes

- Tasks marked with * are optional testing tasks that can be skipped for MVP
- The peer verification review process (after payment) is NOT implemented in this spec
- A separate spec is required for implementing the peer verification review workflow
- This spec focuses on: AI screening pipeline, results display, and payment for peer verification
- The actual peer review assignment, collection, and outcome determination will be in a future spec

