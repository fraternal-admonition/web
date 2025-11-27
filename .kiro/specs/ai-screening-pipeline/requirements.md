# Requirements Document

## Introduction

This feature implements a comprehensive AI screening pipeline that automatically evaluates submitted letters immediately after payment confirmation. The pipeline consists of three sequential phases: **AI Moderation** (content safety check), **AI Evaluation** (quality and thematic assessment), and **AI Translation** (multi-language translation). This replaces the previous separate "AI Filtering" phase and integrates directly into the submission workflow.

When a user pays the $7 entry fee, the system automatically triggers the AI screening pipeline. The user sees a unified results page showing their evaluation scores, translations, and whether their letter passed or failed the screening criteria. If a letter fails, users have the option to disagree with the AI decision and request peer verification for an additional $20 fee.

The feature includes admin controls for managing AI prompts, model configuration (GPT-4o-mini with configurable parameters), and monitoring screening results. All three AI phases execute automatically, with moderation being a silent gatekeeper (users only see it if content is flagged), while evaluation and translation results are always displayed together.

## Requirements

### Requirement 1: AI Screening Trigger After Payment

**User Story:** As a system, I want to automatically trigger AI screening immediately after a submission payment is confirmed, so that letters are evaluated without manual intervention.

#### Acceptance Criteria

1. WHEN a Stripe webhook confirms payment for purpose ENTRY_FEE THEN the system SHALL trigger the AI screening pipeline for that submission
2. WHEN the AI screening pipeline is triggered THEN the system SHALL update the submission status to 'PROCESSING'
3. WHEN the AI screening pipeline starts THEN the system SHALL execute phases in order: Moderation → Evaluation → Translation
4. WHEN any AI phase fails due to technical error THEN the system SHALL log the error and set submission status to 'REVIEW'
5. WHEN all AI phases complete successfully THEN the system SHALL update submission status based on evaluation results
6. WHEN the AI screening pipeline completes THEN the system SHALL send an email notification to the user with results
7. WHEN a submission is in 'PROCESSING' status THEN the user SHALL see a loading state on their dashboard

### Requirement 2: AI Moderation Phase (Content Safety)

**User Story:** As a system, I want to check submitted letters for harmful content categories before evaluation, so that inappropriate content is filtered out early.

#### Acceptance Criteria

1. WHEN the AI screening pipeline starts THEN the system SHALL first execute the moderation phase
2. WHEN executing moderation THEN the system SHALL use OpenAI Moderation API to check the letter body
3. WHEN moderation is executed THEN the system SHALL check for categories: Hate, Hate/Threatening, Self-Harm, Sexual, Sexual/Minors, Violence, Violence/Graphic
4. IF any moderation category is flagged THEN the system SHALL immediately stop the pipeline and mark the submission as 'FAILED'
5. IF moderation flags content THEN the system SHALL store the flagged categories in ai_screenings.scores JSON
6. IF moderation flags content THEN the system SHALL set ai_screenings.status to 'FAILED' with notes indicating the specific category
7. IF moderation passes THEN the system SHALL proceed to the evaluation phase
8. WHEN moderation fails THEN the user SHALL see which category was flagged on the results page
9. WHEN moderation fails THEN the user SHALL NOT see evaluation or translation results
10. WHEN moderation is executed THEN the system SHALL store model_name as 'text-moderation-latest' in ai_screenings

### Requirement 3: AI Evaluation Phase (Quality Assessment)

**User Story:** As a system, I want to evaluate letters using a customizable prompt that assesses quality, thematic alignment, and identity anonymity, so that only qualifying letters proceed to peer review.

#### Acceptance Criteria

