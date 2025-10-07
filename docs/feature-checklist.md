+<!-- filename: feature-checklist.md -->

# Fraternal Admonition — _Letters to Goliath_

**Feature Checklist (with DB table mapping)**  
_Last updated: 2025-10-04_

> Use this as your build tracker. Each item lists the **tables used** and key acceptance criteria. Phases are ordered for smooth delivery.

---

## Phase 1 — Foundations

### 1.1 Project Setup

- [x] Repo, linting, formatting, CI, environment templates.
- [x] **Accept:** `pnpm build` & `pnpm dev` OK; `.env.example` documented.

### 1.2 Auth & Public Profiles

- [x] Sign up / Sign in (email+password), email verification.
- [x] On signup: create `public.users` row (role `USER`, optional `display_id`).
- [x] **Tables:** `public.users` (FK to `auth.users`).
- [x] **Accept:** Verified users can access dashboard; ban flag respected in app middleware.

### 1.3 CMS (Pages & Settings)

- [ ] Admin CRUD for `cms_pages`, upload `cms_assets`, edit `cms_settings` (e.g., site lock, banners).
- [x] Public render of Home, About, Rules, FAQ, Contact.
- [ ] **Tables:** `cms_pages`, `cms_assets`, `cms_settings`.
- [ ] **Accept:** Draft vs published; content versioning strategy (app-level) documented.

### 1.4 Updates / Blog

- [ ] Admin CRUD for `posts`; public listing & detail.
- [ ] **Tables:** `posts`
- [ ] **Accept:** Publish scheduling (optional), SEO fields in metadata.

---

## Phase 2 — Contest Configuration

### 2.1 Contest CRUD & Timeline

- [ ] Admin creates LtG contest; set windows (submission, AI filter, peer, public), optional `max_entries`.
- [ ] **Tables:** `contests`
- [ ] **Accept:** Phase auto-switch (cron) or manual override; UI displays current phase.

### 2.2 Illustrations (50 options)

- [ ] Admin uploads/links images; mark active/inactive.
- [ ] **Tables:** `illustrations`, `cms_assets`
- [ ] **Accept:** Unique titles; render gallery in Submit form.

---

## Phase 3 — Submission & Entry Fee

### 3.1 Submission Form

- [ ] Fields: title, body (plain text), illustration, 100-char note; generate `submission_code`.
- [ ] Create as `PENDING_PAYMENT`.
- [ ] **Tables:** `submissions`, `illustrations`
- [ ] **Accept:** `submission_code` is unique per contest and shown on confirmation & email.

### 3.2 Entry Fee Payment

- [ ] Stripe Checkout: purpose=`ENTRY_FEE`, amount=7 USD.
- [ ] Webhook sets `payments.status='PAID'` then `submissions.status='SUBMITTED'`.
- [ ] **Tables:** `payments`, `submissions`
- [ ] **Accept:** Idempotent webhooks; failure paths handled; receipt email sent.

---

## Phase 4 — AI Filtering

### 4.1 Screening Pipeline

- [ ] Batch or streaming screen of new `SUBMITTED` within AI window.
- [ ] Store result (`PASSED`/`FAILED`/`REVIEW`) + metrics/notes.
- [ ] **Tables:** `ai_screenings`, `submissions`
- [ ] **Accept:** Only `PASSED` move to Peer Review pool; REVIEW queue visible to admin.

---

## Phase 5 — Peer Review

### 5.1 Assignment Engine

- [ ] N assignments per submission; avoid self-review and heavy reciprocity; balance load.
- [ ] **Tables:** `peer_assignments`, `submissions`
- [ ] **Accept:** Deterministic with seed; reassign tool in admin.

### 5.2 Review UI

- [ ] Criteria 1–5: clarity, argument, style, moral depth; 100-char comment.
- [ ] **Tables:** `peer_reviews`, `peer_assignments`
- [ ] **Accept:** Progress bar; deadline reminders; disqualify authors who don't complete reviews.

### 5.3 Scoring

- [ ] Compute trimmed mean per criterion; aggregate to `score_peer`.
- [ ] **Tables:** `submissions`
- [ ] **Accept:** Recompute on review edits; audit log (app-level).

---

## Phase 6 — Public Voting

### 6.1 Finalist Publishing

- [ ] Publish top-rated from Peer Review for public voting.
- [ ] **Tables:** `submissions`
- [ ] **Accept:** Only finalists are publicly browsable.

### 6.2 Vote Bundle Purchase

- [ ] Anonymous or logged-in purchase of vote credits.
- [ ] **Tables:** `payments` (purpose=`VOTE_BUNDLE`), `vote_bundles`
- [ ] **Accept:** `remaining_votes` decrements; expiry (optional).

### 6.3 Cast Votes (with caps)

