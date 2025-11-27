import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  confirmationUrl: string
) {
  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: "Verify your email - Fraternal Admonition",
      text: `
Fraternal Admonition

Verify Your Email Address

Thank you for joining Fraternal Admonition. To complete your registration, please verify your email address by visiting this link:

${confirmationUrl}

If you didn't create an account with Fraternal Admonition, you can safely ignore this email.

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: #F3F3EF; padding: 30px; text-align: center; border-bottom: 2px solid #C19A43;">
                <h1 style="margin: 0; font-size: 24px; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Fraternal <span style="color: #C19A43;">Admonition</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Verify Your Email Address
                </h2>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #444;">
                  Thank you for joining Fraternal Admonition. To complete your registration, please verify your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmationUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #004D40; word-break: break-all;">
                  ${confirmationUrl}
                </p>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888;">
                  If you didn't create an account with Fraternal Admonition, you can safely ignore this email.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, displayName?: string) {
  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: "Welcome to Fraternal Admonition",
      text: `
Fraternal Admonition

Welcome${displayName ? `, ${displayName}` : ""}!

Your email has been verified. You're now part of the Fraternal Admonition community.

What's next?
- Explore the Letters to Goliath contest
- Learn about the 50 letters and 50 paintings
- Submit your own letter when the contest opens

Go to Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: #F3F3EF; padding: 30px; text-align: center; border-bottom: 2px solid #C19A43;">
                <h1 style="margin: 0; font-size: 24px; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Fraternal <span style="color: #C19A43;">Admonition</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Welcome${displayName ? `, ${displayName}` : ""}!
                </h2>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #444;">
                  Your email has been verified. You're now part of the Fraternal Admonition community.
                </p>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #444;">
                  <strong>What's next?</strong>
                </p>
                
                <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 16px; color: #444;">
                  <li style="margin-bottom: 10px;">Explore the Letters to Goliath contest</li>
                  <li style="margin-bottom: 10px;">Learn about the 50 letters and 50 paintings</li>
                  <li style="margin-bottom: 10px;">Submit your own letter when the contest opens</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    Go to Dashboard
                  </a>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
}

/**
 * Send AI screening results email (passed)
 */
export async function sendScreeningPassedEmail(
  email: string,
  submissionData: {
    submission_code: string;
    title: string;
    submission_id: string;
  }
) {
  const resultsUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/contest/screening-results/${submissionData.submission_id}`;

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `AI Screening Passed - ${submissionData.submission_code}`,
      text: `
AI SCREENING PASSED!

Your Submission Code: ${submissionData.submission_code}

Congratulations! Your letter has successfully passed our AI screening process.

Submission Details:
- Title: ${submissionData.title}
- Status: Passed AI Screening

What Happens Next?

1. Peer Review
   Your letter will be assigned to fellow contestants for evaluation.

2. Public Voting
   Top submissions advance to public voting.

3. Winner Announcement
   The winning submission will be announced and published.

View Results: ${resultsUrl}
View Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #2E7D32 0%, #43A047 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white; font-family: 'Playfair Display', Georgia, serif;">
                  AI Screening <span style="color: #C19A43;">Passed!</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; padding: 20px 30px; background: linear-gradient(135deg, #2E7D32 0%, #43A047 100%); border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">Your Submission Code</p>
                    <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: white; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${submissionData.submission_code}
                    </p>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    Congratulations! Your letter passed AI screening
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Submission Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Title</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Status</td>
                    <td style="padding: 12px 0; color: #2E7D32; font-size: 16px; text-align: right; font-weight: bold;">✓ Passed AI Screening</td>
                  </tr>
                </table>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What Happens Next?
                </h2>
                
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">1</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Peer Review</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Your letter will be assigned to fellow contestants for evaluation.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">2</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Public Voting</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Top submissions advance to public voting.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #C19A43; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">3</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Winner Announcement</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">The winning submission will be announced and published.</p>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${resultsUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #2E7D32; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                    View Detailed Results
                  </a>
                  <br>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    View Dashboard
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending screening passed email:", error);
    return { success: false, error };
  }
}

