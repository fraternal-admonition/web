import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send peer review deadline warning email (24h before deadline)
 * Requirements: 22.2
 */
export async function sendPeerReviewDeadlineWarningEmail(
  email: string,
  reviewerData: {
    reviewer_name?: string;
    pending_count: number;
    deadline: string; // ISO date string
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/peer-review-tasks`;
  
  // Format deadline as readable date
  const deadlineDate = new Date(reviewerData.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `⏰ Peer Review Deadline Reminder - 24 Hours Remaining`,
      text: `
PEER REVIEW DEADLINE REMINDER

${reviewerData.reviewer_name ? `Hello ${reviewerData.reviewer_name},` : 'Hello,'}

This is a friendly reminder that you have peer review assignments due in 24 hours.

Assignment Status:
- Pending Reviews: ${reviewerData.pending_count}
- Deadline: ${formattedDeadline}

⚠️ IMPORTANT: Complete all reviews by the deadline to avoid disqualification

What Happens if You Miss the Deadline?

If you don't complete all ${reviewerData.pending_count} reviews by ${formattedDeadline}, your own submission will be automatically disqualified from the contest. This ensures fairness for all participants.

Complete Your Reviews Now: ${dashboardUrl}

Need Help?

If you're having trouble completing your reviews, contact us immediately at support@fraternaladmonition.com

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
                  ⏰ Deadline <span style="color: #FFF3E0;">Reminder</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #444;">
                  ${reviewerData.reviewer_name ? `Hello <strong>${reviewerData.reviewer_name}</strong>,` : 'Hello,'}
                </p>
                
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #444;">
                  This is a friendly reminder that you have <strong>peer review assignments due in 24 hours</strong>.
                </p>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Assignment Status
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Pending Reviews</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #F57C00; font-size: 20px; text-align: right; font-weight: bold;">${reviewerData.pending_count}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Deadline</td>
                    <td style="padding: 12px 0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${formattedDeadline}</td>
                  </tr>
                </table>
                
                <div style="background: #FFF3E0; border: 2px solid #F57C00; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; color: #E65100; font-weight: 700;">
                    ⚠️ IMPORTANT
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #E65100;">
                    Complete all reviews by the deadline to avoid disqualification
                  </p>
                </div>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What Happens if You Miss the Deadline?
                </h2>
                
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
                  If you don't complete all <strong>${reviewerData.pending_count} reviews</strong> by <strong>${formattedDeadline}</strong>, your own submission will be automatically disqualified from the contest. This ensures fairness for all participants.
                </p>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${dashboardUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #F57C00; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    Complete Your Reviews Now
                  </a>
                </div>
                
                <div style="background: #F3F3EF; border-radius: 6px; padding: 15px; margin-top: 30px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #222; font-weight: 600;">
                    Need Help?
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    If you're having trouble completing your reviews, contact us immediately at support@fraternaladmonition.com
                  </p>
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
    console.error("Error sending peer review deadline warning email:", error);
    return { success: false, error };
  }
}

/**
 * Send disqualification notice email
 * Requirements: 22.3
 */
export async function sendPeerReviewDisqualificationEmail(
  email: string,
  submissionData: {
    submission_code: string;
    title: string;
    reviewer_name?: string;
    incomplete_count: number;
    total_count: number;
  }
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `Submission Disqualified - Incomplete Peer Reviews`,
      text: `
SUBMISSION DISQUALIFIED

${submissionData.reviewer_name ? `Hello ${submissionData.reviewer_name},` : 'Hello,'}

We regret to inform you that your submission has been disqualified from the contest.

Submission Details:
- Code: ${submissionData.submission_code}
- Title: ${submissionData.title}

Reason for Disqualification:

You did not complete all of your peer review obligations by the deadline. You completed ${submissionData.total_count - submissionData.incomplete_count} out of ${submissionData.total_count} required reviews.

Why This Policy Exists:

The peer review phase depends on all participants fulfilling their review obligations. When reviewers don't complete their assignments, it creates an unfair burden on other participants and delays the contest.

What You Can Do:

While this submission cannot be reinstated, we encourage you to participate in future contests. Please ensure you can commit to completing all review obligations before submitting.

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
                  Fraternal <span style="color: #C19A43;">Admonition</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #C62828; font-family: 'Playfair Display', Georgia, serif;">
                  Submission Disqualified
                </h2>
                
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #444;">
                  ${submissionData.reviewer_name ? `Hello <strong>${submissionData.reviewer_name}</strong>,` : 'Hello,'}
                </p>
                
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #444;">
                  We regret to inform you that your submission has been disqualified from the contest.
                </p>
                
                <h3 style="font-size: 16px; margin: 0 0 15px 0; color: #222;">
                  Submission Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Code</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.submission_code}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Title</td>
                    <td style="padding: 12px 0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.title}</td>
                  </tr>
                </table>
                
                <h3 style="font-size: 16px; margin: 0 0 15px 0; color: #222;">
                  Reason for Disqualification
                </h3>
                
                <div style="background: #FFEBEE; border: 1px solid #EF9A9A; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; color: #C62828;">
                    You did not complete all of your peer review obligations by the deadline.
                  </p>
                  <p style="margin: 0; font-size: 14px; color: #C62828;">
                    You completed <strong>${submissionData.total_count - submissionData.incomplete_count} out of ${submissionData.total_count}</strong> required reviews.
                  </p>
                </div>
                
                <h3 style="font-size: 16px; margin: 0 0 15px 0; color: #222;">
                  Why This Policy Exists
                </h3>
                
                <p style="margin: 0 0 30px 0; font-size: 14px; color: #666;">
                  The peer review phase depends on all participants fulfilling their review obligations. When reviewers don't complete their assignments, it creates an unfair burden on other participants and delays the contest.
                </p>
                
                <h3 style="font-size: 16px; margin: 0 0 15px 0; color: #222;">
                  What You Can Do
                </h3>
                
                <p style="margin: 0 0 30px 0; font-size: 14px; color: #666;">
                  While this submission cannot be reinstated, we encourage you to participate in future contests. Please ensure you can commit to completing all review obligations before submitting.
                </p>
                
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
    console.error("Error sending disqualification email:", error);
    return { success: false, error };
  }
}

/**
 * Send results available notification email
 * Requirements: 22.4
 */
export async function sendPeerReviewResultsAvailableEmail(
  email: string,
  submissionData: {
    submission_code: string;
    title: string;
    author_name?: string;
    peer_score: number;
    rank?: number;
    total_submissions?: number;
  }
) {
  const submissionUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`;

  try {
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Fraternal Admonition <noreply@fraternaladmonition.com>",
      to: email,
      subject: `Peer Review Results Available - ${submissionData.submission_code}`,
      text: `
PEER REVIEW RESULTS AVAILABLE

${submissionData.author_name ? `Hello ${submissionData.author_name},` : 'Hello,'}

Your peer review results are now available!

Submission Details:
- Code: ${submissionData.submission_code}
- Title: ${submissionData.title}
- Peer Score: ${submissionData.peer_score.toFixed(2)} / 5.00
${submissionData.rank && submissionData.total_submissions ? `- Rank: #${submissionData.rank} of ${submissionData.total_submissions}` : ''}

What's Included:

- Overall peer score (average of 4 criteria)
- Breakdown by criterion (Clarity, Argument, Style, Moral Depth)
- Anonymized reviewer comments
- Your ranking among all submissions

View Your Results: ${submissionUrl}

What Happens Next?

The top submissions will advance to the public voting phase. You'll be notified if your submission is selected as a finalist.

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
                  Peer Review Results <span style="color: #FFE082;">Available</span>
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #444;">
                  ${submissionData.author_name ? `Hello <strong>${submissionData.author_name}</strong>,` : 'Hello,'}
                </p>
                
                <p style="margin: 0 0 30px 0; font-size: 16px; color: #444;">
                  Your <strong>peer review results</strong> are now available!
                </p>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  Submission Details
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Code</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.submission_code}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #666; font-size: 14px;">Title</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E0; color: #222; font-size: 14px; text-align: right; font-weight: 500;">${submissionData.title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; ${submissionData.rank ? 'border-bottom: 1px solid #E5E5E0;' : ''} color: #666; font-size: 14px;">Peer Score</td>
                    <td style="padding: 12px 0; ${submissionData.rank ? 'border-bottom: 1px solid #E5E5E0;' : ''} color: #6A1B9A; font-size: 20px; text-align: right; font-weight: bold;">${submissionData.peer_score.toFixed(2)} / 5.00</td>
                  </tr>
                  ${submissionData.rank && submissionData.total_submissions ? `
                  <tr>
                    <td style="padding: 12px 0; color: #666; font-size: 14px;">Rank</td>
                    <td style="padding: 12px 0; color: #C19A43; font-size: 18px; text-align: right; font-weight: bold;">#${submissionData.rank} of ${submissionData.total_submissions}</td>
                  </tr>
                  ` : ''}
                </table>
                
                <h2 style="font-size: 18px; margin: 0 0 15px 0; color: #222; font-family: 'Playfair Display', Georgia, serif;">
                  What's Included
                </h2>
                
                <ul style="margin: 0 0 30px 0; padding-left: 20px; font-size: 14px; color: #666;">
                  <li style="margin-bottom: 8px;">Overall peer score (average of 4 criteria)</li>
                  <li style="margin-bottom: 8px;">Breakdown by criterion (Clarity, Argument, Style, Moral Depth)</li>
                  <li style="margin-bottom: 8px;">Anonymized reviewer comments</li>
                  <li>Your ranking among all submissions</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${submissionUrl}" 
                     style="display: inline-block; padding: 14px 32px; background: #6A1B9A; color: white; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;">
                    View Your Results
                  </a>
                </div>
                
                <div style="background: #F3E5F5; border-radius: 6px; padding: 15px; margin-top: 30px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #222; font-weight: 600;">
                    What Happens Next?
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    The top submissions will advance to the public voting phase. You'll be notified if your submission is selected as a finalist.
                  </p>
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
    console.error("Error sending results available email:", error);
    return { success: false, error };
  }
}
