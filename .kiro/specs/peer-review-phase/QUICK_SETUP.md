# Quick Setup Checklist

## ✅ Task 12 Complete - Cron Jobs Setup

### What Was Implemented:

**2 API Routes Created:**
1. `GET /api/cron/peer-review/check-deadlines` - Runs every hour
2. `GET /api/cron/peer-review/send-warnings` - Runs every 6 hours

**Security:** Both routes require `Authorization: Bearer <CRON_SECRET>` header

---

## 🚀 Your Setup Steps (5 minutes):

### 1️⃣ Add Environment Variable
**Vercel Dashboard** → Settings → Environment Variables:
```
Name: CRON_SECRET
Value: (generate with: openssl rand -base64 32)
```
Then **redeploy** your app.

### 2️⃣ Sign Up for cron-job.org
- Go to https://cron-job.org
- Free signup (no credit card)
- Verify email

### 3️⃣ Create Job #1 - Check Deadlines
```
Title: Peer Review - Check Deadlines
URL: https://YOUR-DOMAIN.com/api/cron/peer-review/check-deadlines
Schedule: 0 * * * * (every hour)
Method: GET
Header: Authorization = Bearer YOUR-CRON-SECRET
```

### 4️⃣ Create Job #2 - Send Warnings
```
Title: Peer Review - Deadline Warnings  
URL: https://YOUR-DOMAIN.com/api/cron/peer-review/send-warnings
Schedule: 0 */6 * * * (every 6 hours)
Method: GET
Header: Authorization = Bearer YOUR-CRON-SECRET
```

### 5️⃣ Test
Click the ▶ Play button in cron-job.org dashboard for each job.

---

## 📋 What Happens:

**Every Hour:**
- Checks for expired assignments (deadline passed)
- Marks them as EXPIRED
- Reassigns to new reviewers
- Sends notification emails to new reviewers

**Every 6 Hours:**
- Finds assignments due in 23-24 hours
- Sends warning emails to reviewers
- Reminds them to complete reviews

---

## 🔍 Monitoring:

- **cron-job.org:** View execution history and logs
- **Vercel Logs:** Search for `[Cron]` to see detailed logs
- **Email:** Get notified if jobs fail

---

## 📖 Full Details:

See `CRON_SETUP.md` for complete documentation, troubleshooting, and security notes.

---

**No UI changes** - This is pure backend automation.
**No database changes** - Uses existing tables.
**Next UI changes** - Task 13 (Results Display Components)

**Tokens remaining: ~29,000 / 200,000**
