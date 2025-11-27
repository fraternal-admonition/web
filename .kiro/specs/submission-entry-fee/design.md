# Design Document

## Overview

The Submission & Entry Fee feature enables authenticated users to submit their letters to the Letters to Goliath contest through a streamlined, two-step process: draft creation and payment. The design prioritizes a clean, uncluttered user experience with clear deadline visibility and the ability to return to incomplete submissions.

The feature consists of three main user-facing components:
1. **Contest Page** - A landing page displaying contest details with a prominent call-to-action
2. **Submission Form** - A clean form with modal-based illustration selection
3. **Payment Flow** - Stripe Checkout integration with webhook processing

The system ensures submission codes are guaranteed unique using a memorable format (e.g., "LTG-ABC123") and maintains anonymity by never displaying user names alongside submissions. The design follows existing patterns from the CMS and Posts modules while introducing new patterns for payment processing and submission management.

## Architecture

### High-Level Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Navigation                          │
│  - "Contest" link (visible only when logged in)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Contest Page                             │
│  /contest                                                    │
│  - Contest card with details                                 │
│  - Deadline display                                          │
│  - "Submit Your Letter" CTA                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Submission Form Page                        │
│  /contest/submit                                             │
│  - Title input                                               │
│  - Letter body textarea                                      │
│  - "Choose Illustration" button → Modal                      │
│  - 100-char note input                                       │
│  - "Continue to Payment" button                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Payment Page                             │
│  /contest/payment/[submissionId]                             │
│  - Submission details                                        │
│  - Submission code display                                   │
│  - "Pay $7 Entry Fee" button → Stripe Checkout              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Stripe Checkout                             │
│  (Hosted by Stripe)                                          │
│  - Payment form                                              │
│  - Success → Webhook → Update DB → Confirmation             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Confirmation Page                           │
│  /contest/confirmation/[submissionId]                        │
│  - Success message                                           │
│  - Submission code display                                   │
│  - Email sent notification                                   │
└─────────────────────────────────────────────────────────────┘
```

### Database Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   contests   │◄────────│  submissions │────────►│ illustrations│
│              │         │              │         │              │
│ - id         │         │ - id         │         │ - id         │
│ - title      │         │ - contest_id │         │ - contest_id │
│ - phase      │         │ - user_id    │         │ - title      │
│ - *_at dates │         │ - submission │         │ - asset_id   │
└──────────────┘         │   _code      │         │ - is_active  │
                         │ - title      │         └──────────────┘
                         │ - body       │
                         │ - illustration│
                         │   _id        │
                         │ - note       │
                         │ - status     │
                         │ - submitted_at│
                         └──────────────┘
                                │
                                │
                                ▼
                         ┌──────────────┐
                         │   payments   │
                         │              │
                         │ - id         │
                         │ - user_id    │
                         │ - submission │
                         │   _id        │
                         │ - amount     │
                         │ - purpose    │
                         │ - status     │
                         │ - stripe_*   │
                         └──────────────┘
```

## Components and Interfaces

### 1. Database Schema Extensions

Based on the existing database structure, we need to ensure the `submissions` and `payments` tables have the following structure:

**submissions table:**
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  illustration_id UUID REFERENCES illustrations(id) ON DELETE SET NULL,
  note TEXT, -- 100 character note
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT', -- PENDING_PAYMENT, SUBMITTED, DISQUALIFIED
  submitted_at TIMESTAMPTZ,
  score_peer NUMERIC,
  score_public NUMERIC,
  score_final NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT submissions_status_check CHECK (status IN ('PENDING_PAYMENT', 'SUBMITTED', 'DISQUALIFIED', 'FINALIST', 'WINNER')),
  CONSTRAINT submissions_note_length CHECK (LENGTH(note) <= 100)
);

CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_contest_id ON submissions(contest_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_code ON submissions(submission_code);
```

**payments table:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  vote_bundle_id UUID REFERENCES vote_bundles(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  purpose TEXT NOT NULL, -- ENTRY_FEE, VOTE_BUNDLE, CERTIFICATION_FEE, DONATION
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, FAILED, REFUNDED
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_customer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT payments_purpose_check CHECK (purpose IN ('ENTRY_FEE', 'VOTE_BUNDLE', 'CERTIFICATION_FEE', 'DONATION')),
  CONSTRAINT payments_status_check CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'))
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_submission_id ON payments(submission_id);
CREATE INDEX idx_payments_stripe_session_id ON payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### 2. TypeScript Types

```typescript
// src/types/submissions.ts

export type SubmissionStatus = 
  | 'PENDING_PAYMENT'
  | 'SUBMITTED'
  | 'DISQUALIFIED'
  | 'FINALIST'
  | 'WINNER';

export type PaymentPurpose = 
  | 'ENTRY_FEE'
  | 'VOTE_BUNDLE'
  | 'CERTIFICATION_FEE'
  | 'DONATION';

export type PaymentStatus = 
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface Submission {
  id: string;
  contest_id: string;
  user_id: string;
  submission_code: string;
  title: string;
  body: string;
  illustration_id: string | null;
  note: string | null;
  status: SubmissionStatus;
  submitted_at: string | null;
  score_peer: number | null;
  score_public: number | null;
  score_final: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionWithDetails extends Submission {
  illustration?: {
    id: string;
    title: string | null;
    asset?: {
      path: string;
      alt: string | null;
    };
  };
  contest?: {
    id: string;
    title: string;
    submissions_close_at: string | null;
  };
}

export interface Payment {
  id: string;
  user_id: string;
  submission_id: string | null;
  vote_bundle_id: string | null;
  amount: number;
  currency: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_customer_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFormData {
  title: string;
  body: string;
  illustration_id: string;
  note: string;
}

export interface CreateSubmissionResponse {
  submission_id: string;
  submission_code: string;
}

export interface CreateCheckoutSessionResponse {
  checkout_url: string;
  session_id: string;
}
```

### 3. Validation Schemas

```typescript
// src/lib/security/validators.ts (additions)

export const SubmissionSchema = z.object({
  contest_id: z.string().uuid('Invalid contest ID'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  body: z.string()
    .min(100, 'Letter must be at least 100 characters')
    .max(10000, 'Letter must be 10,000 characters or less'),
  illustration_id: z.string().uuid('Invalid illustration ID'),
  note: z.string()
    .max(100, 'Note must be 100 characters or less')
    .optional()
    .nullable(),
});

export const PaymentIntentSchema = z.object({
  submission_id: z.string().uuid('Invalid submission ID'),
});
```

### 4. Submission Code Generation Utility

```typescript
// src/lib/submissions/submission-code.ts

import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

/**
 * Generates a unique submission code in the format: LTG-ABC123
 * - LTG: Contest prefix (Letters to Goliath)
 * - ABC123: 6-character alphanumeric code
 */
export async function generateUniqueSubmissionCode(
  contestId: string,
  maxRetries: number = 10
): Promise<string> {
  const supabase = await createAdminClient();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate 6-character alphanumeric code
    const code = generateAlphanumericCode(6);
    const submissionCode = `LTG-${code}`;
    
    // Check if code already exists
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('submission_code', submissionCode)
      .single();
    
    if (!existing) {
      return submissionCode;
    }
  }
  
  throw new Error('Failed to generate unique submission code after maximum retries');
}

/**
 * Generates a random alphanumeric code of specified length
 * Uses only uppercase letters and numbers (no ambiguous characters like O/0, I/1)
 */
function generateAlphanumericCode(length: number): string {
  // Exclude ambiguous characters: O, 0, I, 1, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Validates a submission code format
 */
export function isValidSubmissionCode(code: string): boolean {
  const pattern = /^LTG-[A-Z2-9]{6}$/;
  return pattern.test(code);
}
```

### 5. Contest Phase Utilities

```typescript
// src/lib/contests/phase-utils.ts

import { Contest, ContestPhase } from '@/types/contests';

export interface PhaseStatus {
  isSubmissionsOpen: boolean;
  canSubmit: boolean;
  canPayForPending: boolean;
  message: string;
  deadline: string | null;
}

/**
 * Determines if submissions are currently open based on contest phase and timestamps
 */
export function getSubmissionPhaseStatus(contest: Contest): PhaseStatus {
  const now = new Date();
  const submissionsOpenAt = contest.submissions_open_at ? new Date(contest.submissions_open_at) : null;
  const submissionsCloseAt = contest.submissions_close_at ? new Date(contest.submissions_close_at) : null;
  
  // Check phase
  const isPhaseOpen = contest.phase === 'SUBMISSIONS_OPEN';
  
  // Check timestamps
  const isAfterOpen = !submissionsOpenAt || now >= submissionsOpenAt;
  const isBeforeClose = !submissionsCloseAt || now < submissionsCloseAt;
  
  const isSubmissionsOpen = isPhaseOpen && isAfterOpen && isBeforeClose;
  
  // Determine messages
  let message = '';
  if (!isPhaseOpen) {
    message = 'Submissions are currently closed';
  } else if (!isAfterOpen) {
    message = `Submissions open on ${submissionsOpenAt?.toLocaleDateString()}`;
  } else if (!isBeforeClose) {
    message = 'Submission deadline has passed';
  } else {
    message = 'Submissions are open';
  }
  
  return {
    isSubmissionsOpen,
    canSubmit: isSubmissionsOpen,
    canPayForPending: isBeforeClose, // Allow payment for pending submissions until deadline
    message,
    deadline: submissionsCloseAt?.toISOString() || null,
  };
}

/**
 * Formats a deadline for display
 */
export function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'No deadline set';
  
  const date = new Date(deadline);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Deadline passed';
  } else if (diffDays === 0) {
    return 'Deadline today';
  } else if (diffDays === 1) {
    return 'Deadline tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays} days remaining`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
```

### 6. Page Structure

**Public Pages:**
- `/contest` - Contest landing page with card
- `/contest/submit` - Submission form (auth required)
- `/contest/payment/[submissionId]` - Payment page (auth required)
- `/contest/confirmation/[submissionId]` - Confirmation page (auth required)

**Admin Pages:**
- `/admin/submissions` - List all submissions
- `/admin/submissions/[id]` - View submission details

**API Routes:**
- `POST /api/submissions` - Create draft submission
- `GET /api/submissions/[id]` - Get submission details
- `GET /api/submissions/user` - Get user's submissions
- `POST /api/payments/create-checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks
- `GET /api/admin/submissions` - List all submissions (admin)
- `GET /api/admin/submissions/[id]` - Get submission details (admin)
- `PATCH /api/admin/submissions/[id]` - Update submission (admin)

### 7. UI Components

**ContestCard**
- Displays contest title, description, phase, and deadline
- Shows "Submit Your Letter" CTA when submissions are open
- Shows appropriate messaging when submissions are closed
- Styled with gradient background and clean typography

**SubmissionForm**
- Title input with character counter
- Body textarea with word counter
- "Choose Illustration" button that opens modal
- Selected illustration preview
- 100-character note input with counter
- Deadline display at top
- Form validation with inline errors
- "Continue to Payment" button

**IllustrationModal**
- Full-screen modal with close button
- Responsive grid of illustration thumbnails
- Hover effects showing title and description
- Click to select and close
- ESC key and outside click to close
- Loading state while fetching illustrations

**PaymentPage**
- Submission code display (large, prominent)
- Submission details summary
- Entry fee amount ($7 USD)
- "Pay Entry Fee" button
- Stripe branding
- Return to dashboard link

**ConfirmationPage**
- Success icon/animation
- Submission code display (large, copyable)
- Success message
- Email sent notification
- "Return to Dashboard" button

**DashboardSubmissionAlert**
- Prominent alert for PENDING_PAYMENT submissions
- Submission code, title, and deadline
- "Complete Payment" button
- Dismissible (but reappears on page load)

**AdminSubmissionTable**
- Sortable columns: code, status, title, created_at
- Filter by status
- Search by code or title
- Click row to view details
- Export to CSV button

## Data Models

### Submission Lifecycle

```
[User fills form] 
    → PENDING_PAYMENT (draft created, code generated)
    → [User pays via Stripe]
    → SUBMITTED (webhook updates status)
    → [AI Filtering]
    → [Peer Review]
    → FINALIST (if selected)
    → WINNER (if awarded)
    
Alternative paths:
    → DISQUALIFIED (if rules violated)
```

### Payment Flow

```
[User clicks "Continue to Payment"]
    → Create submission (PENDING_PAYMENT)
    → Redirect to payment page
    → [User clicks "Pay Entry Fee"]
    → Create Stripe Checkout session
    → Redirect to Stripe
    → [User completes payment]
    → Stripe webhook → Update payment (PAID)
    → Update submission (SUBMITTED)
    → Send confirmation email
    → Redirect to confirmation page
```

### Submission Code Format

- **Format**: `LTG-ABC123`
- **Length**: 10 characters (3 + 1 + 6)
- **Characters**: Uppercase letters and numbers (excluding ambiguous: O, 0, I, 1, L)
- **Uniqueness**: Verified against database before creation
- **Retry Logic**: Up to 10 attempts to generate unique code

## Error Handling

### Form Validation Errors
- **Client-side**: Real-time validation with inline error messages
- **Server-side**: Zod schema validation with detailed error responses
- **Display**: Toast notifications for API errors, inline for form fields

### Submission Creation Errors
- **Duplicate code**: Retry generation automatically
- **Contest closed**: Redirect to contest page with error message
- **Database error**: Log error, display generic message, allow retry
- **Max entries reached**: Display specific error message

### Payment Errors
- **Stripe API error**: Log error, display user-friendly message
- **Session creation failed**: Allow retry with exponential backoff
- **Payment declined**: Stripe handles, user can retry
- **Webhook failure**: Stripe retries automatically, log for monitoring

### Webhook Processing Errors
- **Invalid signature**: Return 400, log security event
- **Duplicate webhook**: Handle idempotently, return 200
- **Database error**: Return 500 for Stripe to retry
- **Missing metadata**: Log error, attempt recovery, return 500 if critical

## Testing Strategy

### Unit Tests
- Submission code generation (uniqueness, format, retries)
- Phase status calculation (various date combinations)
- Validation schemas (valid/invalid inputs)
- Deadline formatting (various time ranges)

### Integration Tests
- Submission creation API (auth, validation, database)
- Payment checkout creation (Stripe API, metadata)
- Webhook processing (signature verification, idempotency)
- User submission retrieval (filtering, authorization)

### E2E Tests (Manual for MVP)
- Complete submission flow (form → payment → confirmation)
- Return to pending submission and complete payment
- Contest phase enforcement (closed submissions)
- Illustration modal interaction
- Dashboard alerts for pending payments
- Admin submission management

### Test Data
- Seed script for test contest with submissions
- Sample illustrations (placeholder images)
- Test Stripe webhook events
- Various submission statuses for testing

## Security Considerations

### Authentication & Authorization
- All submission pages protected by authentication check
- Submission ownership verified before allowing payment
- Admin routes protected by role check
- Webhook signature verification for Stripe events

### Input Validation
- Zod schemas for all form inputs
- HTML sanitization for text fields (prevent XSS)
- Word/character count enforcement
- Illustration ID validation (must exist and be active)

### Payment Security
- Stripe Checkout (PCI compliant, hosted by Stripe)
- Webhook signature verification
- Idempotency keys for payment creation
- No credit card data stored in database

### Data Protection
- Submission codes used for anonymity
- User names never displayed with submissions
- Payment details logged securely
- Audit logs for admin actions

### Rate Limiting
- Submission creation: 5 per hour per user
- Payment checkout creation: 10 per hour per user
- Webhook endpoint: 1000 per hour per IP
- API endpoints: Existing middleware applies

## Performance Considerations

### Database Queries
- Index on submission_code for fast lookups
- Index on user_id for dashboard queries
- Index on status for filtering
- Eager loading of related data (illustration, contest)

### Caching
- Contest details cached (5 minutes TTL)
- Active illustrations cached per contest (10 minutes TTL)
- User submissions cached (1 minute TTL)
- Phase status calculated on-demand (lightweight)

### Image Optimization
- Illustration thumbnails optimized (Next.js Image)
- Lazy loading for illustration grid
- Responsive images with multiple sizes
- CDN delivery for assets

### Pagination
- User submissions: Show all (typically < 10)
- Admin submissions: Paginate at 50 items
- Illustration modal: Show all active (50 max)

## Deployment Considerations

### Environment Variables
```
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_FROM=no-reply@fraternaladmonition.com
EMAIL_REPLY_TO=support@fraternaladmonition.com

# App
NEXT_PUBLIC_APP_URL=https://fraternaladmonition.com
```

### Database Migrations
- Create submissions table with indexes
- Create payments table with indexes
- Add unique constraint on submission_code
- Add check constraints for status and purpose enums

### Stripe Configuration
- Create webhook endpoint in Stripe dashboard
- Configure events: `checkout.session.completed`
- Set webhook URL: `https://fraternaladmonition.com/api/webhooks/stripe`
- Copy webhook secret to environment variables

### Email Templates
- Submission confirmation email
- Payment receipt email
- Pending payment reminder email (future)

### Monitoring
- Sentry alerts for webhook failures
- Log all payment events
- Monitor submission code generation failures
- Track Stripe API errors

## Future Enhancements

### Phase 3.5 (Optional)
- Draft auto-save (local storage)
- Submission editing (before payment)
- Multiple payment methods (PayPal, etc.)
- Bulk submission export for admins
- Submission analytics dashboard

### Email Notifications
- Reminder emails for pending payments (24 hours before deadline)
- Deadline approaching notifications
- Submission status updates
- Payment receipt improvements

### User Experience
- Progress indicator for multi-step flow
- Submission preview before payment
- Print-friendly submission view
- Social sharing of submission code (after confirmation)

