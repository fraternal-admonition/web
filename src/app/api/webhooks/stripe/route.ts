import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendSubmissionConfirmationEmail } from "@/lib/email";
import { executeAIScreening } from "@/lib/ai-screening/screening-service";
import { sanitizeForLogging } from "@/lib/ai-screening/security";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("[Webhook] Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const submissionId = session.metadata?.submission_id;
      const paymentId = session.metadata?.payment_id;
      const userId = session.metadata?.user_id;
      const purpose = session.metadata?.purpose;

      if (!submissionId || !paymentId) {
        // Sanitize session data before logging
        const sanitizedSession = sanitizeForLogging(session);
        console.error("[Webhook] Missing metadata in session:", sanitizedSession.id);
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Security: Verify the payment hasn't been processed already (idempotency)
      console.log(`[Webhook] Processing payment ${paymentId} for submission ${submissionId}`);

      console.log(
        `[Webhook] Processing ${purpose || 'SUBMISSION'} payment for submission: ${submissionId}`
      );

      // Use admin client to bypass RLS
      const adminSupabase = await createAdminClient();

      // Check if payment already processed (idempotency)
      const { data: existingPayment } = await adminSupabase
        .from("payments")
        .select("status, purpose")
        .eq("id", paymentId)
        .single();

      if (existingPayment?.status === "PAID") {
        console.log(
          `[Webhook] Payment ${paymentId} already processed, skipping`
        );
        return NextResponse.json({ received: true });
      }

      // Extract payment intent ID from session
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

      // Update payment record to PAID
      const { error: paymentError } = await adminSupabase
        .from("payments")
        .update({
          status: "PAID",
          external_ref: paymentIntentId || session.id, // Use payment_intent if available, fallback to session
        })
        .eq("id", paymentId);

      if (paymentError) {
        console.error("[Webhook] Error updating payment:", paymentError);
        throw paymentError;
      }

      console.log(
        `[Webhook] Updated payment ${paymentId} with payment_intent: ${paymentIntentId}`
      );

      // Handle based on payment purpose
      if (purpose === 'PEER_VERIFICATION') {
        // Handle peer verification payment
        console.log(`[Webhook] Processing peer verification for submission: ${submissionId}`);

        // Update submission status to PEER_VERIFICATION_PENDING
        const { error: submissionError } = await adminSupabase
          .from("submissions")
          .update({
            status: "PEER_VERIFICATION_PENDING",
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId);

        if (submissionError) {
          console.error("[Webhook] Error updating submission for peer verification:", submissionError);
          throw submissionError;
        }

        // Create flag record for peer verification request
        const { error: flagError } = await adminSupabase
          .from("flags")
          .insert({
            entity_type: "SUBMISSION",
            entity_id: submissionId,
            reason: "PEER_VERIFICATION_REQUESTED",
          });

        if (flagError) {
          console.error("[Webhook] Error creating flag for peer verification:", flagError);
          throw flagError;
        }

        console.log(`[Webhook] Peer verification request created for submission: ${submissionId}`);

        // IMMEDIATELY trigger assignment service (don't wait for phase)
        try {
          const { executeImmediateAssignment } = await import("@/lib/peer-verification/immediate-assignment-service");
          const assignmentResult = await executeImmediateAssignment(submissionId);

          if (assignmentResult.success) {
            console.log(
              `[Webhook] Assignment successful: ${assignmentResult.assignedReviewers} reviewers, ` +
              `${assignmentResult.totalAssignments} total assignments`
            );

            if (assignmentResult.warnings.length > 0) {
              console.warn('[Webhook] Assignment warnings:', assignmentResult.warnings);
            }
          } else {
            console.error('[Webhook] Assignment failed:', assignmentResult.errors);
            // Log error but don't fail the webhook - admin can manually assign later
          }
        } catch (assignmentError) {
          console.error('[Webhook] Error executing immediate assignment:', assignmentError);
          // Log error but don't fail the webhook - admin can manually assign later
        }

        // Send peer verification confirmation email
        const { data: submission } = await adminSupabase
          .from("submissions")
          .select("submission_code, title, user_id")
          .eq("id", submissionId)
          .single();

        if (submission && userId) {
          const { data: userData } = await adminSupabase.auth.admin.getUserById(userId);

          if (userData?.user?.email) {
            const { sendPeerVerificationConfirmationEmail } = await import("@/lib/email");
            const emailResult = await sendPeerVerificationConfirmationEmail(
              userData.user.email,
              {
                submission_code: submission.submission_code,
                title: submission.title,
                submission_id: submissionId,
              }
            );

            if (emailResult.success) {
              console.log(`[Webhook] Peer verification email sent to ${userData.user.email}`);
            } else {
              console.error("[Webhook] Failed to send peer verification email:", emailResult.error);
            }
          }
        }

      } else {
        // Handle regular submission payment
        // Update submission status to SUBMITTED and set submitted_at
        const { error: submissionError } = await adminSupabase
          .from("submissions")
          .update({
            status: "SUBMITTED",
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId);

        if (submissionError) {
          console.error("[Webhook] Error updating submission:", submissionError);
          throw submissionError;
        }

        console.log(
          `[Webhook] Successfully processed payment for submission: ${submissionId}`
        );
      }

      // Trigger AI screening only for regular submissions (not peer verification)
      if (purpose !== 'PEER_VERIFICATION') {
        // Execute AI screening asynchronously (don't block webhook)
        // Security checks are performed inside executeAIScreening
        executeAIScreening(submissionId).catch((error) => {
          // Sanitize error before logging
          const sanitizedError = sanitizeForLogging(error);
          console.error('[Webhook] AI screening failed:', sanitizedError);
          // Error is logged but doesn't fail the webhook
          // Submission will be marked for manual review by the screening service
        });

        console.log(`[Webhook] AI screening triggered for submission: ${submissionId}`);
      }

      // Send email only for regular submissions (not peer verification)
      if (purpose !== 'PEER_VERIFICATION') {
        // Fetch submission details for email
        const { data: submission } = await adminSupabase
          .from("submissions")
          .select(`
            submission_code,
            title,
            user_id,
            contests!inner(title)
          `)
          .eq("id", submissionId)
          .single();

        // Fetch user email
        if (submission && userId) {
          const { data: userData } = await adminSupabase.auth.admin.getUserById(
            userId
          );

          if (userData?.user?.email) {
            // Send confirmation email
            const contests = submission.contests as any;
            const contestTitle = Array.isArray(contests)
              ? contests[0]?.title
              : contests?.title || "Letters to Goliath";

            const emailResult = await sendSubmissionConfirmationEmail(
              userData.user.email,
              {
                submission_code: submission.submission_code,
                title: submission.title,
                contest_title: contestTitle,
                amount: 7,
              }
            );

            if (emailResult.success) {
              console.log(
                `[Webhook] Confirmation email sent to ${userData.user.email}`
              );
            } else {
              console.error(
                "[Webhook] Failed to send confirmation email:",
                emailResult.error
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);

    return NextResponse.json(
      {
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
