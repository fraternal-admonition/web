# Peer Review Cron Jobs Setup Guide

This guide explains how to set up automated deadline management for the peer review phase using **cron-job.org** (free external cron service).

---

## Overview

We need 2 cron jobs:
1. **Check Deadlines** - Runs every hour to mark expired assignments and reassign them
2. **Send Warnings** - Runs every 6 hours to send 24-hour deadline warning emails

---

## Step 1: Add CRON_SECRET to Environment Variables

### Local Development (.env.local)
```bash
CRON_SECRET=your-random-secret-here-change-this-in-production
```

### Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a strong random secret (e.g., use `openssl rand -base64 32`)
   - **Environment:** Production (and Preview if needed)
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

---

## Step 2: Set Up cron-job.org Account

1. Go to https://cron-job.org
2. Click **Sign Up** (free, no credit card required)
3. Verify your email address
4. Log in to your dashboard

---

## Step 3: Create Cron Job #1 - Check Deadlines (Hourly)

1. Click **Create cronjob** button
2. Fill in the form:

   **Title:** `Peer Review - Check Deadlines`
   
   **Address (URL):** `https://your-domain.com/api/cron/peer-review/check-deadlines`
   *(Replace `your-domain.com` with your actual domain)*
   
   **Schedule:**
   - Select **Every hour**
   - Or use custom: `0 * * * *` (runs at minute 0 of every hour)
   
   **Request method:** `GET`
   
   **Headers:** Click "Add header"
   - **Name:** `Authorization`
   - **Value:** `Bearer your-cron-secret-here`
   *(Use the same secret you added to environment variables)*
   
   **Notifications:**
   - ✅ Enable "Notify me on execution failures"
   - Set your email for notifications

3. Click **Create cronjob**

---

## Step 4: Create Cron Job #2 - Send Warnings (Every 6 Hours)

1. Click **Create cronjob** button again
2. Fill in the form:

   **Title:** `Peer Review - Deadline Warnings`
   
   **Address (URL):** `https://your-domain.com/api/cron/peer-review/send-warnings`
   *(Replace `your-domain.com` with your actual domain)*
   
   **Schedule:**
   - Select **Custom**
   - Enter: `0 */6 * * *` (runs every 6 hours at minute 0)
   
   **Request method:** `GET`
   
   **Headers:** Click "Add header"
   - **Name:** `Authorization`
   - **Value:** `Bearer your-cron-secret-here`
   *(Use the same secret you added to environment variables)*
   
   **Notifications:**
   - ✅ Enable "Notify me on execution failures"
   - Set your email for notifications

3. Click **Create cronjob**

---

## Step 5: Test the Cron Jobs

### Option A: Test via cron-job.org Dashboard
1. Go to your cronjobs list
2. Click the **▶ Play** button next to each job
3. Check the execution log to see if it succeeded
4. Look for HTTP 200 status code

### Option B: Test via curl (Local)
```bash
# Test check-deadlines endpoint
curl -X GET http://localhost:3000/api/cron/peer-review/check-deadlines \
  -H "Authorization: Bearer your-cron-secret-here"

# Test send-warnings endpoint
curl -X GET http://localhost:3000/api/cron/peer-review/send-warnings \
  -H "Authorization: Bearer your-cron-secret-here"
```

### Expected Response
```json
{
  "success": true,
  "timestamp": "2025-01-15T10:00:00.000Z",
  "expired": {
    "count": 5,
    "errors": []
  },
  "reassigned": {
    "count": 5,
    "errors": []
  }
}
```

---

## Step 6: Monitor Cron Jobs

### In cron-job.org Dashboard:
- View **Execution History** for each job
- Check success/failure rates
- Review execution logs
- Get email notifications on failures

### In Your Application Logs:
- Check Vercel logs for `[Cron]` prefixed messages
- Monitor for any errors in deadline service

---

## Troubleshooting

### ❌ "Unauthorized" Error (401)
**Problem:** CRON_SECRET doesn't match
**Solution:** 
- Verify the secret in Vercel environment variables
- Ensure the Authorization header in cron-job.org matches exactly
- Format must be: `Bearer your-secret-here` (with space after Bearer)
- Redeploy after changing environment variables

### ❌ "Cron secret not configured" Error (500)
**Problem:** CRON_SECRET environment variable not set
**Solution:**
- Add CRON_SECRET to Vercel environment variables
- Redeploy the application

### ❌ Cron job shows "Failed" status
**Problem:** API endpoint returned error or timed out
**Solution:**
- Check Vercel logs for error details
- Verify your domain is correct in the URL
- Ensure the API routes are deployed
- Check database connection

### ❌ No emails being sent
**Problem:** Deadline warnings not working
**Solution:**
- Verify RESEND_API_KEY is set in environment variables
- Check Resend dashboard for email delivery status
- Verify email templates are correct
- Check if there are actually assignments with upcoming deadlines

---

## Security Notes

1. **Keep CRON_SECRET private** - Never commit it to git
2. **Use strong secrets** - Generate with `openssl rand -base64 32`
3. **Different secrets per environment** - Use different secrets for dev/staging/prod
4. **Monitor execution logs** - Watch for unauthorized access attempts
5. **Rate limiting** - The API routes are protected by the secret, but consider adding rate limiting if needed

---

## Cost

**cron-job.org Free Tier:**
- ✅ 50 cron jobs
- ✅ Unlimited executions
- ✅ 1-minute minimum interval
- ✅ Email notifications
- ✅ Execution history
- ✅ No credit card required

**We're using:** 2 out of 50 available jobs

---

## Alternative: Manual Trigger (For Testing)

If you want to manually trigger the cron jobs for testing:

```bash
# Using curl
curl -X GET https://your-domain.com/api/cron/peer-review/check-deadlines \
  -H "Authorization: Bearer your-cron-secret"

# Or visit in browser (will show JSON response)
https://your-domain.com/api/cron/peer-review/check-deadlines
# (Add Authorization header via browser extension like ModHeader)
```

---

## Summary

✅ **What was implemented:**
- `/api/cron/peer-review/check-deadlines` - Marks expired assignments and reassigns them
- `/api/cron/peer-review/send-warnings` - Sends 24-hour deadline warning emails
- Security via CRON_SECRET environment variable
- Comprehensive error handling and logging

✅ **What you need to do:**
1. Add CRON_SECRET to Vercel environment variables
2. Create free account on cron-job.org
3. Set up 2 cron jobs with the URLs and schedules above
4. Test the jobs
5. Monitor execution logs

✅ **Schedules:**
- Check deadlines: Every hour (0 * * * *)
- Send warnings: Every 6 hours (0 */6 * * *)

---

## Questions?

If you encounter any issues:
1. Check Vercel logs for `[Cron]` messages
2. Check cron-job.org execution history
3. Verify environment variables are set correctly
4. Ensure the application is deployed and accessible
