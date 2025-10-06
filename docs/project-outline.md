<!-- filename: project-outline.md -->
# Fraternal Admonition — *Letters to Goliath*  
**Project Outline**  
_Last updated: 2025-10-04_

> This document captures the full plan to implement the Letters to Goliath (LtG) contest under the Fraternal Admonition (FA) umbrella — including system architecture, modules, domain setup, database usage, flows, and milestones. It reflects the latest rules (AI filtering, anonymity via submission codes, illustrations, peer review, public voting, finalist identity collection, awards, ambassadors) and the current SQL schema.

---

## 1) Vision & Scope

**Goal.** Build a production-ready platform for a one-time writing contest (LtG) with:
- Anonymous submissions (plain text) linked to one of 50 **illustrations** and a 100-character note.
- **$7 entry fee**; disqualification if peer-review obligations are unmet.
- **AI Filtering Round** → **Peer Review** → **Public Voting** (top-rated entries).
- **Finalist identity collection** (full name, country, city) only after public voting concludes.
- **Awards / payouts** for writing winners and best evaluators; prize fund fed by entry fees, donations, and voting participation.
- **Ambassador module** for certified inviters (personalized invites, conversion tracking, payouts).
- Built-in **CMS** for pages (Home, About, Rules, FAQ, Contact), teaser visuals, settings; plus **Updates/Blog**.

**Non-goals (now).**
- Multi-language (initially EN only).
- Multi-tenant contests (LtG v1; future WWGS can reuse the core).

---

## 2) Top-level Architecture

- **Frontend**: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Framer Motion.
- **API / Server**: Next.js Route Handlers + minimal server actions for trivial mutations.
- **Auth**: Supabase `auth.users` + `public.users` profile table (RBAC via app code).
- **DB**: Postgres (Supabase) using the provided DDL (no RLS, no triggers; enforcement in code).
- **Payments**: Stripe (primary). Purposes: `ENTRY_FEE`, `VOTE_BUNDLE`, `CERTIFICATION_FEE`, `DONATION`.
- **Storage/CDN**: Supabase Storage or UploadThing for images (illustrations, teasers).
- **Email**: Transactional sender (Resend/SES) on a **subdomain**; human mail via Google Workspace.
- **Anti-abuse**: hCaptcha, IP/device/email hashing, rate limits (Upstash Redis), anomaly flags.
- **Observability**: Sentry (errors), Better Stack/Logtail (logs), Vercel Analytics.
- **Deployment**: Vercel (preview branches → main).

---

## 3) Domain & Email

**Domains**
- Primary: `fraternaladmonition.com` (live app).
- Secondary: `fraternaladmonition.org` → **301 redirect** to `.com`.
- Optional subs:
  - `invite.fraternaladmonition.com` — short links for Ambassador invites.
  - `cdn.fraternaladmonition.com` — public assets (if fronting storage/CDN).

**DNS (for Vercel)**
- `A @` → `76.76.21.21` (Vercel apex).  
- `CNAME www` → `cname.vercel-dns.com.`  
- Add `.org` as a domain in Vercel and set it to **redirect** permanently to `.com`.

**Email (Google Workspace on .com)**
- MX records (Google), SPF: `v=spf1 include:_spf.google.com ~all`
- DKIM: enable in Admin Console (publish TXT).
- DMARC (monitor first):  
  `_dmarc` TXT → `v=DMARC1; p=none; rua=mailto:dmarc@fraternaladmonition.com; fo=1; pct=100`
- Mailboxes/aliases: `info@`, `support@`, `no-reply@`, `press@`, `letters@`.
- **Transactional** sender on a **subdomain** (e.g., `mail.fraternaladmonition.com`) with its own SPF/DKIM to keep primary reputation clean.

---

## 4) Database Surfaces (tables you’ll use)

> For a full list/DDL, see the migration SQL. Below are the primary modules and the tables they rely on.

- **CMS**: `cms_pages`, `cms_assets`, `cms_settings`, `posts`
- **Users & Roles**: `public.users` (FK to `auth.users`)
- **Contest & Illustrations**: `contests`, `illustrations`
- **Submissions & Identity**: `submissions`, `submission_identities`
- **AI Filtering**: `ai_screenings`
- **Peer Review**: `peer_assignments`, `peer_reviews`
- **Public Voting**: `vote_bundles`, `votes`
- **Payments**: `payments`
- **Moderation**: `flags`
- **Ambassadors**: `ambassador_configs`, `ambassadors`, `ambassador_certifications`, `ambassador_invites`, `ambassador_invite_events`, `awards`, `ambassador_payouts`
- **Contacts/Newsletter**: `contact_messages`, `email_subscriptions`

---

## 5) Core Flows

### 5.1 Registration & Profile
1. User signs up (email/password) → record in `auth.users`.
2. Create row in `public.users` with default role `USER`; generate optional `display_id`.
3. Email verification (required before payment/submission).

**Tables**: `public.users`

---

### 5.2 Submission & Entry Fee
1. User opens “Submit” → chooses **illustration** (from 50), title, letter (plain text), 100-char note.
2. Create `submissions` row with **unique `submission_code`**; set `status='PENDING_PAYMENT'`.
3. Stripe Checkout (purpose `ENTRY_FEE`, $7) → webhook → `payments` update to `PAID` → set `submissions.status='SUBMITTED'`.
4. Show confirmation with `submission_code` (also email).