1. WHEN moderation passes THEN the system SHALL execute the evaluation phase
2. WHEN executing evaluation THEN the system SHALL use the AI evaluation prompt from cms_settings with key 'ai_evaluation_prompt'
3. WHEN executing evaluation THEN the system SHALL use model 'gpt-5-mini' with max_tokens from 'ai_max_tokens' setting and temperature from 'ai_temperature' setting
4. WHEN executing evaluation THEN the system SHALL replace {Letter} placeholder in prompt with the submission body_text
5. WHEN evaluation completes THEN the system SHALL parse the JSON response containing: Rating, Summary, Identity, Language, Goethe, Quote, DTSentiment, Corruption, Compensation, Impact, AsGerman, StateInstitute
6. WHEN evaluation response is parsed THEN the system SHALL store all fields in ai_screenings.scores JSON
7. WHEN evaluation completes THEN the system SHALL determine pass/fail status based on criteria
8. IF Identity.Revealed is true THEN the system SHALL mark ai_screenings.status as 'FAILED'
9. IF Goethe.GScore is less than 2.0 THEN the system SHALL mark ai_screenings.status as 'FAILED'
10. IF Rating.Overall Impression is less than 2.5 THEN the system SHALL mark ai_screenings.status as 'FAILED'
11. IF Rating.Grammatical Accuracy is less than 2.0 THEN the system SHALL mark ai_screenings.status as 'FAILED'
12. IF Language is not 'English' THEN the system SHALL mark ai_screenings.status as 'REVIEW'
13. IF Goethe.GScore is between 2.0 and 2.5 THEN the system SHALL mark ai_screenings.status as 'REVIEW'
14. IF Rating.Overall Impression is between 2.5 and 3.0 THEN the system SHALL mark ai_screenings.status as 'REVIEW'
15. IF all pass criteria are met THEN the system SHALL mark ai_screenings.status as 'PASSED'
16. WHEN evaluation completes THEN the system SHALL proceed to translation phase regardless of pass/fail status

### Requirement 4: AI Translation Phase (Multi-Language)

**User Story:** As a system, I want to translate all letters to English, German, French, Italian, and Spanish, so that international audiences can read submissions.

#### Acceptance Criteria

1. WHEN evaluation phase completes THEN the system SHALL execute the translation phase
2. WHEN executing translation THEN the system SHALL use the AI translation prompt from cms_settings with key 'ai_translation_prompt'
3. WHEN executing translation THEN the system SHALL use model 'gpt-5-mini' with max_tokens from 'ai_max_tokens' setting and temperature from 'ai_temperature' setting
4. WHEN executing translation THEN the system SHALL replace {Letter} placeholder in prompt with the submission body_text
5. WHEN translation completes THEN the system SHALL parse the JSON response containing: OLANG, EN, DE, FR, IT, ES
6. WHEN translation response is parsed THEN the system SHALL store translations in ai_screenings.scores JSON under 'translations' key
7. WHEN translation completes THEN the system SHALL store the detected original language (OLANG) in ai_screenings.scores
8. WHEN translation completes THEN the system SHALL execute regardless of whether evaluation passed or failed
9. WHEN translation fails due to API error THEN the system SHALL log the error but not fail the entire screening
10. WHEN all phases complete THEN the system SHALL update submission status to 'SUBMITTED' if passed, 'ELIMINATED' if failed

### Requirement 5: AI Screening Results Page

**User Story:** As a user whose letter has been screened, I want to see my evaluation scores and translations on a dedicated results page, so that I understand how my letter was assessed.

#### Acceptance Criteria

1. WHEN a user's submission completes AI screening THEN the system SHALL redirect them to /contest/screening-results/[submissionId]
2. WHEN the results page loads THEN the system SHALL display the submission code prominently
3. WHEN the results page loads AND moderation failed THEN the system SHALL display which content category was flagged
4. WHEN the results page loads AND moderation failed THEN the system SHALL NOT display evaluation or translation results
5. WHEN the results page loads AND moderation passed THEN the system SHALL display all evaluation scores in organized sections
6. WHEN displaying evaluation scores THEN the system SHALL show: Rating (all fields), Summary, Goethe Score with explanation, Quote with reference
7. WHEN the results page loads THEN the system SHALL display translations in tabs for EN, DE, FR, IT, ES
8. WHEN the results page loads THEN the system SHALL indicate the detected original language
9. WHEN the results page loads AND letter passed THEN the system SHALL display "Your letter has passed AI screening and is proceeding to peer evaluation"
10. WHEN the results page loads AND letter failed THEN the system SHALL display "Your letter has been eliminated by the AI system"
11. WHEN letter failed THEN the system SHALL display two option buttons: "Option A: I agree with the AI decision" and "Option B: I disagree with the AI decision"
12. WHEN the results page loads THEN the system SHALL provide a link to return to dashboard

### Requirement 6: User Response to Failed Screening (Option A - Agreement)

**User Story:** As a user whose letter failed AI screening, I want to acknowledge the decision if I agree with it, so that I can submit a new letter with better attention to criteria.

#### Acceptance Criteria

