"use client";

import { useState, useEffect } from "react";

interface ScreeningDetailsModalProps {
  submissionId: string;
  submissionCode: string;
}

export default function ScreeningDetailsModal({
  submissionId,
  submissionCode,
}: ScreeningDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("EN");

  useEffect(() => {
    if (isOpen && !data) {
      fetchScreeningData();
    }
  }, [isOpen]);

  const fetchScreeningData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`);
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching screening data:", error);
    } finally {
      setLoading(false);
    }
  };

  const screening = data?.ai_screenings?.[0];
  const scores = screening?.scores || {};
  const moderationFailed = scores.moderation?.flagged;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1565C0] text-white rounded-lg hover:bg-[#1976D2] transition-colors font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View Full Details
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[#E5E5E0] sticky top-0 bg-white rounded-t-xl">
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#222] mb-1">
                  Full Screening Results
                </h3>
                <p className="text-sm font-mono text-[#666]">
                  {submissionCode}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#666] hover:text-[#222] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]"></div>
                </div>
              ) : !screening ? (
                <div className="text-center py-12 text-[#666]">
                  No screening data available
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Moderation Results (if failed) */}
                  {moderationFailed && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <h4 className="font-bold text-red-900 mb-2">Content Policy Violation</h4>
                      <p className="text-sm text-red-800 mb-3">Flagged categories:</p>
                      <div className="space-y-1">
                        {Object.entries(scores.moderation.categories)
                          .filter(([_, flagged]) => flagged)
                          .map(([category]) => (
                            <div key={category} className="px-3 py-1 bg-red-100 rounded text-sm text-red-900">
                              {category.replace(/\//g, ' / ').replace(/-/g, ' ')}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Failure Reason (if failed and not moderation) */}
                  {screening?.status === 'FAILED' && !moderationFailed && scores.evaluation && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Reason for Elimination
                      </h4>
                      <div className="space-y-3">
                        {scores.evaluation.Identity?.Revealed && (
                          <div className="bg-white rounded p-3 border border-red-200">
                            <p className="text-sm font-bold text-red-900 mb-1">
                              ❌ Identity Revealed (Automatic Disqualification)
                            </p>
                            <p className="text-xs text-red-800">
                              {scores.evaluation.Identity.Reason}
                            </p>
                          </div>
                        )}
                        {scores.evaluation.Goethe?.GScore < 2.0 && (
                          <div className="bg-white rounded p-3 border border-red-200">
                            <p className="text-sm font-bold text-red-900 mb-1">
                              ❌ Thematic Alignment Score Too Low: {scores.evaluation.Goethe.GScore}/5.0
                            </p>
                            <p className="text-xs text-red-800">
                              Minimum required: 2.0/5.0
                            </p>
                          </div>
                        )}
                        {scores.evaluation.Rating?.['Overall Impression'] < 2.5 && (
                          <div className="bg-white rounded p-3 border border-red-200">
                            <p className="text-sm font-bold text-red-900 mb-1">
                              ❌ Overall Impression Score Too Low: {scores.evaluation.Rating['Overall Impression']}/5.0
                            </p>
                            <p className="text-xs text-red-800">
                              Minimum required: 2.5/5.0
                            </p>
                          </div>
                        )}
                        {scores.evaluation.Rating?.['Grammatical Accuracy'] < 2.0 && (
                          <div className="bg-white rounded p-3 border border-red-200">
                            <p className="text-sm font-bold text-red-900 mb-1">
                              ❌ Grammatical Accuracy Score Too Low: {scores.evaluation.Rating['Grammatical Accuracy']}/5.0
                            </p>
                            <p className="text-xs text-red-800">
                              Minimum required: 2.0/5.0
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Evaluation Scores */}
                  {!moderationFailed && scores.evaluation && (
                    <>
                      {/* Rating Scores */}
                      <div className="bg-[#F9F9F7] rounded-lg p-4">
                        <h4 className="font-bold text-[#222] mb-3 text-sm">Evaluation Scores</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(scores.evaluation.Rating).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <span className="text-[#666]">{key}</span>
                              <span className="font-bold text-[#222]">{String(value)}/5.0</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Goethe Score */}
                      <div className="bg-[#F9F9F7] rounded-lg p-4">
                        <h4 className="font-bold text-[#222] mb-2 text-sm">Kant's Legacy Score</h4>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-[#222]">
                            {scores.evaluation.Goethe.GScore}/5.0
                          </span>
                        </div>
                        <p className="text-sm text-[#666]">{scores.evaluation.Goethe.Explanation}</p>
                      </div>

                      {/* Summary */}
                      <div className="bg-[#F9F9F7] rounded-lg p-4">
                        <h4 className="font-bold text-[#222] mb-2 text-sm">Summary</h4>
                        <p className="text-sm text-[#666]">{scores.evaluation.Summary}</p>
                      </div>

                      {/* Quote */}
                      <div className="bg-[#F9F9F7] rounded-lg p-4">
                        <h4 className="font-bold text-[#222] mb-2 text-sm">Relevant Quote</h4>
                        <blockquote className="border-l-4 border-[#C19A43] pl-3 italic text-sm text-[#666] mb-2">
                          {scores.evaluation.Quote.QText}
                        </blockquote>
                        <p className="text-xs text-[#888] mb-1">— {scores.evaluation.Quote.Reference}</p>
                        <p className="text-sm text-[#666]">{scores.evaluation.Quote.Relevance}</p>
                      </div>
                    </>
                  )}

                  {/* Translations */}
                  {!moderationFailed && scores.translations && (
                    <div className="bg-[#F9F9F7] rounded-lg p-4">
                      <h4 className="font-bold text-[#222] mb-3 text-sm">
                        Translations
                        <span className="ml-2 text-xs font-normal text-[#666]">
                          (Original: {scores.translations.OLANG})
                        </span>
                      </h4>
                      
                      {/* Tabs */}
                      <div className="flex gap-2 mb-4 border-b border-[#E5E5E0]">
                        {['EN', 'DE', 'FR', 'IT', 'ES'].map(lang => (
                          <button
                            key={lang}
                            onClick={() => setActiveTab(lang)}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${
                              activeTab === lang
                                ? 'text-[#1565C0] border-b-2 border-[#1565C0]'
                                : 'text-[#666] hover:text-[#222]'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>

                      {/* Translation Content */}
                      <div 
                        className="prose prose-sm max-w-none text-[#222]"
                        dangerouslySetInnerHTML={{ __html: scores.translations[activeTab] }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E5E5E0] bg-[#F9F9F7] rounded-b-xl">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-[#004D40] text-white rounded-lg hover:bg-[#00695C] transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
