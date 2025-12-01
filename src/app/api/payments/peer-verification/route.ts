import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
    verifySubmissionOwnership,
    verifyPeerVerificationNotRequested,
    checkPeerVerificationRateLimit,
} from '@/lib/ai-screening/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover',
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const { submission_id } = await request.json();

        if (!submission_id) {
            return NextResponse.json(
                { error: 'submission_id is required' },
                { status: 400 }
            );
        }

        // Security Check 1: Verify submission ownership
        const ownsSubmission = await verifySubmissionOwnership(user.id, submission_id);
        if (!ownsSubmission) {
            console.error(
                `[Peer Verification] User ${user.id} does not own submission ${submission_id}`
            );
            return NextResponse.json(
                { error: 'Submission not found or access denied' },
                { status: 403 }
            );
        }

        // Fetch submission details
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .select('*, ai_screenings(*)')
            .eq('id', submission_id)
            .single();

        if (submissionError || !submission) {
            return NextResponse.json(
                { error: 'Submission not found' },
                { status: 404 }
            );
        }

        // Verify submission status is ELIMINATED
        if (submission.status !== 'ELIMINATED') {
            return NextResponse.json(
                { error: 'Peer verification is only available for eliminated submissions' },
                { status: 400 }
            );
        }

        // Security Check 2: Verify peer verification not already requested
        const notAlreadyRequested = await verifyPeerVerificationNotRequested(submission_id);
        if (!notAlreadyRequested) {
            console.error(
                `[Peer Verification] Already requested for submission ${submission_id}`
            );
            return NextResponse.json(
                { error: 'Peer verification already requested for this submission' },
                { status: 400 }
            );
        }

        // Security Check 3: Rate limiting
        const withinRateLimit = await checkPeerVerificationRateLimit(user.id);
        if (!withinRateLimit) {
            console.error(
                `[Peer Verification] Rate limit exceeded for user ${user.id}`
            );
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Maximum 100 peer verification requests per 24 hours.',
                },
                { status: 429 }
            );
        }

        // Create payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id: user.id,
                submission_id: submission_id,
                provider: 'STRIPE',
                amount: 20.0,
                currency: 'USD',
                purpose: 'PEER_VERIFICATION',
                status: 'CREATED',
            })
            .select()
            .single();

        if (paymentError || !payment) {
            console.error('Error creating payment record:', paymentError);
            return NextResponse.json(
                { error: 'Failed to create payment record' },
                { status: 500 }
            );
        }

        // Get user email
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.id)
            .single();

        const userEmail = profile?.email || user.email;

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Peer Verification Request',
                            description: `Request peer verification for submission ${submission.submission_code}`,
                        },
                        unit_amount: 2000, // $20.00 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/contest/peer-verification-confirmed/${submission_id}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/contest/screening-results/${submission_id}`,
            customer_email: userEmail,
            metadata: {
                payment_id: payment.id,
                submission_id: submission_id,
                user_id: user.id,
                purpose: 'PEER_VERIFICATION',
            },
        });

        // Update payment record with Stripe session ID
        await supabase
            .from('payments')
            .update({ external_ref: session.id })
            .eq('id', payment.id);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Error creating peer verification checkout:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