1. WHEN a user clicks "Option A: I agree with the AI decision" THEN the system SHALL display a confirmation message
2. WHEN Option A is confirmed THEN the system SHALL display "We're sorry your work was eliminated. You may submit another entry with closer attention to the contest criteria. Thank you for contributing to the integrity of this contest."
3. WHEN Option A is selected THEN the system SHALL record the user's choice in ai_screenings.notes with timestamp
4. WHEN Option A is selected THEN the system SHALL NOT change the submission status (remains 'ELIMINATED')
5. WHEN Option A confirmation is displayed THEN the system SHALL provide a button to "Submit Another Letter"
6. WHEN "Submit Another Letter" is clicked THEN the system SHALL navigate to /contest/submit

### Requirement 7: User Response to Failed Screening (Option B - Disagreement)

**User Story:** As a user whose letter failed AI screening, I want to disagree with the decision and see my options for peer verification, so that I can request human review if I believe the AI was incorrect.

#### Acceptance Criteria

1. WHEN a user clicks "Option B: I disagree with the AI decision" THEN the system SHALL display two sub-options
2. WHEN Option B is clicked THEN the system SHALL display "Option B1: I will not request peer verification" and "Option B2: I want to request peer verification of the AI decision"
3. WHEN Option B2 is displayed THEN the system SHALL show explanatory text: "Peer verification: blind review of your work by 10 other contestants. Reviewers do not know whether the AI eliminated or approved your work."
4. WHEN Option B2 is displayed THEN the system SHALL show the $20 fee requirement
5. WHEN a user selects Option B1 THEN the system SHALL display "We respect your decision not to request verification. Your entry remains eliminated but your feedback helps us improve AI fairness."
6. WHEN Option B1 is selected THEN the system SHALL record the user's choice in ai_screenings.notes with timestamp
7. WHEN Option B1 is selected THEN the system SHALL NOT change the submission status (remains 'ELIMINATED')

### Requirement 8: Peer Verification Payment (Option B2)

**User Story:** As a user who disagrees with AI elimination, I want to pay $20 to request peer verification, so that human reviewers can assess whether the AI decision was correct.

#### Acceptance Criteria

1. WHEN a user clicks "Option B2: I want to request peer verification" THEN the system SHALL display a Stripe payment button
2. WHEN the payment button is displayed THEN the system SHALL show "To activate peer verification, a $20 fee is required"
3. WHEN a user clicks the payment button THEN the system SHALL create a Stripe Checkout session with purpose 'PEER_VERIFICATION'
4. WHEN creating the Stripe Checkout session THEN the system SHALL include submission_id in metadata
5. WHEN creating the Stripe Checkout session THEN the system SHALL set amount to $20 USD
6. WHEN payment is successful THEN the Stripe webhook SHALL update the payment record to status 'PAID'
7. WHEN peer verification payment is confirmed THEN the system SHALL update submission status to 'PEER_VERIFICATION_PENDING'
8. WHEN peer verification payment is confirmed THEN the system SHALL create a flag record with entity_type 'SUBMISSION' and reason 'PEER_VERIFICATION_REQUESTED'
9. WHEN peer verification payment is confirmed THEN the system SHALL redirect user to confirmation page
10. WHEN peer verification is activated THEN the system SHALL display "Your request has been registered. Your work is now entering peer verification. You can follow the status in your Dashboard under My Work → Verification Status."

### Requirement 9: Dashboard Integration for Screening Status

**User Story:** As a user with submissions, I want to see the AI screening status on my dashboard, so that I can track which letters passed, failed, or are pending verification.

#### Acceptance Criteria

1. WHEN a user views their dashboard THEN the system SHALL display screening status for each submission
2. WHEN a submission is in 'PROCESSING' status THEN the dashboard SHALL display "AI Screening in Progress" with a loading indicator
3. WHEN a submission has ai_screenings.status 'PASSED' THEN the dashboard SHALL display "Passed AI Screening - Eligible for Peer Review"
4. WHEN a submission has ai_screenings.status 'FAILED' THEN the dashboard SHALL display "Eliminated by AI" with a link to view results
5. WHEN a submission has ai_screenings.status 'REVIEW' THEN the dashboard SHALL display "Under Manual Review"
6. WHEN a submission has status 'PEER_VERIFICATION_PENDING' THEN the dashboard SHALL display "Peer Verification Requested" with status tracking
7. WHEN a user clicks on a submission row THEN the system SHALL navigate to the screening results page for that submission
8. WHEN a submission is eliminated THEN the dashboard SHALL provide a quick action button to "Submit New Letter"

### Requirement 10: Admin AI Settings Management

**User Story:** As an administrator, I want to configure AI prompts and model parameters through the admin settings interface, so that I can adjust screening criteria without code changes.

#### Acceptance Criteria

