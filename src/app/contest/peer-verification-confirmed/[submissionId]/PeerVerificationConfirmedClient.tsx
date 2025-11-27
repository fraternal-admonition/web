'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Clock, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function PeerVerificationConfirmedClient({ submission }: { submission: any }) {
    // Clean URL on mount (remove session_id)
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('session_id')) {
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F9F9F7] via-[#FFFFFF] to-[#F5F3F0] pt-20 pb-20 px-4 relative overflow-hidden">
            {/* Sophisticated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Success Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="mb-12"
                >
                    <div className="relative">
                        <div className="absolute -inset-6 bg-gradient-to-r from-emerald-400/20 via-transparent to-green-500/20 rounded-3xl blur-2xl" />
                        <Card className="relative bg-white/90 backdrop-blur-md border-2 border-emerald-200 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(16,185,129,0.15)]">
                            <div className="h-2 bg-gradient-to-r from-emerald-400 to-green-500" />
                            <div className="p-10">
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
                                        <h1 className="text-4xl font-serif font-bold text-[#222] mb-2">
                                            Peer Verification Requested
                                        </h1>
                                        <p className="text-lg text-[#666] leading-relaxed">
                                            Your payment has been processed successfully. Your submission will now be reviewed by fellow contestants.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </motion.div>

                {/* Submission Details */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-12"
                >
                    <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                        <div className="h-2 bg-gradient-to-r from-[#C19A43] to-[#B8914A]" />
                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C19A43] to-[#B8914A] flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-[#222]">
                                    Submission Details
                                </h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-[#F9F9F7] rounded-2xl">
                                    <span className="text-[#666] font-medium">Submission Code</span>
                                    <span className="font-mono font-bold text-[#222] bg-white px-4 py-2 rounded-full">
                                        {submission.submission_code}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-[#F9F9F7] rounded-2xl">
                                    <span className="text-[#666] font-medium">Title</span>
                                    <span className="font-semibold text-[#222]">
                                        {submission.title}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-[#F9F9F7] rounded-2xl">
                                    <span className="text-[#666] font-medium">Status</span>
                                    <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm">
                                        Peer Verification Pending
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* What Happens Next */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mb-12"
                >
                    <Card className="bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                        <div className="h-2 bg-gradient-to-r from-[#004D40] to-[#006B5D]" />
                        <div className="p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#004D40] to-[#006B5D] flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-3xl font-serif font-bold text-[#222]">
                                    What Happens Next
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {[
                                    {
                                        icon: Users,
                                        title: 'Peer Review Assignment',
                                        description: 'Your submission will be assigned to 10 fellow contestants for blind review. They will not know whether the AI approved or eliminated your work.',
                                    },
                                    {
                                        icon: FileText,
                                        title: 'Independent Evaluation',
                                        description: 'Each reviewer will independently assess your letter based on the contest criteria, without knowing the AI\'s decision.',
                                    },
                                    {
                                        icon: CheckCircle,
                                        title: 'Results & Notification',
                                        description: 'Once all reviews are complete, you\'ll receive an email with the peer verification results and next steps.',
                                    },
                                ].map((step, index) => (
                                    <motion.div
                                        key={step.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                                        className="flex items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-white to-[#F9F9F7] border border-[#E5E5E0]/50"
                                    >
                                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#004D40]/10 to-[#C19A43]/10 flex items-center justify-center">
                                            <step.icon className="w-7 h-7 text-[#004D40]" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-[#222] mb-2">
                                                {step.title}
                                            </h3>
                                            <p className="text-[#666] leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link href="/dashboard">
                        <Button className="w-full sm:w-auto bg-gradient-to-r from-[#004D40] to-[#006B5D] hover:from-[#006B5D] hover:to-[#004D40] text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3">
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href={`/contest/screening-results/${submission.id}`}>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto border-2 border-[#004D40] text-[#004D40] hover:bg-[#004D40] hover:text-white px-8 py-6 rounded-2xl text-lg font-semibold transition-all duration-300 flex items-center justify-center"
                        >
                            View Screening Results
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