/**
 * Send AI screening results email (failed)
 */
export async function sendScreeningFailedEmail(
  email: string,
  submissionData: {
    submission_code: string;
    title: string;
    submission_id: string;
  }
) {
  const resultsUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/contest/screening-results/${submissionData.submission_id}`;

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `AI Screening Results - ${submissionData.submission_code}`,
      text: `
AI SCREENING RESULTS

Your Submission Code: ${submissionData.submission_code}

Your letter did not pass our AI screening process.

Submission Details:
- Title: ${submissionData.title}
- Status: Did Not Pass AI Screening

What You Can Do:

1. Review Feedback
   View detailed evaluation scores and understand which criteria were not met.

2. Submit Again
   You may submit a new letter with closer attention to the contest guidelines.

3. Request Peer Verification ($20)
   If you believe the AI decision was incorrect, request review by 10 fellow contestants who don't know the AI's decision.

View Results: ${resultsUrl}
View Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard

We appreciate your participation and encourage you to try again.

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: #F3F3EF; padding: 30px; text-align: center; border-bottom: 2px solid #C19A43;">
                <h1 style="margin: 0; font-size: 24px; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  AI Screening <span style="color: #C19A43;">Results</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; padding: 20px 30px; background: #F3F3EF; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: rgba(0,0,0,0.6); text-transform: uppercase; letter-spacing: 1px;">Your Submission Code</p>
                    <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #004D40; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${submissionData.submission_code}
                    </p>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    Your letter did not pass AI screening
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Submission Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Title</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Status</td>
                    <td style="padding: 12px 0; color: #C62828; font-size: 16px; text-align: right; font-weight: bold;">Did Not Pass AI Screening</td>
                  </tr>
                </table>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What You Can Do
                </h2>
                
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">1</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Review Feedback</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">View detailed evaluation scores and understand which criteria were not met.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">2</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Submit Again</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">You may submit a new letter with closer attention to the contest guidelines.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #C19A43; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">3</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Request Peer Verification ($20)</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">If you believe the AI decision was incorrect, request review by 10 fellow contestants who don't know the AI's decision.</p>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${resultsUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                    View Detailed Results
                  </a>
                  <br>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    View Dashboard
                  </a>
                </div>
                
                <div style="background: #F3F3EF; border-radius: 6px; padding: 20px; margin-top: 30px;">
                  <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
                    We appreciate your participation and encourage you to try again.
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending screening failed email:", error);
    return { success: false, error };
  }
}

/**
 * Send peer verification confirmation email
 */
