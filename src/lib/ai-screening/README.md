# AI Screening Library

## Overview
This library provides the AI screening pipeline for contest submissions, including moderation, evaluation, and translation services.

## Quick Start

### Triggering AI Screening
```typescript
import { executeAIScreening } from '@/lib/ai-screening/screening-service';

// Trigger screening (usually called from webhook after payment)
await executeAIScreening(submissionId);
```

### Security Utilities
```typescript
import {
  verifyAuthentication,
  verifyAdminRole,
  verifySubmissionOwnership,
  verifyPaymentConfirmed,
  checkPeerVerificationRateLimit,
  sanitizeForLogging,
} from '@/lib/ai-screening/security';

// Check if user is authenticated
const user = await verifyAuthentication();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check if user is admin
const isAdmin = await verifyAdminRole(user.id);
if (!isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Check if user owns submission
const ownsSubmission = await verifySubmissionOwnership(user.id, submissionId);
if (!ownsSubmission) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Check rate limit
const withinLimit = await checkPeerVerificationRateLimit(user.id);
if (!withinLimit) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}

// Sanitize data before logging
const sanitized = sanitizeForLogging(errorData);
console.error('Error:', sanitized);
```

## Module Structure

```
src/lib/ai-screening/
├── screening-service.ts      # Main orchestrator
├── moderation-service.ts     # Content safety check
├── evaluation-service.ts     # Quality assessment
├── translation-service.ts    # Multi-language translation
├── retry-utils.ts           # Retry logic with backoff
├── security.ts              # Security utilities
├── SECURITY.md              # Security documentation
└── README.md                # This file
```

## Services

### Screening Service
Main orchestrator that runs all three phases:
1. Moderation (content safety)
2. Evaluation (quality assessment)
3. Translation (multi-language)

**Key Functions**:
- `executeAIScreening(submissionId)` - Run full pipeline
- `loadScreeningConfig()` - Load AI settings from database
- `determineEvaluationStatus(evaluation)` - Apply pass/fail criteria

### Moderation Service
Uses OpenAI Moderation API to check for harmful content.

**Key Functions**:
- `moderateContent(text)` - Check text for policy violations

**Returns**: `ModerationResult` with flagged status and categories

### Evaluation Service
Uses GPT-4o-mini to evaluate letter quality and thematic alignment.

**Key Functions**:
- `evaluateLetter(text, prompt, config)` - Evaluate letter
- `validateEvaluationResponse(evaluation)` - Validate response structure

**Returns**: `EvaluationResult` with scores and analysis

### Translation Service
Uses GPT-4o-mini to translate letters to 5 languages.

**Key Functions**:
- `translateLetter(text, prompt, config)` - Translate letter
- `validateTranslationResponse(translation)` - Validate response structure

**Returns**: `TranslationResult` with translations in EN, DE, FR, IT, ES

### Retry Utilities
Provides retry logic with exponential backoff for API calls.

**Key Functions**:
- `withRetry(fn, maxRetries, baseDelay)` - Retry function with backoff

**Features**:
- Exponential backoff with jitter
- Respects rate limits (429)
- Doesn't retry 4xx errors (except 429)

### Security Utilities
Provides authentication, authorization, and data protection.

**Key Functions**:
- `verifyAuthentication()` - Check user authentication
- `verifyAdminRole(userId)` - Check admin role
- `verifySubmissionOwnership(userId, submissionId)` - Check ownership
- `verifyPaymentConfirmed(submissionId)` - Check payment
- `verifyPeerVerificationNotRequested(submissionId)` - Check duplicates
- `verifyContestPhaseOpen(contestId)` - Check contest phase
- `checkPeerVerificationRateLimit(userId)` - Check rate limit
- `logAdminScreeningAccess(userId, submissionId, screeningId)` - Log access
- `sanitizeForLogging(data)` - Remove PII from logs

## Configuration

AI screening is configured via `cms_settings` table:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ai_model_name` | string | `gpt-4o-mini` | OpenAI model to use |
| `ai_max_tokens` | number | `8000` | Max tokens per request |
| `ai_temperature` | number | `0.2` | Temperature (0-2) |
| `ai_evaluation_prompt` | string | - | Evaluation prompt template |
| `ai_translation_prompt` | string | - | Translation prompt template |

## Environment Variables

Required environment variables:

```env
OPENAI_API_KEY=sk-...           # OpenAI API key
NEXT_PUBLIC_SITE_URL=...        # Site URL for redirects
```

## Error Handling

All services use try-catch with proper error handling:

```typescript
try {
  await executeAIScreening(submissionId);
} catch (error) {
  // Error is sanitized and logged
  // Submission marked as REVIEW for manual handling
  console.error('Screening failed:', sanitizeForLogging(error));
}
```

## Security Best Practices

### 1. Always Verify Authentication
```typescript
const user = await verifyAuthentication();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Verify Ownership for User Routes
```typescript
const ownsSubmission = await verifySubmissionOwnership(user.id, submissionId);
if (!ownsSubmission) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 3. Verify Admin Role for Admin Routes
```typescript
const isAdmin = await verifyAdminRole(user.id);
if (!isAdmin) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 4. Sanitize Data Before Logging
```typescript
const sanitized = sanitizeForLogging(errorData);
console.error('Error:', sanitized);
```

### 5. Log Admin Actions
```typescript
await logAdminScreeningAccess(user.id, submissionId, screeningId);
```

## Rate Limits

### Peer Verification
- **Limit**: 100 requests per user per 24 hours
- **Check**: `checkPeerVerificationRateLimit(userId)`
- **Response**: 429 Too Many Requests

## Audit Logging

All admin actions are logged to `audit_logs` table:

```typescript
await adminSupabase.from('audit_logs').insert({
  user_id: user.id,
  action: 'UPDATE',
  resource_type: 'ai_screening',
  resource_id: screeningId,
  changes: { old_status, new_status },
  ip_address: request.headers.get('x-forwarded-for'),
  user_agent: request.headers.get('user-agent'),
});
```

## Testing

### Unit Tests
```bash
npm test src/lib/ai-screening
```

### Integration Tests
```bash
npm test -- --grep "AI Screening"
```

### Manual Testing
1. Submit a letter and pay entry fee
2. Check screening results page
3. Try requesting peer verification
4. Check audit logs as admin

## Troubleshooting

### Screening Stuck in PROCESSING
- Check OpenAI API status
- Check server logs for errors
- Verify payment was confirmed
- Check contest phase is SUBMISSIONS_OPEN

### Rate Limit Errors
- Check user's recent peer verification requests
- Verify rate limit window (24 hours)
- Consider adjusting limit in security.ts

### Authentication Errors
- Verify user is logged in
- Check Supabase auth status
- Verify session is valid

### Authorization Errors
- Verify user owns submission (user routes)
- Verify user has ADMIN role (admin routes)
- Check RLS policies in Supabase

## Support

For issues or questions:
1. Check SECURITY.md for security-related questions
2. Check server logs for error details
3. Review audit_logs for admin action history
4. Contact development team

## License

Internal use only - Part of Letters to Goliath contest platform
