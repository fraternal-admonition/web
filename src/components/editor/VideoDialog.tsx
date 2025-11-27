"use client";

import { useState } from "react";

interface VideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, width: string) => void;
}

export default function VideoDialog({
  isOpen,
  onClose,
  onInsert,
}: VideoDialogProps) {
  const [url, setUrl] = useState("");
  const [width, setWidth] = useState("100");

  const handleInsert = () => {
    if (url) {
      onInsert(url, width);
      setUrl("");
      setWidth("100");
      onClose();
    }
  };

  const getVideoId = (url: string): string | null => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (youtubeMatch) return `youtube:${youtubeMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `vimeo:${vimeoMatch[1]}`;

    return null;
  };

  const renderPreview = () => {
    const videoId = getVideoId(url);
    if (!videoId) return null;

    const [platform, id] = videoId.split(":");

    if (platform === "youtube") {
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${id}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      );
    }

    if (platform === "vimeo") {
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://player.vimeo.com/video/${id}`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-serif text-[#222] mb-4">Insert Video</h2>

        {/* URL Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Video URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
          />
          <p className="mt-1 text-xs text-[#666]">
            Supports YouTube and Vimeo URLs
          </p>
        </div>

        {/* Width Slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Width: {width}%
          </label>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full h-2 bg-[#E5E5E0] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Preview */}
        {url && getVideoId(url) && (
          <div className="mb-4 p-4 bg-[#F9F9F7] rounded-lg">
            <p className="text-sm font-medium text-[#222] mb-2">Preview:</p>
            {renderPreview()}
          </div>
        )}

        {/* Error Message */}
        {url && !getVideoId(url) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Invalid video URL. Please enter a valid YouTube or Vimeo link.
            </p>
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
            disabled={!url || !getVideoId(url)}
            className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:opacity-50"
          >
            Insert Video
          </button>
        </div>
      </div>
    </div>
  );
}
