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
