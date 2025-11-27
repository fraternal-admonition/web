'use client';

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
}

export default function CommentInput({ 
  value, 
  onChange, 
  maxLength = 100,
  disabled = false,
  error 
}: CommentInputProps) {
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="w-full">
      <label htmlFor="comment" className="block text-sm font-medium text-[#222] mb-2">
        Brief Explanation * (max {maxLength} characters)
      </label>
      
      <textarea
        id="comment"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={3}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-colors ${
          error 
            ? 'border-[#C62828] focus:ring-[#C62828]' 
            : 'border-[#E5E5E0] focus:ring-[#6A1B9A]'
        } ${disabled ? 'bg-[#F5F5F5] cursor-not-allowed' : 'bg-white'}`}
        placeholder="Provide a brief explanation for your decision..."
        required
      />
      
      <div className="flex justify-between items-center mt-2">
        <p className="text-xs text-[#666]">
          Be concise and specific about your reasoning
        </p>
        <p className={`text-xs font-medium ${
          isOverLimit 
            ? 'text-[#C62828]' 
            : isNearLimit 
            ? 'text-[#F57C00]' 
            : 'text-[#666]'
        }`}>
          {characterCount}/{maxLength}
        </p>
      </div>
      
      {error && (
        <p className="text-sm text-[#C62828] mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
