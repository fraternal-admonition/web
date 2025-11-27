"use client";

import { useState } from "react";

interface SocialEmbedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (embedCode: string) => void;
}

export default function SocialEmbedDialog({
  isOpen,
  onClose,
  onInsert,
}: SocialEmbedDialogProps) {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<'twitter' | 'instagram' | 'youtube' | 'tiktok' | null>(null);

  const detectPlatform = (inputUrl: string) => {
    if (inputUrl.includes('twitter.com') || inputUrl.includes('x.com')) {
      return 'twitter';
    } else if (inputUrl.includes('instagram.com')) {
      return 'instagram';
    } else if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      return 'youtube';
    } else if (inputUrl.includes('tiktok.com')) {
      return 'tiktok';
    }
    return null;
  };

  const handleUrlChange = (inputUrl: string) => {
    setUrl(inputUrl);
    setPlatform(detectPlatform(inputUrl));
  };

  const generateEmbedCode = () => {
    if (!url || !platform) return '';

    switch (platform) {
      case 'twitter':
        // Extract tweet ID from URL
        const tweetMatch = url.match(/status\/(\d+)/);
        if (tweetMatch) {
          return url; // Just return the URL for now, we'll handle embedding differently
        }
        break;
      
      case 'instagram':
        // Instagram embed - return URL for iframe handling
        return url;
      
      case 'youtube':
        // Extract video ID and create iframe URL
        const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (youtubeMatch) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
        break;
      
      case 'tiktok':
        // TikTok embed - return URL
        return url;
    }
    
    return '';
  };

  const handleInsert = () => {
    const embedCode = generateEmbedCode();
    if (embedCode) {
      onInsert(embedCode);
      setUrl("");
      setPlatform(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-serif text-[#222] mb-4">Embed Social Media</h2>

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Social Media URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://twitter.com/user/status/123... or https://instagram.com/p/..."
            className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
            autoFocus
          />
        </div>

        {/* Platform Detection */}
        {platform && (
          <div className="mb-4 p-3 bg-[#F0F8F7] border border-[#C8E6C9] rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-[#2E7D32]">
                Detected: {platform.charAt(0).toUpperCase() + platform.slice(1)} post
              </span>
            </div>
          </div>
        )}

        {/* Supported Platforms */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[#222] mb-2">Supported Platforms:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#666]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#1DA1F2] rounded-full"></span>
              Twitter/X posts
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#E4405F] rounded-full"></span>
              Instagram posts
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FF0000] rounded-full"></span>
              YouTube videos
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#000000] rounded-full"></span>
              TikTok videos
            </div>
          </div>
        </div>

        {/* Preview */}
        {url && platform && (
          <div className="mb-6 p-4 bg-[#F9F9F7] rounded-lg">
            <p className="text-sm font-medium text-[#222] mb-2">Preview:</p>
            <div className="bg-white border border-[#E5E5E0] rounded p-4 text-center">
              <div className="text-[#666] text-sm">
                {platform.charAt(0).toUpperCase() + platform.slice(1)} embed will appear here
              </div>
              <div className="text-xs text-[#999] mt-1">
                Actual embed will load after insertion
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-[#E5E5E0] rounded-lg text-[#222] hover:bg-[#F9F9F7] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!url || !platform}
            className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:opacity-50"
          >
            Insert Embed
          </button>
        </div>
      </div>
    </div>
  );
}