- [ ] Enforce **per-submission cap** from `vote_bundles.per_submission_cap` (app logic).
- [ ] anti-abuse: `email_hash`, `ip_hash`, `device_hash` logging.
- [ ] **Tables:** `votes`, `vote_bundles`, `flags`
- [ ] **Accept:** One vote per (submission, voter_user_id) when logged-in; anomalies flagged.

### 6.4 Public Score

- [ ] Normalize counts; compute `score_public`; update `score_final` by configured weights.
- [ ] **Tables:** `submissions`
- [ ] **Accept:** Leaderboard stable under replay; export CSV/JSON.

---

## Phase 7 — Finalists, Identities, Publishing

### 7.1 Identity Capture

- [ ] Collect `full_name`, `country`, `city` for finalists/winners only.
- [ ] **Tables:** `submission_identities`
- [ ] **Accept:** Stored after public voting concludes; privacy respected.

### 7.2 Publication

- [ ] Publish top 100 with names; prepare book selection list (top 50).
- [ ] **Tables:** `submissions`, `submission_identities`
- [ ] **Accept:** Only after voting; book list export for publisher.

---

## Phase 8 — Awards & Payouts

### 8.1 Awards

- [ ] Record winners (writing, evaluator, cover art, acquisition), amounts, currency.
- [ ] **Tables:** `awards`
- [ ] **Accept:** Constraint enforced that evaluator awards reference `evaluator_user_id`, others a `submission_id`.

### 8.2 Payouts & References

- [ ] Ambassador/winner payouts; store references and timestamps.
- [ ] **Tables:** `ambassador_payouts`, `awards`
- [ ] **Accept:** Status transitions (`PENDING`→`APPROVED`→`PAID`).

---

## Phase 9 — Ambassadors

### 9.1 Config & Certification

- [ ] Admin sets thresholds; applicants take certification; optional fee.
- [ ] **Tables:** `ambassador_configs`, `ambassadors`, `ambassador_certifications`, `payments`
- [ ] **Accept:** Passing increases `available_invites`; revoke path supported.

### 9.2 Personalized Invites

- [ ] Create `ambassador_invites` with **personalized pitch**, tokenized URL.
- [ ] **Tables:** `ambassador_invites`
- [ ] **Accept:** Enforce min chars & similarity checks (app-level); statuses updated.

### 9.3 Events & Unlocks

- [ ] Track ISSUED, OPENED, REGISTERED, SUBMITTED.
- [ ] **Tables:** `ambassador_invite_events`
- [ ] **Accept:** Conversion increases `available_invites` per config.

### 9.4 Payouts for Ambassadors

- [ ] When invitee wins or is acquired, calculate share → `ambassador_payouts`.
- [ ] **Tables:** `ambassador_payouts`, `awards`
- [ ] **Accept:** Admin approval required; exports available.

---

## Phase 10 — Communications & Support

### 10.1 Contact & Newsletter

- [ ] Contact form → `contact_messages`; email list → `email_subscriptions`.
- [ ] **Tables:** `contact_messages`, `email_subscriptions`
- [ ] **Accept:** Admin can reply via Workspace; exports allowed.

### 10.2 Transactional Emails

- [ ] Templates: signup, verify, submission receipt (with `submission_code`), payment receipts, review reminders, finalist notifications, awards.
- [ ] **Tables:** (no direct tables; rely on `payments`/`submissions` context)

---

## Phase 11 — Admin Operations

- [ ] Audit & export (CSV/JSON) of submissions, reviews, votes, awards.
- [ ] Phase switch tools; reassigners; fraud dashboard.
- [ ] **Tables:** All core tables
- [ ] **Accept:** Admin-only routes; actions logged (app-level).

---

## Non-Functional Requirements

- [ ] Accessibility (WCAG AA), SSR-friendly, fast LCP.
- [ ] Security: CSRF, XSS, webhook signatures, rate limits.
- [ ] Privacy: data retention policy; delete-on-request; minimal PII.
- [ ] Backups: daily DB snapshots; storage lifecycle.
- [ ] Observability: Sentry + structured logs + dashboards.

---

## Ready-to-Ship Checklist

- [ ] All migrations applied in Supabase.
- [ ] `.env` for Stripe, email sender, Redis, hCaptcha, DB URL.
- [ ] Admin account promoted (`public.users.role='ADMIN'`).
- [ ] DNS done: A, CNAME, MX, SPF, DKIM, DMARC; `.org` redirect to `.com`.
- [ ] Content seeded: Rules, About, illustrations (50), timeline.
- [ ] Payment webhooks verified & idempotent.
- [ ] Backups and error alerting tested.
- [ ] Legal pages in CMS: Terms, Privacy, Rules.

**End of Checklist**
