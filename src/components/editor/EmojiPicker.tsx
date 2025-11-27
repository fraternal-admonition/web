"use client";

import { useState } from "react";
import EmojiPickerReact, { EmojiClickData } from "emoji-picker-react";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (emoji: string) => void;
}

export default function EmojiPicker({
  isOpen,
  onClose,
  onInsert,
}: EmojiPickerProps) {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onInsert(emojiData.emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif text-[#222]">Insert Emoji</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-hidden rounded-lg">
          <EmojiPickerReact
            onEmojiClick={handleEmojiClick}
            width="100%"
            height={400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      </div>
    </div>
  );
}