1. WHEN an admin accesses /admin/cms/settings THEN the system SHALL display an "AI Screening" category
2. WHEN the AI Screening category is displayed THEN the system SHALL show settings for: ai_moderation_prompt, ai_evaluation_prompt, ai_translation_prompt
3. WHEN the AI Screening category is displayed THEN the system SHALL show settings for: ai_model_name, ai_max_tokens, ai_temperature
4. WHEN an admin edits ai_evaluation_prompt THEN the system SHALL display a large textarea with the current prompt
5. WHEN an admin edits ai_translation_prompt THEN the system SHALL display a large textarea with the current prompt
6. WHEN an admin saves prompt changes THEN the system SHALL validate that {Letter} placeholder exists in the prompt
7. WHEN an admin edits ai_max_tokens THEN the system SHALL validate the value is between 1000 and 16000
8. WHEN an admin edits ai_temperature THEN the system SHALL validate the value is between 0.0 and 2.0
9. WHEN an admin saves AI settings THEN the system SHALL update the cms_settings table
10. WHEN AI settings are updated THEN the system SHALL use the new settings for all subsequent screenings
11. WHEN the AI Screening settings are displayed THEN the system SHALL show default values: model='gpt-5-mini', max_tokens=8000, temperature=0.2

### Requirement 11: Admin Screening Results Dashboard

**User Story:** As an administrator, I want to view all AI screening results and manually review borderline cases, so that I can ensure fair evaluation and handle edge cases.

#### Acceptance Criteria

1. WHEN an admin accesses /admin/submissions THEN the system SHALL display ai_screenings.status for each submission
2. WHEN the admin submissions list displays THEN the system SHALL support filtering by screening status: PASSED, FAILED, REVIEW, PEER_VERIFICATION_PENDING
3. WHEN an admin clicks on a submission THEN the system SHALL display full screening results including all scores and translations
4. WHEN an admin views a submission with status 'REVIEW' THEN the system SHALL display an option to manually override to PASSED or FAILED
5. WHEN an admin manually overrides screening status THEN the system SHALL record the action in audit_logs
6. WHEN an admin manually overrides to PASSED THEN the system SHALL update submission status to 'SUBMITTED'
7. WHEN an admin manually overrides to FAILED THEN the system SHALL update submission status to 'ELIMINATED'
8. WHEN an admin views screening results THEN the system SHALL display the model_name, model_version, and prompt_hash used
9. WHEN an admin views a submission with peer verification requested THEN the system SHALL see a flag indicating the request
10. WHEN an admin exports submissions THEN the system SHALL include screening status and key scores in the export

### Requirement 12: Database Schema for AI Screening

**User Story:** As a system, I want to store comprehensive AI screening data in a structured format, so that results can be analyzed and audited.

#### Acceptance Criteria

1. WHEN AI screening is executed THEN the system SHALL create a record in ai_screenings table
2. WHEN storing screening results THEN the system SHALL populate submission_id, status, model_name, model_version, prompt_hash
3. WHEN storing moderation results THEN the system SHALL store flagged categories in scores JSON under 'moderation' key
4. WHEN storing evaluation results THEN the system SHALL store all evaluation fields in scores JSON under 'evaluation' key
5. WHEN storing translation results THEN the system SHALL store all translations in scores JSON under 'translations' key
6. WHEN storing screening results THEN the system SHALL set created_at timestamp
7. WHEN a submission has multiple screening attempts THEN the system SHALL keep only the most recent ai_screenings record
8. WHEN storing prompt_hash THEN the system SHALL use SHA-256 hash of the concatenated prompts for audit purposes
9. WHEN ai_screenings.status is 'REVIEW' THEN the system SHALL store the specific reason in notes field
10. WHEN peer verification is requested THEN the system SHALL create a payment record with purpose 'PEER_VERIFICATION' linked to submission_id

### Requirement 13: Email Notifications for Screening Results

**User Story:** As a user whose letter has been screened, I want to receive an email with my results, so that I'm notified when screening completes.

#### Acceptance Criteria

1. WHEN AI screening completes THEN the system SHALL send an email to the user
2. WHEN the email is sent AND letter passed THEN the subject SHALL be "Your Letter Passed AI Screening"
3. WHEN the email is sent AND letter failed THEN the subject SHALL be "AI Screening Results for Your Letter"
4. WHEN the email is sent THEN the body SHALL include the submission code
5. WHEN the email is sent AND letter passed THEN the body SHALL include "Your letter has passed AI screening and is eligible for peer review"
6. WHEN the email is sent AND letter failed THEN the body SHALL include "Your letter did not pass AI screening" with a link to view detailed results
7. WHEN the email is sent THEN the body SHALL include a link to the screening results page
8. WHEN the email is sent AND letter failed THEN the body SHALL mention the option to request peer verification
9. WHEN the email is sent THEN the system SHALL use the transactional email service configured in environment variables