**Tables**: `submissions`, `illustrations`, `payments`

---

### 5.3 AI Filtering Round
1. Background job or operator runs screening for new `SUBMITTED` entries during AI window.
2. Store verdict & scores in `ai_screenings` (`PASSED` / `FAILED` / `REVIEW` + notes).
3. Only **PASSED** proceed to Peer Review pool (app-enforced).

**Tables**: `ai_screenings`, `submissions`

---

### 5.4 Peer Review
1. On `contests.peer_start_at`: assign each eligible submission to N reviewers (`peer_assignments`).
2. Reviewer submits scores (clarity, argument, style, moral_depth) + 100-char comment (`peer_reviews`).
3. Non-compliant authors are disqualified (app logic) before public voting.
4. Compute phase score (trim outliers).

**Tables**: `peer_assignments`, `peer_reviews`, `submissions`

---

### 5.5 Public Voting (payment-authenticated)
1. Publish finalists (top-rated from Peer Review).
2. Visitors purchase a **vote bundle** (purpose `VOTE_BUNDLE`) → `vote_bundles` created.
3. Each vote cast consumes 1 from `vote_bundles.remaining_votes` and obeys **per-submission cap**.
4. Anti-abuse heuristics hash/store minimal identity: `email_hash`, `ip_hash`, `device_hash`.
5. Compute normalized public score.

**Tables**: `payments`, `vote_bundles`, `votes`, `flags`

---

### 5.6 Finalists & Identity Capture
- For entries moving to public voting and for winners: collect `full_name`, `country`, `city` in `submission_identities`.
- Publish winners and top-100 per rules.

**Tables**: `submission_identities`, `submissions`

---

### 5.7 Awards & Payouts
- Record winners and amounts in `awards` (type `WRITING`, `EVALUATOR`, etc.).
- Handle **Ambassador** share via `ambassador_payouts` if applicable (based on provenance/invite).

**Tables**: `awards`, `ambassador_payouts`

---

### 5.8 Ambassadors
1. Application/certification (fee optional) → `ambassadors`, `ambassador_certifications`.
2. Personalized invite creation → `ambassador_invites` with anti-spam checks (min chars, similarity threshold).
3. Unlock logic: available invites increase upon conversions (registrations/submissions).
4. Event tracking in `ambassador_invite_events` (ISSUED, OPENED, REGISTERED, SUBMITTED).
5. Payouts when invitees win or are acquired.

**Tables**: `ambassador_configs`, `ambassadors`, `ambassador_certifications`, `ambassador_invites`, `ambassador_invite_events`, `ambassador_payouts`, `awards`

---

## 6) Admin Back Office

- **Content**: edit `cms_pages`, upload `cms_assets`, manage `posts`, tweak `cms_settings` (locks, banners).
- **Contest Control**: configure `contests` windows/phase; CRUD `illustrations`.
- **Submissions**: search, filter, view anonymized; set statuses; export CSV/JSON.
- **AI Filter**: run batches; reconcile `REVIEW` items.
- **Peer Review**: monitor assignment progress; reassign edge cases; enforce deadlines.
- **Public Voting**: monitor vote velocity, flags; refund logic for failed payments.
- **Ambassadors**: certify/revoke; monitor invites & anti-spam; approve payouts.
- **Awards**: enter winners, amounts, payout references.
- **Privacy/GDPR**: handle deletion requests; minimal PII; retention policies.

---

## 7) Security, Privacy, Compliance

- **Anonymity**: never display real names before the public-vote conclusion; only show `submission_code`.
- **PII**: store minimal identity only in `submission_identities` when required; restrict access to admins.
- **Payments**: webhook signature verification; idempotency keys.
- **Abuse Prevention**: hCaptcha; Redis rate limits; IP/device/email hashing; anomaly flags in `flags`.
- **Legal**: Terms, Privacy Policy, Contest Rules in CMS; consent checkboxes; data deletion workflow.

---

## 8) Milestones (suggested order)

1. Foundations: Auth + `public.users`, CMS pages, basic layout.
2. Contest config: `contests`, `illustrations`, Rules, timeline, teaser.
3. Submission flow + Entry fee integration; email confirmations.
4. AI Filtering: pipeline + dashboard.
5. Peer Review: assignment engine + UI + scoring.
6. Public Voting: vote bundles + anti-abuse + leaderboard.
7. Finalists & Identity: capture + publication.
8. Awards & Payouts.
9. Ambassadors: certification → invites → tracking → payouts.
10. Polish & Hardening: logs, metrics, backups, exports, admin training.

---

## 9) Deliverables

- Running app on `fraternaladmonition.com` with `.org` redirect.
- Source repo with README, environment sample, seeds, and admin guide.
- Database migration SQL applied; Prisma schema (optional) matching tables.
- Admin handbook for phases & incident response.

---

## 10) Open Questions

- Vote bundle pricing & sizes; donation UX.
- Exact limits for words/formatting; TBA → CMS setting.
- Ambassador payout formula & award share mechanics.
- Email verification rules for public voters (logged-out vs email-token flow).

---

**End of Outline**
