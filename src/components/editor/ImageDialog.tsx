"use client";

import { useState } from "react";

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, alt: string, alignment: string, width: string) => void;
}

export default function ImageDialog({
  isOpen,
  onClose,
  onInsert,
}: ImageDialogProps) {
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('upload');
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [alignment, setAlignment] = useState("center");
  const [width, setWidth] = useState("100");
  const [preview, setPreview] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', alt);
    
    try {
      const response = await fetch('/api/admin/cms/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        onInsert(data.url, alt, alignment, width);
        resetForm();
        onClose();
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error);
    }
    setUploading(false);
  };

  const handleInsert = () => {
    if (uploadMode === 'upload') {
      handleUpload();
    } else if (url) {
      onInsert(url, alt, alignment, width);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setUrl("");
    setAlt("");
    setAlignment("center");
    setWidth("100");
    setPreview(false);
    setFile(null);
    setUploadMode('upload');
  };

  const handlePreview = () => {
    setPreview(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL for uploaded file
      const previewUrl = URL.createObjectURL(selectedFile);
      setUrl(previewUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-serif text-[#222] mb-4">Insert Image</h2>

        {/* Mode Toggle */}
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setUploadMode('upload')}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                uploadMode === 'upload'
                  ? "bg-[#004D40] text-white border-[#004D40]"
                  : "bg-white text-[#444] border-[#E5E5E0]"
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                uploadMode === 'url'
                  ? "bg-[#004D40] text-white border-[#004D40]"
                  : "bg-white text-[#444] border-[#E5E5E0]"
              }`}
            >
              From URL
            </button>
          </div>
        </div>

        {/* File Upload */}
        {uploadMode === 'upload' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#222] mb-2">
              Select Image File *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
            />
            {file && (
              <p className="text-sm text-[#666] mt-1">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        )}

        {/* URL Input */}
        {uploadMode === 'url' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#222] mb-2">
              Image URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
            />
          </div>
        )}

        {/* Alt Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Alt Text (for accessibility)
          </label>
          <input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Description of the image"
            className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004D40]"
          />
        </div>

        {/* Width Slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Width: {width}%
          </label>
          <input
            type="range"
            min="25"
            max="100"
            step="5"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full h-2 bg-[#E5E5E0] rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-[#666] mt-1">
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Alignment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#222] mb-2">
            Alignment
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAlignment("left")}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                alignment === "left"
                  ? "bg-[#004D40] text-white border-[#004D40]"
                  : "bg-white text-[#444] border-[#E5E5E0]"
              }`}
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => setAlignment("center")}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                alignment === "center"
                  ? "bg-[#004D40] text-white border-[#004D40]"
                  : "bg-white text-[#444] border-[#E5E5E0]"
              }`}
            >
              Center
            </button>
            <button
              type="button"
              onClick={() => setAlignment("right")}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                alignment === "right"
                  ? "bg-[#004D40] text-white border-[#004D40]"
                  : "bg-white text-[#444] border-[#E5E5E0]"
              }`}
            >
              Right
            </button>
          </div>
        </div>

        {/* Preview */}
        {url && preview && (
          <div className="mb-4 p-4 bg-[#F9F9F7] rounded-lg">
            <p className="text-sm font-medium text-[#222] mb-2">Preview:</p>
            <div
              className={`flex ${
                alignment === "center"
                  ? "justify-center"
                  : alignment === "right"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <img
                src={url}
                alt={alt || "Preview"}
                style={{ width: `${width}%` }}
                className="rounded-lg max-w-full"
                onError={() => setPreview(false)}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!url}
            className="px-6 py-2 border border-[#E5E5E0] rounded-lg text-[#222] hover:bg-[#F9F9F7] transition-colors disabled:opacity-50"
          >
            Preview
          </button>
          <div className="flex gap-3">
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
              disabled={uploadMode === 'upload' ? !file : !url}
              className="px-6 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {uploading ? 'Uploading...' : 'Insert Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
