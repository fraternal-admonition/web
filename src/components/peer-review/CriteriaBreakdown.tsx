'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface Criterion {
    key: string;
    label: string;
    description: string;
    icon: LucideIcon;
    score: number;
}

interface CriteriaBreakdownProps {
    criteria: Criterion[];
}

export default function CriteriaBreakdown({ criteria }: CriteriaBreakdownProps) {
    // Determine score color based on value
    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'from-emerald-400 to-green-500';
        if (score >= 4.0) return 'from-blue-400 to-indigo-500';
        if (score >= 3.5) return 'from-purple-400 to-pink-500';
        if (score >= 3.0) return 'from-yellow-400 to-orange-500';
        return 'from-orange-400 to-red-500';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criteria.map((criterion, index) => (
                <motion.div
                    key={criterion.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-[#E5E5E0]/50 hover:bg-white/90 transition-all duration-300 h-full">
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
                                        transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
