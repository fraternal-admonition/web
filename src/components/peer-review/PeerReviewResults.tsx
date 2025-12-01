'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Star,
    Award,
    MessageSquare,
    TrendingUp,
    Sparkles,
    BookOpen,
    Feather,
    Heart
} from 'lucide-react';

interface PeerReviewResultsProps {
    peerScore: number;
    criterionMeans: {
        clarity: number;
        argument: number;
        style: number;
        moral_depth: number;
    };
    reviewCount: number;
    rank?: number;
    totalSubmissions?: number;
    comments: string[];
}

export default function PeerReviewResults({
    peerScore,
    criterionMeans,
    reviewCount,
    rank,
    totalSubmissions,
    comments
}: PeerReviewResultsProps) {
    // Calculate percentage for visual display
    const scorePercentage = (peerScore / 5) * 100;

    // Determine score color based on value
    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'from-emerald-400 to-green-500';
        if (score >= 4.0) return 'from-blue-400 to-indigo-500';
        if (score >= 3.5) return 'from-purple-400 to-pink-500';
        if (score >= 3.0) return 'from-yellow-400 to-orange-500';
        return 'from-orange-400 to-red-500';
    };

    const criteria = [
        {
            key: 'clarity',
            label: 'Clarity',
            description: 'How clear and understandable is the writing',
            icon: BookOpen,
            score: criterionMeans.clarity
        },
        {
            key: 'argument',
            label: 'Argument',
            description: 'Strength and support of the argument',
            icon: TrendingUp,
            score: criterionMeans.argument
        },
        {
            key: 'style',
            label: 'Style',
            description: 'Engagement and effectiveness of writing style',
            icon: Feather,
            score: criterionMeans.style
        },
        {
            key: 'moral_depth',
            label: 'Moral Depth',
            description: 'Profundity of moral or philosophical insight',
            icon: Heart,
            score: criterionMeans.moral_depth
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-4"
            >
                <div className="flex items-center justify-center gap-3">
                    <Award className="w-8 h-8 text-[#C19A43]" />
                    <h2 className="text-4xl font-serif font-bold text-[#222]">
                        Peer Review Results
                    </h2>
                    <Sparkles className="w-8 h-8 text-[#C19A43]" />
                </div>
                <div className="flex items-center justify-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#C19A43]" />
                    <div className="w-16 h-[2px] bg-gradient-to-r from-[#C19A43] to-[#004D40] rounded-full" />
                    <div className="w-2 h-2 rounded-full bg-[#004D40]" />
                </div>
            </motion.div>

            {/* Overall Score Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
            >
                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#C19A43]/20 via-transparent to-[#004D40]/20 rounded-3xl blur-xl" />
                    <Card className="relative bg-white/90 backdrop-blur-md border-2 border-[#E5E5E0]/50 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
                        <div className={`h-2 bg-gradient-to-r ${getScoreColor(peerScore)}`} />
                        <div className="p-8 md:p-12">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                {/* Score Display */}
                                <div className="relative">
                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#F9F9F7] to-[#F5F3F0] flex items-center justify-center border-4 border-[#E5E5E0]/50">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-[#222]">
                                                {peerScore.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-[#666] font-medium">out of 5.00</div>
                                        </div>
                                    </div>
                                    <motion.div
                                        className={`absolute -inset-2 rounded-full border-3 bg-gradient-to-r ${getScoreColor(peerScore)} opacity-20`}
                                        animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.3, 0.2] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    />
                                </div>

                                {/* Stats */}
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-2xl font-serif font-bold text-[#222]">
                                        Overall Peer Score
                                    </h3>
                                    <p className="text-[#666] leading-relaxed">
                                        Your submission received {reviewCount} peer {reviewCount === 1 ? 'review' : 'reviews'} from fellow contestants.
                                        {reviewCount >= 5 && ' Scores were calculated using trimmed mean to remove outliers.'}
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-[#F9F9F7] rounded-full">
                                            <Star className="w-5 h-5 text-[#C19A43]" />
                                            <span className="text-sm font-medium text-[#222]">
                                                {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
                                            </span>
                                        </div>
                                        {rank && totalSubmissions && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F9F9F7] rounded-full">
                                                <Award className="w-5 h-5 text-[#004D40]" />
                                                <span className="text-sm font-medium text-[#222]">
                                                    Rank {rank} of {totalSubmissions}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </motion.div>

            {/* Criteria Breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
            >
                <h3 className="text-2xl font-serif font-bold text-[#222] text-center mb-6">
                    Criteria Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {criteria.map((criterion, index) => (
                        <motion.div
                            key={criterion.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                        >
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-[#E5E5E0]/50 hover:bg-white/90 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#F9F9F7] to-[#F5F3F0] flex items-center justify-center">
                                        <criterion.icon className="w-6 h-6 text-[#222]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-lg font-semibold text-[#222]">
                                                {criterion.label}
                                            </h4>
                                            <Badge className="bg-gradient-to-r from-[#C19A43] to-[#B8914A] text-white font-bold">
                                                {criterion.score.toFixed(2)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-[#666] mb-3">
                                            {criterion.description}
                                        </p>
                                        {/* Score Bar */}
                                        <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full bg-gradient-to-r ${getScoreColor(criterion.score)} rounded-full`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(criterion.score / 5) * 100}%` }}
                                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Reviewer Comments */}
            {comments.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <MessageSquare className="w-6 h-6 text-[#C19A43]" />
                        <h3 className="text-2xl font-serif font-bold text-[#222]">
                            Reviewer Feedback
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {comments.map((comment, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                            >
                                <Card className="p-6 bg-white/80 backdrop-blur-sm border border-[#E5E5E0]/50">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#C19A43]/20 to-[#004D40]/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-[#222]">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-[#999] font-medium mb-2">
                                                Reviewer {index + 1}
                                            </div>
                                            <p className="text-[#222] leading-relaxed">
                                                {comment}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
