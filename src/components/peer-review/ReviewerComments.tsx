'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface ReviewerCommentsProps {
    comments: string[];
}

export default function ReviewerComments({ comments }: ReviewerCommentsProps) {
    if (comments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
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
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <Card className="p-6 bg-white/80 backdrop-blur-sm border border-[#E5E5E0]/50 hover:bg-white/90 transition-all duration-300">
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
        </div>
    );
}