### Requirement 14: Error Handling and Retry Logic

**User Story:** As a system, I want to handle AI API failures gracefully with retry logic, so that temporary issues don't permanently fail submissions.

#### Acceptance Criteria

1. WHEN an OpenAI API call fails with a 5xx error THEN the system SHALL retry up to 3 times with exponential backoff
2. WHEN an OpenAI API call fails with a 429 rate limit error THEN the system SHALL wait and retry according to rate limit headers
3. WHEN an OpenAI API call fails with a 4xx error (except 429) THEN the system SHALL not retry and mark screening as 'REVIEW'
4. WHEN JSON parsing of AI response fails THEN the system SHALL log the raw response and mark screening as 'REVIEW'
5. WHEN all retry attempts are exhausted THEN the system SHALL mark screening as 'REVIEW' and notify admins
6. WHEN a technical error occurs THEN the system SHALL store the error message in ai_screenings.notes
7. WHEN a submission is marked 'REVIEW' due to error THEN the admin dashboard SHALL highlight it for manual attention
8. WHEN the system encounters an error THEN the user SHALL see "Your submission is under review. We'll notify you when results are available."

### Requirement 15: Security and Rate Limiting

**User Story:** As a system administrator, I want AI screening to be secure and rate-limited, so that the system is protected from abuse and excessive costs.

#### Acceptance Criteria

1. WHEN AI screening is triggered THEN the system SHALL verify the submission belongs to an authenticated user
2. WHEN AI screening is triggered THEN the system SHALL verify payment was confirmed before proceeding
3. WHEN storing AI prompts in settings THEN the system SHALL restrict access to admin users only
4. WHEN making OpenAI API calls THEN the system SHALL use API keys from environment variables, never from database
5. WHEN making OpenAI API calls THEN the system SHALL implement rate limiting to prevent excessive usage
6. WHEN a user requests peer verification THEN the system SHALL verify they haven't already requested it for that submission
7. WHEN logging AI responses THEN the system SHALL not log sensitive user information
8. WHEN displaying screening results THEN the system SHALL only show results to the submission owner or admins
9. WHEN an admin views screening results THEN the system SHALL log the access in audit_logs

### Requirement 16: Contest Phase Integration

**User Story:** As a system, I want AI screening to respect contest phases, so that only submissions during the open phase are screened.

#### Acceptance Criteria

1. WHEN a submission is paid THEN the system SHALL verify the contest phase is 'SUBMISSIONS_OPEN' before triggering screening
2. WHEN the contest phase changes to 'SUBMISSIONS_CLOSED' THEN the system SHALL complete any in-progress screenings
3. WHEN the contest phase is 'PEER_REVIEW' THEN the system SHALL only allow peer verification reviews, not new submissions
4. WHEN determining peer review eligibility THEN the system SHALL only include submissions with ai_screenings.status 'PASSED'
5. WHEN the contest phase is 'PEER_REVIEW' THEN the system SHALL exclude submissions with status 'ELIMINATED' or 'PEER_VERIFICATION_PENDING'
6. WHEN peer verification completes THEN the system SHALL update submission status based on peer review results (handled in separate spec)

### Requirement 17: Default AI Prompts

**User Story:** As a system, I want to have default AI prompts configured on first setup, so that the screening pipeline works immediately after deployment.

#### Acceptance Criteria

1. WHEN the system is first deployed THEN the system SHALL seed cms_settings with default AI prompts
2. WHEN seeding ai_moderation_prompt THEN the system SHALL use a prompt that instructs OpenAI Moderation API usage
3. WHEN seeding ai_evaluation_prompt THEN the system SHALL use the provided Kant-based evaluation prompt adapted for letters
4. WHEN seeding ai_translation_prompt THEN the system SHALL use the provided translation prompt adapted for letters
5. WHEN seeding AI settings THEN the system SHALL set ai_model_name to 'gpt-5-mini'
6. WHEN seeding AI settings THEN the system SHALL set ai_max_tokens to 8000
7. WHEN seeding AI settings THEN the system SHALL set ai_temperature to 0.2
8. WHEN default prompts are seeded THEN the system SHALL replace all instances of "essay" with "letter" in the prompts
9. WHEN default prompts are seeded THEN the system SHALL ensure {Letter} placeholder is present in evaluation and translation prompts

