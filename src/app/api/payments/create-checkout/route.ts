import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PaymentIntentSchema } from "@/lib/security/validators";
import Stripe from "stripe";
import { rateLimiter } from "@/lib/security/rate-limit";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limiting: 10 payment attempts per hour per user
    const rateLimitResult = await rateLimiter.checkLimit(
      `payment:${user.id}`,
      10,
      60 * 60 * 1000 // 1 hour
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Get request body
    const body = await request.json();

    // Validate input
    const validation = PaymentIntentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { submission_id } = validation.data;

    // Fetch submission and verify ownership
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select(`
        *,
        contest:contests(
          id,
          title,
          submissions_close_at
        )
      `)
      .eq("id", submission_id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (submission.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to pay for this submission" },
        { status: 403 }
      );
    }

    // Verify status is PENDING_PAYMENT
    if (submission.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "This submission has already been paid for or is not eligible for payment" },
        { status: 400 }
      );
    }

    // Check if deadline has passed
    const deadline = submission.contest?.submissions_close_at;
    if (deadline && new Date() >= new Date(deadline)) {
      return NextResponse.json(
        { error: "The submission deadline has passed" },
        { status: 400 }
      );
    }

    // Create payment record with status CREATED
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        submission_id: submission_id,
        provider: "STRIPE",
        purpose: "ENTRY_FEE",
        amount: 7.00,
        currency: "USD",
        status: "CREATED",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("[API] Error creating payment record:", paymentError);
      throw paymentError;
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Contest Entry Fee",
              description: `${submission.contest?.title} - Submission ${submission.submission_code}`,
            },
            unit_amount: 700, // $7.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/contest/screening-results/${submission_id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/contest/payment/${submission_id}?canceled=true`,
      client_reference_id: submission_id,
      customer_email: user.email,
      metadata: {
        submission_id: submission_id,
        user_id: user.id,
        payment_id: payment.id,
        submission_code: submission.submission_code,
      },
    });

    // Update payment record with Stripe session ID
    await supabase
      .from("payments")
      .update({
        external_ref: session.id,
      })
      .eq("id", payment.id);

    console.log(
      `[API] Stripe checkout session created: ${session.id} for submission ${submission.submission_code}`
    );

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("[API] Error in POST /api/payments/create-checkout:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Payment processing error. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create checkout session. Please try again.",
      },
      { status: 500 }
    );
  }
}
