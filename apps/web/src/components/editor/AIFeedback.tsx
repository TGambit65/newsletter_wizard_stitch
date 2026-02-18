import { useState } from 'react';
import { ThumbsUp, ThumbsDown, RefreshCw, ChevronDown, MessageSquare, X } from 'lucide-react';
import clsx from 'clsx';

interface AIFeedbackProps {
  generationId?: string;
  onRegenerate: (tone?: string) => void;
  onFeedback: (rating: 'up' | 'down', comment?: string) => void;
  isRegenerating?: boolean;
  disabled?: boolean;
}

const TONE_OPTIONS = [
  { value: 'same', label: 'Try again', description: 'Regenerate with same prompt' },
  { value: 'formal', label: 'More formal', description: 'Professional and polished' },
  { value: 'casual', label: 'More casual', description: 'Friendly and conversational' },
  { value: 'shorter', label: 'Shorter', description: 'Concise and to the point' },
  { value: 'longer', label: 'Longer', description: 'More detailed and expanded' },
];

export function AIFeedback({ 
  generationId, 
  onRegenerate, 
  onFeedback, 
  isRegenerating = false,
  disabled = false 
}: AIFeedbackProps) {
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const handleThumbsUp = () => {
    onFeedback('up');
    setFeedbackGiven('up');
  };

  const handleThumbsDown = () => {
    setShowFeedbackModal(true);
  };

  const submitNegativeFeedback = () => {
    onFeedback('down', feedbackComment);
    setFeedbackGiven('down');
    setShowFeedbackModal(false);
    setFeedbackComment('');
  };

  const handleRegenerate = (tone?: string) => {
    onRegenerate(tone);
    setShowToneDropdown(false);
    setFeedbackGiven(null);
  };

  if (disabled) return null;

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
      {/* Feedback buttons */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-neutral-500 mr-1">Was this helpful?</span>
        <button
          onClick={handleThumbsUp}
          disabled={feedbackGiven !== null}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            feedbackGiven === 'up' 
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500',
            feedbackGiven !== null && feedbackGiven !== 'up' && 'opacity-50 cursor-not-allowed'
          )}
          title="Good response"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleThumbsDown}
          disabled={feedbackGiven !== null}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            feedbackGiven === 'down'
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500',
            feedbackGiven !== null && feedbackGiven !== 'down' && 'opacity-50 cursor-not-allowed'
          )}
          title="Could be better"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />

      {/* Regenerate dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowToneDropdown(!showToneDropdown)}
          disabled={isRegenerating}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors',
            'bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30',
            isRegenerating && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isRegenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Regenerate
          <ChevronDown className="w-3 h-3" />
        </button>

        {showToneDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowToneDropdown(false)} 
            />
            <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-20">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRegenerate(option.value === 'same' ? undefined : option.value)}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                    {option.label}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                What could be better?
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Tell us what was wrong with the response... (optional)"
                rows={3}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitNegativeFeedback}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
