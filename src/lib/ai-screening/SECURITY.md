# AI Screening Security Implementation

## Overview

This document describes the security measures implemented for the AI Screening Pipeline to protect against abuse, unauthorized access, and ensure data privacy.

## Security Measures Implemented

### 1. Authentication & Authorization

#### User Authentication
- **Location**: All API routes and pages
- **Implementation**: Supabase authentication check via `supabase.auth.getUser()`
- **Enforcement**: Returns 401 Unauthorized if user not authenticated

#### Admin Role Verification
- **Location**: Admin-only endpoints
- **Implementation**: `verifyAdminRole()` utility function
- **Enforcement**: Returns 403 Forbidden if user is not ADMIN
- **Affected Routes**:
  - `/api/admin/submissions/[id]` (GET, PATCH)
  - `/api/admin/submissions/[id]/override-screening` (POST)

#### Submission Ownership Verification
- **Location**: User-facing screening results and peer verification
- **Implementation**: `verifySubmissionOwnership()` utility function
- **Enforcement**: Returns 403 Forbidden if user doesn't own submission
- **Affected Routes**:
  - `/contest/screening-results/[submissionId]`
  - `/api/payments/peer-verification` (POST)

### 2. Payment Verification

#### Payment Confirmation Check
- **Location**: AI screening service
- **Implementation**: `verifyPaymentConfirmed()` utility function
- **Purpose**: Ensures screening only runs after payment is confirmed
- **Enforcement**: Throws error if payment not confirmed, marks submission for review

#### Idempotency Protection
- **Location**: Stripe webhook handler
- **Implementation**: Check if payment already processed before updating
- **Purpose**: Prevents duplicate processing of same payment event

### 3. Rate Limiting

#### Peer Verification Rate Limit
- **Location**: Peer verification payment API
- **Implementation**: `checkPeerVerificationRateLimit()` utility function
- **Limit**: Maximum 100 requests per user per 24 hours
- **Enforcement**: Returns 429 Too Many Requests if limit exceeded
- **Purpose**: Prevents abuse of peer verification system

### 4. Contest Phase Validation

#### Phase Check
- **Location**: AI screening service
- **Implementation**: `verifyContestPhaseOpen()` utility function
- **Purpose**: Ensures submissions only screened during SUBMISSIONS_OPEN phase
- **Enforcement**: Throws error if contest phase not open

### 5. Duplicate Request Prevention

#### Peer Verification Duplicate Check
- **Location**: Peer verification payment API
- **Implementation**: `verifyPeerVerificationNotRequested()` utility function
- **Checks**:
  - Existing flag records with reason 'PEER_VERIFICATION_REQUESTED'
  - Existing payment records with purpose 'PEER_VERIFICATION' and status CREATED or PAID
- **Enforcement**: Returns 400 Bad Request if already requested

### 6. Data Privacy & Logging

#### Sensitive Data Sanitization
- **Location**: All error logging
- **Implementation**: `sanitizeForLogging()` utility function
- **Removes**: email, password, api_key, token, secret, credit_card, ssn, phone
- **Purpose**: Prevents PII leakage in logs

#### API Key Protection
- **Location**: AI service calls (moderation, evaluation, translation)
- **Implementation**: API keys stored in environment variables only
- **Enforcement**: Never stored in database, never exposed to client

### 7. Audit Logging

#### Admin Actions Logged
All admin actions are logged to `audit_logs` table with:
- `user_id`: Admin who performed action
- `action`: Type of action (VIEW, UPDATE)
- `resource_type`: Type of resource (ai_screening, submission)
- `resource_id`: ID of resource affected
- `changes`: JSON object with before/after values
- `ip_address`: IP address of admin
- `user_agent`: Browser user agent
- `created_at`: Timestamp

#### Logged Actions
1. **Viewing Screening Results**
   - Action: VIEW
   - Resource: ai_screening
   - Triggered: When admin views submission with screening results

2. **Manual Override**
   - Action: UPDATE
   - Resource: ai_screening
   - Includes: old_status, new_status, submission_id, submission_status

3. **Status Update**
   - Action: UPDATE
   - Resource: submission
   - Includes: old_status, new_status

### 8. Access Control Matrix

| Resource | User | Admin | Notes |
|----------|------|-------|-------|
| View own screening results | ✅ | ✅ | Must own submission |
| View all screening results | ❌ | ✅ | Admin only |
| Request peer verification | ✅ | ✅ | Must own submission, rate limited |
| Override screening status | ❌ | ✅ | Admin only, logged |
| Update submission status | ❌ | ✅ | Admin only, logged |
| Trigger AI screening | System | System | Automatic after payment |

## Security Best Practices

### Environment Variables
```env
# Required - Never commit to version control
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Database Security
- Row Level Security (RLS) enabled on all tables
- Admin client bypasses RLS only when necessary
- Service role key never exposed to client

### API Security
- All routes verify authentication
- Admin routes verify role
- User routes verify ownership
- Rate limiting on abuse-prone endpoints

### Error Handling
- Sensitive data sanitized before logging
- Generic error messages to users
- Detailed errors in server logs only
- No stack traces exposed to client

## Monitoring & Alerts

### Recommended Monitoring
1. **Failed Authentication Attempts**
   - Alert on multiple 401/403 responses from same IP
   
2. **Rate Limit Violations**
   - Alert on multiple 429 responses from same user
   
3. **Admin Actions**
   - Monitor audit_logs for unusual patterns
   - Alert on bulk overrides or status changes
   
4. **Screening Failures**
   - Alert on high rate of REVIEW status
   - Monitor for API errors

### Log Analysis
- Review audit_logs regularly for suspicious activity
- Check for unauthorized access attempts
- Monitor for unusual patterns in peer verification requests

## Incident Response

### If Unauthorized Access Detected
1. Immediately revoke compromised credentials
2. Review audit_logs for extent of access
3. Notify affected users if data exposed
4. Update security measures to prevent recurrence

### If API Key Compromised
1. Rotate OpenAI API key immediately
2. Review usage logs for unauthorized calls
3. Update environment variables on all servers
4. Monitor for unusual API usage patterns

### If Rate Limit Abuse Detected
1. Identify abusive user accounts
2. Temporarily ban if necessary
3. Review and adjust rate limits if needed
4. Consider implementing IP-based rate limiting

## Compliance

### GDPR Considerations
- User data minimization in logs
- Right to deletion supported
- Audit trail for data access
- Consent for data processing

### Data Retention
- Screening results: Retained indefinitely for contest integrity
- Audit logs: Retained for 2 years minimum
- Payment records: Retained per legal requirements
- User data: Deleted on request (except legal holds)

## Future Enhancements

### Planned Security Improvements
1. IP-based rate limiting
2. Anomaly detection for admin actions
3. Two-factor authentication for admins
4. Automated security scanning
5. Regular security audits
6. Penetration testing

### Under Consideration
1. Encryption at rest for sensitive data
2. Additional audit logging for data access
3. Real-time security monitoring dashboard
4. Automated threat detection