export async function sendPeerVerificationConfirmationEmail(
  email: string,
  submissionData: {
    submission_code: string;
    title: string;
    submission_id: string;
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `Peer Verification Requested - ${submissionData.submission_code}`,
      text: `
PEER VERIFICATION REQUESTED

Your Submission Code: ${submissionData.submission_code}

Your request for peer verification has been confirmed.

Submission Details:
- Title: ${submissionData.title}
- Verification Fee: 20.00 USD

Payment Received
Your payment has been processed successfully. This email serves as your receipt.

What Happens Next?

1. Blind Review Assignment
   Your letter will be assigned to 10 fellow contestants for review.

2. Independent Evaluation
   Reviewers will evaluate your work without knowing the AI's decision.

3. Results Compilation
   We'll aggregate the peer reviews and determine the outcome.

4. Notification
   You'll be notified when the peer verification process is complete (typically 7-14 days).

Important: Reviewers do not know whether the AI passed or eliminated your letter. This ensures an unbiased, fair evaluation.

View Dashboard: ${dashboardUrl}

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white; font-family: 'Playfair Display', Georgia, serif;">
                  Peer Verification <span style="color: #FFE082;">Requested</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; padding: 20px 30px; background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%); border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">Your Submission Code</p>
                    <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: white; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${submissionData.submission_code}
                    </p>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    Your request for peer verification has been confirmed
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Submission Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Title</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Verification Fee</td>
                    <td style="padding: 12px 0; color: #1565C0; font-size: 18px; text-align: right; font-weight: bold;">20.00 USD</td>
                  </tr>
                </table>
                
                <div style="background: #E3F2FD; border: 1px solid #90CAF9; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #1565C0; font-weight: 600;">
                    ✓ Payment Received
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #1565C0;">
                    Your payment has been processed successfully. This email serves as your receipt.
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What Happens Next?
                </h2>
                
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #1565C0; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">1</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Blind Review Assignment</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Your letter will be assigned to 10 fellow contestants for review.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #1565C0; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">2</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Independent Evaluation</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Reviewers will evaluate your work without knowing the AI's decision.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #1565C0; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">3</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Results Compilation</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">We'll aggregate the peer reviews and determine the outcome.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #C19A43; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">4</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Notification</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">You'll be notified when the peer verification process is complete (typically 7-14 days).</p>
                    </div>
                  </div>
                </div>
                
                <div style="background: #FFF9E6; border: 1px solid #FFE082; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⚠️ Important:</strong> Reviewers do not know whether the AI passed or eliminated your letter. This ensures an unbiased, fair evaluation.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${dashboardUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #1565C0; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    View Dashboard
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending peer verification confirmation email:", error);
    return { success: false, error };
  }
}

export async function sendSubmissionConfirmationEmail(
  email: string,
  submissionData: {
    submission_code: string;
    title: string;
    contest_title: string;
    amount: number;
  }
) {
  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `Submission Confirmed - ${submissionData.submission_code}`,
      text: `
SUBMISSION CONFIRMED!

Your Submission Code: ${submissionData.submission_code}

Save this code to track your submission.

IMPORTANT: Your submission is tracked anonymously using this code. Keep it safe!

Submission Details:
- Contest: ${submissionData.contest_title}
- Title: ${submissionData.title}
- Entry Fee: $${submissionData.amount.toFixed(2)} USD

Payment Received
Your payment has been processed successfully. This email serves as your receipt.

What Happens Next?

1. AI Filtering
   Your submission will be reviewed to ensure it meets contest guidelines.

2. Peer Review
   Qualified submissions will be reviewed by fellow participants.

3. Public Voting
   Top submissions advance to public voting.

4. Winner Announcement
   The winning submission will be announced and published.

View Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #004D40 0%, #00695C 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white; font-family: 'Playfair Display', Georgia, serif;">
                  Submission <span style="color: #C19A43;">Confirmed!</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; padding: 20px 30px; background: linear-gradient(135deg, #004D40 0%, #00695C 100%); border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px;">Your Submission Code</p>
                    <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: white; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${submissionData.submission_code}
                    </p>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    Save this code to track your submission
                  </p>
                </div>
                
                <div style="background: #FFF9E6; border: 1px solid #FFE082; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>⚠️ Important:</strong> Your submission is tracked anonymously using this code. Keep it safe!
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Submission Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Contest</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.contest_title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Title</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Entry Fee</td>
                    <td style="padding: 12px 0; color: #004D40; font-size: 18px; text-align: right; font-weight: bold;">$${submissionData.amount.toFixed(2)} USD</td>
                  </tr>
                </table>
                
                <div style="background: #E8F5E9; border: 1px solid #81C784; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #2E7D32; font-weight: 600;">
                    ✓ Payment Received
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #2E7D32;">
                    Your payment has been processed successfully. This email serves as your receipt.
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What Happens Next?
                </h2>
                
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">1</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">AI Filtering</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Your submission will be reviewed to ensure it meets contest guidelines.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">2</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Peer Review</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Qualified submissions will be reviewed by fellow participants.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">3</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Public Voting</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Top submissions advance to public voting.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #C19A43; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">4</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Winner Announcement</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">The winning submission will be announced and published.</p>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    View Dashboard
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending submission confirmation email:", error);
    return { success: false, error };
  }
}

/**
 * Send peer verification assignment notification email to reviewers
 */
export async function sendAssignmentNotificationEmail(
  email: string,
  reviewerData: {
    reviewer_name?: string;
    assignment_count: number;
    deadline: string; // ISO date string
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/peer-verification-tasks`;
  
  // Format deadline as readable date
  const deadlineDate = new Date(reviewerData.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Calculate days until deadline
  const now = new Date();
  const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `New Peer Verification Assignment - ${reviewerData.assignment_count} Submissions to Review`,
      text: `
NEW PEER VERIFICATION ASSIGNMENT

${reviewerData.reviewer_name ? `Hello ${reviewerData.reviewer_name},` : 'Hello,'}

You have been selected to review ${reviewerData.assignment_count} submissions as part of our peer verification process.

Assignment Details:
- Number of Submissions: ${reviewerData.assignment_count}
- Deadline: ${formattedDeadline} (${daysUntilDeadline} days)
- Time Required: Approximately ${reviewerData.assignment_count * 10} minutes

What is Peer Verification?

Peer verification is an appeal process where authors who were eliminated by AI screening can request human review. You'll evaluate submissions without knowing the AI's decision, ensuring an unbiased assessment.

Your Role:

1. Review Submissions
   Read each submission carefully and evaluate based on quality and contest criteria.

2. Make Your Decision
   For each submission, decide whether it should be "Reinstated" or "Eliminated".

3. Provide Brief Feedback
   Write a short comment (max 100 characters) explaining your decision.

Important Notes:

- You will NOT know which submissions are verification requests vs. control submissions
- You will NOT know the AI's decision on any submission
- Your evaluation should be based solely on the content and quality
- Deadline: ${formattedDeadline} (${daysUntilDeadline} days from now)

Start Reviewing: ${dashboardUrl}

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white; font-family: 'Playfair Display', Georgia, serif;">
                  New Peer Verification <span style="color: #FFE082;">Assignment</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #444;">
                  ${reviewerData.reviewer_name ? `Hello <strong>${reviewerData.reviewer_name}</strong>,` : 'Hello,'}
                </p>
                
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #444;">
                  You have been selected to review <strong>${reviewerData.assignment_count} submissions</strong> as part of our peer verification process.
                </p>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Assignment Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Number of Submissions</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 16px; text-align: right; font-weight: bold;">${reviewerData.assignment_count}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Deadline</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${formattedDeadline}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Days Remaining</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #6A1B9A; font-size: 18px; text-align: right; font-weight: bold;">${daysUntilDeadline} days</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Time Required</td>
                    <td style="padding: 12px 0; color: #666; font-size: 14px; text-align: right;">~${reviewerData.assignment_count * 10} minutes</td>
                  </tr>
                </table>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What is Peer Verification?
                </h2>
                
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #444;">
                  Peer verification is an appeal process where authors who were eliminated by AI screening can request human review. You'll evaluate submissions <strong>without knowing the AI's decision</strong>, ensuring an unbiased assessment.
                </p>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Your Role
                </h2>
                
                <div style="margin-bottom: 30px;">
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #6A1B9A; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">1</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Review Submissions</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Read each submission carefully and evaluate based on quality and contest criteria.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #6A1B9A; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">2</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Make Your Decision</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">For each submission, decide whether it should be "Reinstated" or "Eliminated".</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #6A1B9A; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">3</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Provide Brief Feedback</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">Write a short comment (max 100 characters) explaining your decision.</p>
                    </div>
                  </div>
                </div>
                
                <div style="background: #F3E5F5; border: 1px solid #CE93D8; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #6A1B9A; font-weight: 600;">
                    ⚠️ Important Notes:
                  </p>
                  <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #6A1B9A;">
                    <li style="margin-bottom: 8px;">You will <strong>NOT</strong> know which submissions are verification requests vs. control submissions</li>
                    <li style="margin-bottom: 8px;">You will <strong>NOT</strong> know the AI's decision on any submission</li>
                    <li style="margin-bottom: 8px;">Your evaluation should be based solely on the content and quality</li>
                    <li>Deadline: <strong>${formattedDeadline}</strong> (${daysUntilDeadline} days from now)</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${dashboardUrl}" 
                     style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(106, 27, 154, 0.3);">
                    Start Reviewing →
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending assignment notification email:", error);
    return { success: false, error };
  }
}


/**
 * Send peer verification complete email to submission author
 */
export async function sendVerificationCompleteEmail(
  email: string,
  submissionCode: string,
  submissionTitle: string,
  decision: 'REINSTATED' | 'ELIMINATED_CONFIRMED' | 'AI_DECISION_UPHELD',
  reinstateVotes: number,
  eliminateVotes: number,
  totalVotes: number,
  message: string,
  resultsUrl: string,
  currentPhase?: string
) {
  const reinstatePercentage = Math.round((reinstateVotes / totalVotes) * 100);
  const eliminatePercentage = Math.round((eliminateVotes / totalVotes) * 100);

  const decisionColor =
    decision === 'REINSTATED'
      ? '#2E7D32'
      : decision === 'ELIMINATED_CONFIRMED'
      ? '#C62828'
      : '#F57C00';

  const decisionTitle =
    decision === 'REINSTATED'
      ? 'Submission Reinstated!'
      : decision === 'ELIMINATED_CONFIRMED'
      ? 'Elimination Confirmed'
      : 'AI Decision Upheld';

  const phaseText =
    decision === 'REINSTATED' && currentPhase
      ? `<p style="margin: 20px 0 0 0; font-size: 15px; color: #444;">
           Your submission has been reinstated and will re-enter the contest in the <strong>${currentPhase}</strong> phase.
         </p>`
      : '';

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        'Fraternal Admonition <noreply@fraternaladmonition.com>',
      to: email,
      subject: `Peer Verification Complete: ${submissionCode} - Fraternal Admonition`,
      text: `
Fraternal Admonition

Peer Verification Complete

Your submission "${submissionTitle}" (${submissionCode}) has completed peer verification.

Decision: ${decisionTitle}

Vote Breakdown:
- Reinstate: ${reinstateVotes}/${totalVotes} (${reinstatePercentage}%)
- Eliminate: ${eliminateVotes}/${totalVotes} (${eliminatePercentage}%)

${message}

${decision === 'REINSTATED' && currentPhase ? `Your submission has been reinstated and will re-enter the contest in the ${currentPhase} phase.` : ''}

View detailed results: ${resultsUrl}

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: #F3F3EF; padding: 30px; text-align: center; border-bottom: 2px solid #C19A43;">
                <h1 style="margin: 0; font-size: 24px; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Fraternal <span style="color: #C19A43;">Admonition</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Peer Verification Complete
                </h2>
                
                <p style="margin: 0 0 10px 0; font-size: 16px; color: #444;">
                  Your submission <strong>"${submissionTitle}"</strong> (${submissionCode}) has completed peer verification.
                </p>
                
                <!-- Decision Badge -->
                <div style="background: ${decisionColor}15; border-left: 4px solid ${decisionColor}; padding: 16px; margin: 24px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; color: ${decisionColor}; font-family: 'Playfair Display', Georgia, serif;">
                    ${decisionTitle}
                  </h3>
                  <p style="margin: 0; font-size: 15px; color: #444;">
                    ${message}
                  </p>
                  ${phaseText}
                </div>
                
                <!-- Vote Breakdown -->
                <div style="background: #F9F9F7; padding: 20px; border-radius: 4px; margin: 24px 0;">
                  <h4 style="margin: 0 0 16px 0; font-size: 16px; color: #222;">
                    Vote Breakdown
                  </h4>
                  
                  <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-size: 14px; color: #444;">Reinstate</span>
                      <span style="font-size: 14px; font-weight: 600; color: #2E7D32;">${reinstateVotes}/${totalVotes} (${reinstatePercentage}%)</span>
                    </div>
                    <div style="background: #E5E5E0; height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="background: #2E7D32; height: 100%; width: ${reinstatePercentage}%;"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-size: 14px; color: #444;">Eliminate</span>
                      <span style="font-size: 14px; font-weight: 600; color: #C62828;">${eliminateVotes}/${totalVotes} (${eliminatePercentage}%)</span>
                    </div>
                    <div style="background: #E5E5E0; height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="background: #C62828; height: 100%; width: ${eliminatePercentage}%;"></div>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resultsUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    View Detailed Results
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888;">
                  Thank you for participating in Fraternal Admonition. Your submission was reviewed by 10 fellow contestants in a blind review process.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending verification complete email:', error);
    return { success: false, error };
  }
}


/**
 * Send deadline warning email (24 hours before deadline)
 */
export async function sendDeadlineWarningEmail(
  email: string,
  data: {
    assignment_count: number;
    deadline: string;
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/peer-verification-tasks`;
  
  // Format deadline as readable date
  const deadlineDate = new Date(data.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `Reminder: Peer Verification Deadline in 24 Hours`,
      text: `
PEER VERIFICATION DEADLINE REMINDER

You have ${data.assignment_count} peer verification assignment${data.assignment_count > 1 ? 's' : ''} due in 24 hours.

Deadline: ${formattedDeadline}

Please complete your reviews before the deadline to help ensure fair evaluation for all participants.

Start Reviewing: ${dashboardUrl}

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #F57C00 0%, #FF9800 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white; font-family: 'Playfair Display', Georgia, serif;">
                  Deadline <span style="color: #FFE082;">Reminder</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="background: #FFF3E0; border: 2px solid #FF9800; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                  <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #E65100;">
                    ⏰ 24 Hours Remaining
                  </p>
                  <p style="margin: 0; font-size: 15px; color: #E65100;">
                    You have <strong>${data.assignment_count} peer verification assignment${data.assignment_count > 1 ? 's' : ''}</strong> due soon
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Deadline Information
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Assignments Due</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 16px; text-align: right; font-weight: bold;">${data.assignment_count}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Deadline</td>
                    <td style="padding: 12px 0; color: #F57C00; font-size: 14px; text-align: right; font-weight: 600;">${formattedDeadline}</td>
                  </tr>
                </table>
                
                <p style="margin: 0 0 30px 0; font-size: 15px; color: #444;">
                  Please complete your reviews before the deadline to help ensure fair evaluation for all participants.
                </p>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${dashboardUrl}" 
                     style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #F57C00 0%, #FF9800 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(245, 124, 0, 0.3);">
                    Complete Reviews Now →
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending deadline warning email:", error);
    return { success: false, error };
  }
}

/**
 * Send final reminder email (2 hours before deadline)
 */
export async function sendFinalReminderEmail(
  email: string,
  data: {
    assignment_count: number;
    deadline: string;
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/peer-verification-tasks`;
  
  // Format deadline as readable date
  const deadlineDate = new Date(data.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `URGENT: Peer Verification Deadline in 2 Hours`,
      text: `
URGENT: PEER VERIFICATION DEADLINE

You have ${data.assignment_count} peer verification assignment${data.assignment_count > 1 ? 's' : ''} due in 2 HOURS.

Deadline: ${formattedDeadline}

This is your final reminder. Please complete your reviews immediately to avoid expiration.

Start Reviewing: ${dashboardUrl}

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #C62828 0%, #E53935 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white; font-family: 'Playfair Display', Georgia, serif;">
                  URGENT: Final <span style="color: #FFE082;">Reminder</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="background: #FFEBEE; border: 3px solid #C62828; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                  <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold; color: #B71C1C;">
                    🚨 2 HOURS REMAINING
                  </p>
                  <p style="margin: 0; font-size: 15px; color: #B71C1C;">
                    You have <strong>${data.assignment_count} peer verification assignment${data.assignment_count > 1 ? 's' : ''}</strong> expiring soon
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Deadline Information
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Assignments Due</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 16px; text-align: right; font-weight: bold;">${data.assignment_count}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Deadline</td>
                    <td style="padding: 12px 0; color: #C62828; font-size: 14px; text-align: right; font-weight: 600;">${formattedDeadline}</td>
                  </tr>
                </table>
                
                <p style="margin: 0 0 30px 0; font-size: 15px; color: #444;">
                  <strong>This is your final reminder.</strong> Please complete your reviews immediately to avoid expiration.
                </p>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${dashboardUrl}" 
                     style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #C62828 0%, #E53935 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(198, 40, 40, 0.3);">
                    Complete Reviews NOW →
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending final reminder email:", error);
    return { success: false, error };
  }
}

/**
 * Send refund notification email
 */
export async function sendRefundNotificationEmail(
  email: string,
  data: {
    submission_code: string;
    title: string;
    amount: number;
    completed_reviews: number;
    required_reviews: number;
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `Peer Verification Refund - ${data.submission_code}`,
      text: `
PEER VERIFICATION REFUND

Your Submission Code: ${data.submission_code}

We're issuing a refund for your peer verification request.

Submission Details:
- Title: ${data.title}
- Refund Amount: $${data.amount.toFixed(2)} USD

Why Am I Receiving a Refund?

Your peer verification request did not receive enough completed reviews within the 14-day timeframe. We received ${data.completed_reviews} completed reviews, but require at least ${data.required_reviews} for a valid result.

Refund Processing:

Your refund of $${data.amount.toFixed(2)} will be processed within 5-10 business days and will appear on your original payment method.

We Apologize:

We sincerely apologize for the inconvenience. This situation occurs when there aren't enough active reviewers available to complete all assignments in time.

What You Can Do:

1. Submit a New Letter
   You may submit a new letter with closer attention to the contest guidelines.

2. Try Again Later
   You can request peer verification again when more reviewers are available.

View Dashboard: ${dashboardUrl}

Questions? Contact us at support@fraternaladmonition.com

© 2025 Fraternal Admonition. All rights reserved.
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #222; background-color: #F9F9F7; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #E5E5E0; border-radius: 8px; overflow: hidden;">
              <!-- Header -->
              <div style="background: #F3F3EF; padding: 30px; text-align: center; border-bottom: 2px solid #C19A43;">
                <h1 style="margin: 0; font-size: 24px; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Peer Verification <span style="color: #C19A43;">Refund</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; padding: 20px 30px; background: #F3F3EF; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: rgba(0,0,0,0.6); text-transform: uppercase; letter-spacing: 1px;">Your Submission Code</p>
                    <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #004D40; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                      ${data.submission_code}
                    </p>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    We're issuing a refund for your peer verification request
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Submission Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Title</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${data.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Refund Amount</td>
                    <td style="padding: 12px 0; color: #2E7D32; font-size: 18px; text-align: right; font-weight: bold;">$${data.amount.toFixed(2)} USD</td>
                  </tr>
                </table>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Why Am I Receiving a Refund?
                </h2>
                
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #444;">
                  Your peer verification request did not receive enough completed reviews within the 14-day timeframe. We received <strong>${data.completed_reviews} completed reviews</strong>, but require at least <strong>${data.required_reviews}</strong> for a valid result.
                </p>
                
                <div style="background: #E8F5E9; border: 1px solid #81C784; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #2E7D32; font-weight: 600;">
                    💰 Refund Processing
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #2E7D32;">
                    Your refund of <strong>$${data.amount.toFixed(2)}</strong> will be processed within 5-10 business days and will appear on your original payment method.
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  We Apologize
                </h2>
                
                <p style="margin: 0 0 30px 0; font-size: 15px; color: #444;">
                  We sincerely apologize for the inconvenience. This situation occurs when there aren't enough active reviewers available to complete all assignments in time.
                </p>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What You Can Do
                </h2>
                
                <div style="margin-bottom: 30px;">
                  <div style="display: flex; align-items: start; margin-bottom: 15px;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">1</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Submit a New Letter</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">You may submit a new letter with closer attention to the contest guidelines.</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: start;">
                    <div style="flex-shrink: 0; width: 28px; height: 28px; background: #004D40; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px;">2</div>
                    <div>
                      <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #222;">Try Again Later</p>
                      <p style="margin: 0; font-size: 14px; color: #666;">You can request peer verification again when more reviewers are available.</p>
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${dashboardUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #004D40; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    View Dashboard
                  </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E5E0; margin: 30px 0;" />
                
                <p style="margin: 0; font-size: 13px; color: #888; text-align: center;">
                  Questions? Contact us at support@fraternaladmonition.com
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background: #F3F3EF; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E5E0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                  © 2025 Fraternal Admonition. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending refund notification email:", error);
    return { success: false, error };
  }
}
