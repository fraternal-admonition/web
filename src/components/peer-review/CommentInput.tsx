'use client';

import { MessageSquare } from 'lucide-react';

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
}

export default function CommentInput({
  value,
  onChange,
  maxLength,
  placeholder = 'Brief feedback for the author (max 100 characters)',
}: CommentInputProps) {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining <= 20;
  const isAtLimit = remaining === 0;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-[#222] mb-1 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comment for Author
        </h3>
        <p className="text-sm text-[#666]">
          Provide brief, constructive feedback (required)
        </p>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={3}
          className={`w-full px-4 py-3 border-2 rounded-lg resize-none focus:outline-none transition-colors ${
            value.trim().length === 0
              ? 'border-[#E5E5E0] focus:border-[#6A1B9A]'
              : isAtLimit
              ? 'border-red-300 focus:border-red-500'
              : isNearLimit
              ? 'border-yellow-300 focus:border-yellow-500'
              : 'border-[#C19A43] focus:border-[#6A1B9A]'
          }`}
          required
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isAtLimit
                ? 'text-red-600'
                : isNearLimit
                ? 'text-yellow-600'
                : 'text-[#888]'
            }`}
          >
            {remaining} characters remaining
          </span>
        </div>
      </div>

      {value.trim().length === 0 && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          <span>Comment is required before submitting</span>
        </p>
      )}
    </div>
  );
}
