'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Brain,
    Shield,
    Star,
    Quote,
    Award,
    BookOpen,
    Languages,
    Sparkles,
    Clock,
    Eye,
    Feather,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import PeerVerificationResults from '@/components/peer-verification/PeerVerificationResults';

export default function ScreeningResultsClient({ initialSubmission }: { initialSubmission: any }) {
    const [submission, setSubmission] = useState(initialSubmission);
    const [userChoice, setUserChoice] = useState<string | null>(null);
    const [pollingCount, setPollingCount] = useState(0);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const screening = submission.ai_screenings?.[0];
    const scores = screening?.scores || {};

    const passed = screening?.status === 'PASSED';
    const failed = screening?.status === 'FAILED';
    const review = screening?.status === 'REVIEW';

    // Check if screening exists AND is complete
    const processing = !screening || screening.phase !== 'COMPLETE';

    // Check if moderation failed
    const moderationFailed = scores.moderation?.flagged;

    // Check if peer verification was already requested
    const peerVerificationRequested = submission.status === 'PEER_VERIFICATION_PENDING';

    // Check if elimination was already accepted
    const eliminationAccepted = submission.status === 'ELIMINATED_ACCEPTED';

    // Check if peer verification results exist
    const peerVerificationResult = submission.peer_verification_result;

    // Clean URL on mount (remove session_id)
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('session_id')) {
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    // Poll for screening completion using API instead of page reload
    useEffect(() => {
        if (!processing) {
            console.log('[Polling] Not processing, polling stopped');
            return;
        }

        console.log(`[Polling] Starting poll #${pollingCount + 1}/40`);

        const pollScreening = async () => {
            console.log(`[Polling] Fetching status for submission ${submission.id}...`);
            try {
                const response = await fetch(
                    `/api/submissions/${submission.id}/screening-status`
                );
                console.log(`[Polling] Response status: ${response.status}`);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[Polling] Response data:', {
                        hasAiScreenings: !!data.ai_screenings,
                        screeningsLength: data.ai_screenings?.length,
                        firstScreening: data.ai_screenings?.[0] ? {
                            id: data.ai_screenings[0].id,
                            phase: data.ai_screenings[0].phase,
                            status: data.ai_screenings[0].status,
                        } : null,
                    });

                    // Check if screening is complete
                    const latestScreening = data.ai_screenings?.[0];
                    if (latestScreening && latestScreening.phase === 'COMPLETE') {
                        // Screening complete! Update state
                        console.log('[Polling] ✅ Screening COMPLETE! Updating state and stopping polling');
                        console.log('[Polling] Screening details:', {
                            status: latestScreening.status,
                            phase: latestScreening.phase,
                            hasScores: !!latestScreening.scores,
                        });
                        setSubmission(data);
                    } else {
                        // Still processing, increment counter
                        console.log(`[Polling] ⏳ Still processing... (attempt ${pollingCount + 1}/40)`);
                        if (latestScreening) {
                            console.log('[Polling] Current phase:', latestScreening.phase);
                        } else {
                            console.log('[Polling] No screening record found yet');
                        }
                        setPollingCount((prev) => prev + 1);
                    }
                } else {
                    console.error('[Polling] ❌ API returned error status:', response.status);
                }
            } catch (error) {
                console.error('[Polling] ❌ Fetch error:', error);
            }
        };

        // Poll every 3 seconds, max 40 times (2 minutes)
        if (pollingCount < 40) {
            const interval = setInterval(pollScreening, 3000);
            console.log('[Polling] Interval set, will poll every 3 seconds');
            return () => {
                console.log('[Polling] Cleaning up interval');
                clearInterval(interval);
            };
        } else {
            console.log('[Polling] ⚠️ Max attempts (40) reached, stopping polling');
        }
    }, [processing, submission.id, pollingCount]);

    // Show loading state while AI screening is in progress
    if (processing) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F5F3F0] pt-20 pb-16 px-4 relative overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Floating Orbs */}
                    <motion.div
                        className="absolute top-32 right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#C19A43]/10 to-transparent blur-2xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute bottom-32 left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-[#004D40]/8 to-transparent blur-2xl"
                        animate={{
                            scale: [1, 1.4, 1],
                            x: [0, -25, 0],
                            y: [0, 15, 0],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    />
                    {/* Geometric Patterns */}
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#C19A43]/30 rounded-full"
                        animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    />
                    <motion.div
                        className="absolute top-3/4 right-1/3 w-1 h-1 bg-[#004D40]/40 rounded-full"
                        animate={{
                            scale: [0, 1.5, 0],
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: 2.5 }}
                    />
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Main Loading Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="relative"
                    >
                        {/* Decorative Frame */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#C19A43]/20 via-transparent to-[#004D40]/20 rounded-3xl blur-xl" />
                        <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-[#E5E5E0]/50 overflow-hidden">
                            {/* Top Decorative Border */}
                            <div className="h-2 bg-gradient-to-r from-[#C19A43] via-[#B8914A] to-[#004D40]" />
                            <div className="p-12 md:p-16">
                                {/* Central Loading Animation */}
                                <div className="flex flex-col items-center text-center space-y-12">
                                    {/* Sophisticated Spinner */}
                                    <div className="relative">
                                        {/* Outer Ring */}
                                        <motion.div
                                            className="w-32 h-32 rounded-full border-4 border-[#E5E5E0]"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#C19A43] border-r-[#C19A43]/50" />
                                        </motion.div>
                                        {/* Inner Ring */}
                                        <motion.div
                                            className="absolute inset-4 w-24 h-24 rounded-full border-3 border-[#F0F0F0]"
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <div className="absolute inset-0 rounded-full border-3 border-transparent border-b-[#004D40] border-l-[#004D40]/50" />
                                        </motion.div>
                                        {/* Center Icon */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    rotate: [0, 5, -5, 0]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="w-12 h-12 bg-gradient-to-br from-[#C19A43] to-[#004D40] rounded-full flex items-center justify-center"
                                            >
                                                <Brain className="w-6 h-6 text-white" />
                                            </motion.div>
                                        </div>
                                        {/* Floating Particles */}
                                        {[...Array(6)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-2 h-2 bg-[#C19A43]/60 rounded-full"
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transformOrigin: '0 0',
                                                }}
                                                animate={{
                                                    rotate: [0, 360],
                                                    scale: [0, 1, 0],
                                                }}
                                                transition={{
                                                    duration: 4,
                                                    repeat: Infinity,
                                                    delay: i * 0.5,
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {/* Elegant Typography */}
                                    <div className="space-y-6">
                                        <motion.h1
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3, duration: 0.8 }}
                                            className="text-5xl md:text-6xl font-serif text-[#222] font-bold tracking-tight"
                                        >
                                            Evaluating Your Letter
                                        </motion.h1>
                                        <motion.div
                                            initial={{ opacity: 0, scaleX: 0 }}
                                            animate={{ opacity: 1, scaleX: 1 }}
                                            transition={{ delay: 0.6, duration: 1 }}
                                            className="flex items-center justify-center gap-3"
                                        >
                                            <div className="w-3 h-3 rounded-full bg-[#C19A43]" />
                                            <div className="w-20 h-[3px] bg-gradient-to-r from-[#C19A43] via-[#B8914A] to-[#004D40] rounded-full" />
                                            <div className="w-3 h-3 rounded-full bg-[#004D40]" />
                                        </motion.div>
                                        <motion.p
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.9, duration: 0.8 }}
                                            className="text-xl text-[#666] max-w-2xl mx-auto leading-relaxed"
                                        >
                                            Our sophisticated AI system is meticulously analyzing your submission across multiple dimensions of excellence.
                                        </motion.p>
                                    </div>
                                    {/* Enhanced Progress Steps */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.2, duration: 0.8 }}
                                        className="w-full max-w-2xl space-y-8"
                                    >
                                        {[
                                            {
                                                icon: Shield,
                                                title: 'Content Safety Analysis',
                                                desc: 'Ensuring adherence to community standards and ethical guidelines',
                                                color: 'from-emerald-400 to-green-500',
                                                bgColor: 'bg-emerald-50',
                                                delay: 0,
                                            },
                                            {
                                                icon: Eye,
                                                title: 'Quality & Thematic Evaluation',
                                                desc: 'Assessing literary merit and philosophical alignment with Kantian principles',
                                                color: 'from-blue-400 to-indigo-500',
                                                bgColor: 'bg-blue-50',
                                                delay: 0.2,
                                            },
                                            {
                                                icon: Languages,
                                                title: 'Multi-Language Translation',
                                                desc: 'Crafting precise translations across five European languages',
                                                color: 'from-purple-400 to-pink-500',
                                                bgColor: 'bg-purple-50',
                                                delay: 0.4,
                                            },
                                        ].map((step, index) => (
                                            <motion.div
                                                key={step.title}
                                                initial={{ opacity: 0, x: -30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 1.5 + step.delay, duration: 0.6 }}
                                                className="flex items-start gap-6 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-[#E5E5E0]/50 hover:bg-white/80 transition-all duration-300"
                                            >
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${step.bgColor} flex items-center justify-center relative overflow-hidden`}>
                                                    <motion.div
                                                        className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-20`}
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                            opacity: [0.2, 0.4, 0.2]
                                                        }}
                                                        transition={{
                                                            duration: 3,
                                                            repeat: Infinity,
                                                            delay: index * 0.5,
                                                        }}
                                                    />
                                                    <step.icon className="w-7 h-7 text-[#222] relative z-10" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-[#222] mb-2">
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-[#666] leading-relaxed">
                                                        {step.desc}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                    {/* Time Estimate */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2.5, duration: 0.8 }}
                                        className="pt-8 border-t border-[#E5E5E0]/50 w-full max-w-md"
                                    >
                                        <div className="flex items-center justify-center gap-3 text-[#666]">
                                            <Clock className="w-5 h-5" />
                                            <span className="font-medium">Estimated completion: 30-60 seconds</span>
                                        </div>
                                        <p className="text-sm text-[#999] mt-3 text-center">
                                            Results will appear automatically upon completion
                                        </p>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F5F3F0] pt-20 pb-20 px-4 relative overflow-hidden">
            {/* Sophisticated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Animated Gradient Orbs */}
                <motion.div
                    className="absolute top-32 right-16 w-96 h-96 rounded-full bg-gradient-to-br from-[#C19A43]/8 to-transparent blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, 40, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-32 left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#004D40]/6 to-transparent blur-3xl"
                    animate={{
                        scale: [1, 1.4, 1],
                        x: [0, -35, 0],
                        y: [0, 25, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                />
                {/* Floating Geometric Elements */}
                <motion.div
                    className="absolute top-1/3 left-1/5 w-4 h-4 bg-[#C19A43]/20 rounded-full"
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                />
                <motion.div
                    className="absolute top-2/3 right-1/4 w-2 h-2 bg-[#004D40]/30 rounded-full"
                    animate={{
                        y: [0, 15, 0],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                />
            </div>
            <div className="max-w-6xl mx-auto relative z-10">
                {/* Elegant Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6"
                    >
                        <h1 className="text-5xl md:text-6xl font-serif text-[#222] font-bold tracking-tight">
                            Screening Results
                        </h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-[#C19A43]" />
                            <div className="w-24 h-[3px] bg-gradient-to-r from-[#C19A43] via-[#B8914A] to-[#004D40] rounded-full" />
                            <div className="w-3 h-3 rounded-full bg-[#004D40]" />
                        </div>
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-[#E5E5E0]/50">
                            <Feather className="w-5 h-5 text-[#C19A43]" />
                            <span className="text-[#666] font-medium">Submission Code:</span>
                            <span className="font-mono font-bold text-[#222] bg-[#F9F9F7] px-3 py-1 rounded-full">
                                {submission.submission_code}
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Status Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-12"
                >
                    <div className="relative">
                        {/* Decorative Background */}
                        <div className="absolute -inset-6 bg-gradient-to-r from-[#C19A43]/10 via-transparent to-[#004D40]/10 rounded-3xl blur-2xl" />
                        <Card className="relative bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                            {/* Top Accent */}
                            <div className={`h-2 ${passed ? 'bg-gradient-to-r from-emerald-400 to-green-500' : failed ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`} />
                            <div className="p-10">
                                {passed && (
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                                                <CheckCircle className="w-10 h-10 text-emerald-600" />
                                            </div>
                                            <motion.div
                                                className="absolute -inset-2 rounded-full border-2 border-emerald-200"
                                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-serif font-bold text-[#222] mb-2 flex items-center gap-3">
                                                Congratulations! Your Letter Passed
                                                <Sparkles className="w-6 h-6 text-[#C19A43]" />
                                            </h2>
                                            <p className="text-lg text-[#666] leading-relaxed">
                                                Your submission has successfully passed our AI screening and is now advancing to peer evaluation.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {failed && (
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
                                                <XCircle className="w-10 h-10 text-red-600" />
                                            </div>
                                            <motion.div
                                                className="absolute -inset-2 rounded-full border-2 border-red-200"
                                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-serif font-bold text-[#222] mb-2">
                                                Screening Not Passed
                                            </h2>
                                            <p className="text-lg text-[#666] leading-relaxed mb-4">
                                                Your submission did not meet our screening criteria. Please review the detailed feedback below.
                                            </p>
                                            {/* Failure Reason */}
                                            {scores.evaluation && (
                                                <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
                                                    <h4 className="font-semibold text-[#222] mb-3 flex items-center gap-2">
                                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                                        Reason for Elimination:
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {scores.evaluation.Identity?.Revealed && (
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
                                                                <div>
                                                                    <p className="text-[#222] font-medium">Identity Revealed (Automatic Disqualification)</p>
                                                                    <p className="text-sm text-[#666] mt-1">
                                                                        {scores.evaluation.Identity.Reason}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {scores.evaluation.Language && scores.evaluation.Language !== 'English' && (
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
                                                                <div>
                                                                    <p className="text-[#222] font-medium">
                                                                        Language Requirement Not Met
                                                                    </p>
                                                                    <p className="text-sm text-[#666] mt-1">
                                                                        Detected language: {scores.evaluation.Language}. Only English submissions are accepted.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {scores.evaluation.Goethe?.GScore <= 2.0 && (
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
                                                                <div>
                                                                    <p className="text-[#222] font-medium">
                                                                        Thematic Alignment Score Too Low: {scores.evaluation.Goethe.GScore}/5.0
                                                                    </p>
                                                                    <p className="text-sm text-[#666] mt-1">
                                                                        Must be greater than 2.0/5.0
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {scores.evaluation.Rating?.['Overall Impression'] <= 2.5 && (
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
                                                                <div>
                                                                    <p className="text-[#222] font-medium">
                                                                        Overall Impression Score Too Low: {scores.evaluation.Rating['Overall Impression']}/5.0
                                                                    </p>
                                                                    <p className="text-sm text-[#666] mt-1">
                                                                        Must be greater than 2.5/5.0
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {scores.evaluation.Rating?.['Grammatical Accuracy'] <= 2.0 && (
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-red-600 mt-2" />
                                                                <div>
                                                                    <p className="text-[#222] font-medium">
                                                                        Grammatical Accuracy Score Too Low: {scores.evaluation.Rating['Grammatical Accuracy']}/5.0
                                                                    </p>
                                                                    <p className="text-sm text-[#666] mt-1">
                                                                        Must be greater than 2.0/5.0
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {review && (
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
                                                <AlertCircle className="w-10 h-10 text-yellow-600" />
                                            </div>
                                            <motion.div
                                                className="absolute -inset-2 rounded-full border-2 border-yellow-200"
                                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-serif font-bold text-[#222] mb-2">
                                                Under Manual Review
                                            </h2>
                                            <p className="text-lg text-[#666] leading-relaxed">
                                                Your submission requires additional human review. We'll notify you once the evaluation is complete.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </motion.div>

                {/* Peer Verification Results */}
                {peerVerificationResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <PeerVerificationResults result={peerVerificationResult} />
                    </motion.div>
                )}

                {/* Moderation Results (only if failed) */}
                {moderationFailed && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-red-200 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(239,68,68,0.1)] mb-12">
                            <div className="h-2 bg-gradient-to-r from-red-400 to-rose-500" />
                            <div className="p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-serif font-bold text-[#222]">
                                        Content Policy Violation
                                    </h3>
                                </div>
                                <p className="text-lg text-[#666] mb-6">
                                    Your letter was flagged for the following category:
                                </p>
                                <div className="space-y-3">
                                    {Object.entries(scores.moderation.categories)
                                        .filter(([_, flagged]) => flagged)
                                        .map(([category]) => (
                                            <div
                                                key={category}
                                                className="px-6 py-4 bg-red-50 rounded-2xl text-[#222] font-medium border border-red-100 flex items-center gap-3"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                {category.replace(/\//g, ' / ').replace(/-/g, ' ')}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Evaluation Results (only if moderation passed) */}
                {!moderationFailed && scores.evaluation && (
                    <div className="space-y-12">
                        {/* Rating Scores */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                                <div className="h-2 bg-gradient-to-r from-[#C19A43] to-[#B8914A]" />
                                <div className="p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C19A43] to-[#B8914A] flex items-center justify-center">
                                            <Award className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-serif font-bold text-[#222]">
                                            Evaluation Scores
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(scores.evaluation.Rating).map(([key, value], index) => (
                                            <motion.div
                                                key={key}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                                                className="group"
                                            >
                                                <div className="p-6 bg-gradient-to-br from-white to-[#F9F9F7] rounded-2xl border border-[#E5E5E0]/50 hover:shadow-lg transition-all duration-300">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[#666] font-medium">{key}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl font-bold text-[#222]">
                                                                {value as number}
                                                            </span>
                                                            <span className="text-[#666]">/5.0</span>
                                                        </div>
                                                    </div>
                                                    {/* Score Bar */}
                                                    <div className="mt-4 h-2 bg-[#E5E5E0] rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-gradient-to-r from-[#C19A43] to-[#B8914A] rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${((value as number) / 5) * 100}%` }}
                                                            transition={{ delay: 0.8 + index * 0.1, duration: 1 }}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Goethe Score - Clean Redesign */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                                <div className="h-2 bg-gradient-to-r from-[#004D40] to-[#006B5D]" />
                                <div className="p-10">
                                    {/* Header with Score */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#004D40] to-[#006B5D] flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-serif font-bold text-[#222]">
                                                    Thematic Alignment
                                                </h3>
                                                <p className="text-sm text-[#666] mt-1">Kant's Legacy Score</p>
                                            </div>
                                        </div>

                                        {/* Score Badge */}
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.8, duration: 0.6, type: 'spring' }}
                                            className="relative"
                                        >
                                            <div className="absolute -inset-3 bg-gradient-to-br from-[#004D40]/20 to-[#C19A43]/20 rounded-2xl blur-xl" />
                                            <div className="relative bg-gradient-to-br from-[#004D40] to-[#006B5D] rounded-2xl px-8 py-6 shadow-lg">
                                                <div className="text-center">
                                                    <div className="text-5xl font-bold text-white mb-1">
                                                        {scores.evaluation.Goethe.GScore}
                                                    </div>
                                                    <div className="text-sm text-white/80 font-medium">out of 5.0</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Score Bar */}
                                    <div className="mb-8">
                                        <div className="h-3 bg-[#F0F0F0] rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-[#004D40] via-[#006B5D] to-[#C19A43] rounded-full relative"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(scores.evaluation.Goethe.GScore / 5) * 100}%` }}
                                                transition={{ delay: 1, duration: 1.5, ease: 'easeOut' }}
                                            >
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                    animate={{ x: ['-100%', '200%'] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1.5 }}
                                                />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    <div className="prose prose-lg max-w-none">
                                        <p className="text-[#222] leading-relaxed">
                                            {scores.evaluation.Goethe.Explanation}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Summary & Quote Combined */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {/* Summary */}
                            <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                                <div className="h-2 bg-gradient-to-r from-[#C19A43] to-[#B8914A]" />
                                <div className="p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C19A43] to-[#B8914A] flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-serif font-bold text-[#222]">
                                            AI Summary
                                        </h3>
                                    </div>
                                    <div className="prose prose-lg max-w-none">
                                        <p className="text-[#222] leading-relaxed">
                                            {scores.evaluation.Summary}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                            {/* Quote */}
                            <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                                <div className="h-2 bg-gradient-to-r from-[#004D40] to-[#006B5D]" />
                                <div className="p-8">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004D40] to-[#006B5D] flex items-center justify-center">
                                            <Quote className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-serif font-bold text-[#222]">
                                            Relevant Quote
                                        </h3>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-[#C19A43] to-[#004D40] rounded-full" />
                                        <blockquote className="pl-8 mb-6">
                                            <p className="text-xl italic text-[#222] leading-relaxed font-serif">
                                                "{scores.evaluation.Quote.QText}"
                                            </p>
                                        </blockquote>
                                        <div className="pl-8 space-y-3">
                                            <p className="text-sm text-[#666] font-medium">
                                                — {scores.evaluation.Quote.Reference}
                                            </p>
                                            <p className="text-[#222] leading-relaxed">
                                                {scores.evaluation.Quote.Relevance}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Translations */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1 }}
                        >
                            <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                                <div className="h-2 bg-gradient-to-r from-[#004D40] via-[#C19A43] to-[#004D40]" />
                                <div className="p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#004D40] to-[#006B5D] flex items-center justify-center">
                                            <Languages className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-3xl font-serif font-bold text-[#222]">
                                                Translations
                                            </h3>
                                            <p className="text-[#666] mt-2">
                                                Original language detected:{' '}
                                                <span className="font-semibold text-[#222] bg-[#F9F9F7] px-3 py-1 rounded-full">
                                                    {scores.translations.OLANG?.toUpperCase()}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <Tabs defaultValue="EN" className="w-full">
                                        <TabsList className="bg-gradient-to-r from-[#F9F9F7] to-[#F5F3F0] p-2 rounded-2xl border border-[#E5E5E0]/50 mb-8">
                                            <TabsTrigger value="EN" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl">
                                                🇬🇧 English
                                            </TabsTrigger>
                                            <TabsTrigger value="DE" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl">
                                                🇩🇪 German
                                            </TabsTrigger>
                                            <TabsTrigger value="FR" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl">
                                                🇫🇷 French
                                            </TabsTrigger>
                                            <TabsTrigger value="IT" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl">
                                                🇮🇹 Italian
                                            </TabsTrigger>
                                            <TabsTrigger value="ES" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-xl">
                                                🇪🇸 Spanish
                                            </TabsTrigger>
                                        </TabsList>

                                        {['EN', 'DE', 'FR', 'IT', 'ES'].map((lang) => (
                                            <TabsContent key={lang} value={lang}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4 }}
                                                    className="bg-gradient-to-br from-white to-[#F9F9F7] rounded-2xl p-8 border border-[#E5E5E0]/50"
                                                >
                                                    <div
                                                        className="prose prose-lg max-w-none text-[#222] leading-relaxed"
                                                        dangerouslySetInnerHTML={{
                                                            __html: scores.translations[lang],
                                                        }}
                                                    />
                                                </motion.div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}

                {/* Moderation Results (only if failed) */}
                {moderationFailed && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mb-12"
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-red-200 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(239,68,68,0.1)]">
                            <div className="h-2 bg-gradient-to-r from-red-400 to-rose-500" />
                            <div className="p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-3xl font-serif font-bold text-[#222]">
                                        Content Policy Violation
                                    </h3>
                                </div>
                                <p className="text-lg text-[#666] mb-6">
                                    Your letter was flagged for the following category:
                                </p>
                                <div className="space-y-3">
                                    {Object.entries(scores.moderation.categories)
                                        .filter(([_, flagged]) => flagged)
                                        .map(([category]) => (
                                            <div
                                                key={category}
                                                className="px-6 py-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl text-[#222] font-medium border-2 border-red-100"
                                            >
                                                {category.replace(/\//g, ' / ').replace(/-/g, ' ')}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* User Response Options (only if failed and no choice made and peer verification not requested and elimination not accepted) */}
                {failed && !userChoice && !peerVerificationRequested && !eliminationAccepted && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mb-12"
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                            <div className="h-2 bg-gradient-to-r from-[#C19A43] to-[#004D40]" />
                            <div className="p-10">
                                <h3 className="text-3xl font-serif font-bold mb-8 text-[#222]">
                                    What would you like to do?
                                </h3>

                                <div className="space-y-4">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left h-auto py-6 px-8 border-2 border-[#C19A43] text-[#222] hover:bg-[#C19A43] hover:text-white transition-all duration-300 rounded-2xl group"
                                            onClick={async () => {
                                                setUserChoice('A');
                                                // Update submission status to ELIMINATED_ACCEPTED
                                                try {
                                                    await fetch(`/api/submissions/${submission.id}/accept-elimination`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                    });
                                                } catch (error) {
                                                    console.error('Error accepting elimination:', error);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#C19A43]/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                                                    <CheckCircle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-lg block mb-1">
                                                        I agree with the AI decision
                                                    </span>
                                                    <span className="text-sm opacity-70">
                                                        Accept the evaluation and submit a new letter
                                                    </span>
                                                </div>
                                            </div>
                                        </Button>
                                    </motion.div>

                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left h-auto py-6 px-8 border-2 border-[#004D40] text-[#222] hover:bg-[#004D40] hover:text-white transition-all duration-300 rounded-2xl group"
                                            onClick={() => setUserChoice('B')}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#004D40]/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                                                    <RefreshCw className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-lg block mb-1">
                                                        I disagree with the AI decision
                                                    </span>
                                                    <span className="text-sm opacity-70">
                                                        Request peer verification of this evaluation
                                                    </span>
                                                </div>
                                            </div>
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Elimination Accepted Message (when status is ELIMINATED_ACCEPTED) */}
                {eliminationAccepted && !userChoice && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                            <div className="h-2 bg-gradient-to-r from-[#C19A43] to-[#B8914A]" />
                            <div className="p-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C19A43]/10 to-[#B8914A]/10 flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-[#C19A43]" />
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-[#222]">
                                        Elimination Accepted
                                    </h3>
                                </div>
                                <p className="text-lg text-[#222] mb-6 leading-relaxed">
                                    You have accepted the AI screening decision. You may submit another entry with
                                    closer attention to the contest criteria. Thank you for contributing to
                                    the integrity of this contest.
                                </p>
                                <Link href="/contest/submit">
                                    <Button className="bg-gradient-to-r from-[#C19A43] to-[#B8914A] hover:from-[#B8914A] hover:to-[#C19A43] text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                                        Submit Another Letter
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Option A Response */}
                {userChoice === 'A' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                            <div className="h-2 bg-gradient-to-r from-[#C19A43] to-[#B8914A]" />
                            <div className="p-10">
                                <p className="text-lg text-[#222] mb-6 leading-relaxed">
                                    We're sorry your work was eliminated. You may submit another entry with
                                    closer attention to the contest criteria. Thank you for contributing to
                                    the integrity of this contest.
                                </p>
                                <Link href="/contest/submit">
                                    <Button className="bg-gradient-to-r from-[#C19A43] to-[#B8914A] hover:from-[#B8914A] hover:to-[#C19A43] text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                                        Submit Another Letter
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Option B Sub-choices */}
                {userChoice === 'B' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                            <div className="h-2 bg-gradient-to-r from-[#004D40] to-[#006B5D]" />
                            <div className="p-10">
                                <h3 className="text-3xl font-serif font-bold mb-8 text-[#222]">
                                    Peer Verification Options
                                </h3>

                                <div className="space-y-4">
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left h-auto py-6 px-8 border-2 border-[#E5E5E0] text-[#222] hover:bg-[#F9F9F7] transition-all duration-300 rounded-2xl"
                                            onClick={async () => {
                                                setUserChoice('B1');
                                                // Update submission status to ELIMINATED_ACCEPTED
                                                try {
                                                    await fetch(`/api/submissions/${submission.id}/accept-elimination`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                    });
                                                } catch (error) {
                                                    console.error('Error accepting elimination:', error);
                                                }
                                            }}
                                        >
                                            <span className="font-semibold text-lg">
                                                I will not request peer verification
                                            </span>
                                        </Button>
                                    </motion.div>

                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button
                                            className="w-full justify-start text-left h-auto py-6 px-8 bg-gradient-to-r from-[#004D40] to-[#006B5D] hover:from-[#006B5D] hover:to-[#004D40] text-white transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl"
                                            onClick={() => setUserChoice('B2')}
                                        >
                                            <div>
                                                <span className="font-semibold text-lg block mb-2">
                                                    I want to request peer verification of the AI decision
                                                </span>
                                                <span className="text-sm opacity-90">
                                                    Peer verification: blind review of your work by 10 other contestants.
                                                    Reviewers do not know whether the AI eliminated or approved your work.
                                                </span>
                                            </div>
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Option B1 Response */}
                {userChoice === 'B1' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                            <div className="h-2 bg-gradient-to-r from-[#C19A43] to-[#B8914A]" />
                            <div className="p-10">
                                <p className="text-lg text-[#222] leading-relaxed">
                                    We respect your decision not to request verification. Your entry remains
                                    eliminated but your feedback helps us improve AI fairness.
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Option B2 Payment */}
                {userChoice === 'B2' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-12"
                    >
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                            <div className="h-2 bg-gradient-to-r from-[#004D40] to-[#006B5D]" />
                            <div className="p-10">
                                <h3 className="text-3xl font-serif font-bold mb-6 text-[#222]">
                                    Request Peer Verification
                                </h3>
                                <p className="text-lg text-[#222] mb-8 leading-relaxed">
                                    To activate peer verification, a $20 fee is required.
                                </p>
                                <Button
                                    className="bg-gradient-to-r from-[#004D40] to-[#006B5D] hover:from-[#006B5D] hover:to-[#004D40] text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={async () => {
                                        setIsProcessingPayment(true);
                                        try {
                                            const response = await fetch('/api/payments/peer-verification', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    submission_id: submission.id,
                                                }),
                                            });

                                            const data = await response.json();

                                            if (!response.ok) {
                                                alert(data.error || 'Failed to create payment session');
                                                setIsProcessingPayment(false);
                                                return;
                                            }

                                            // Redirect to Stripe checkout
                                            if (data.url) {
                                                window.location.href = data.url;
                                            }
                                        } catch (error) {
                                            console.error('Error creating payment:', error);
                                            alert('An error occurred. Please try again.');
                                            setIsProcessingPayment(false);
                                        }
                                    }}
                                    disabled={isProcessingPayment}
                                >
                                    {isProcessingPayment ? 'Processing...' : 'Pay $20 for Peer Verification'}
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Peer Verification Pending Message */}
                {peerVerificationRequested && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="mt-12 mb-12"
                    >
                        <div className="relative">
                            {/* Decorative Background */}
                            <div className="absolute -inset-6 bg-gradient-to-r from-yellow-400/10 via-transparent to-orange-500/10 rounded-3xl blur-2xl" />

                            <Card className="relative bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                                <div className="h-2 bg-gradient-to-r from-[#C19A43] via-yellow-500 to-orange-500" />
                                <div className="p-10">
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                        {/* Icon */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center shadow-lg">
                                                <Clock className="w-12 h-12 text-yellow-600" />
                                            </div>
                                            <motion.div
                                                className="absolute -inset-3 rounded-2xl border-2 border-yellow-200"
                                                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#222] mb-3">
                                                Peer Verification In Progress
                                            </h3>
                                            <p className="text-lg text-[#666] leading-relaxed mb-6">
                                                Your submission has been sent for peer review by fellow contestants. You'll receive an email notification once the verification process is complete.
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <Link href={`/contest/peer-verification-confirmed/${submission.id}`}>
                                                    <Button
                                                        className="bg-gradient-to-r from-[#C19A43] to-yellow-600 hover:from-yellow-600 hover:to-[#C19A43] text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                                                    >
                                                        View Details
                                                    </Button>
                                                </Link>
                                                <Link href="/dashboard">
                                                    <Button
                                                        variant="outline"
                                                        className="border-2 border-[#E5E5E0] text-[#666] hover:bg-[#F9F9F7] px-6 py-3 rounded-xl transition-all duration-300"
                                                    >
                                                        Go to Dashboard
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {/* Back to Dashboard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="flex justify-center pt-8"
                >
                    <Link href="/dashboard">
                        <Button className="bg-gradient-to-r from-[#004D40] to-[#006B5D] hover:from-[#006B5D] hover:to-[#004D40] text-white px-10 py-6 rounded-2xl text-lg font-semibold uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3">
                            Return to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
