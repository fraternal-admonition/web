'use client';

import { Star } from 'lucide-react';

interface CriteriaRatingProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function CriteriaRating({
  label,
  description,
  value,
  onChange,
  min = 1,
  max = 5,
}: CriteriaRatingProps) {
  const ratings = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-[#222] mb-1">{label}</h3>
        <p className="text-sm text-[#666]">{description}</p>
      </div>

      <div className="flex items-center gap-2">
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-all ${
              value >= rating
                ? 'border-[#C19A43] bg-[#C19A43] text-white'
                : 'border-[#E5E5E0] bg-white text-[#666] hover:border-[#C19A43] hover:bg-[#FFF9E6]'
            }`}
          >
            <Star
              className={`w-6 h-6 transition-all ${
                value >= rating ? 'fill-current' : ''
              }`}
            />
            <span className="absolute -bottom-6 text-xs font-medium text-[#666]">
              {rating}
            </span>
          </button>
        ))}
      </div>

      {value > 0 && (
        <div className="flex items-center gap-2 text-sm mt-8">
          <span className="text-[#666]">Selected:</span>
          <span className="font-semibold text-[#C19A43]">{value} / {max}</span>
        </div>
      )}
    </div>
  );
}
