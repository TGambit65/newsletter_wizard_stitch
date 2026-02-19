import { useState } from 'react';
import { History, X, Clock, RotateCcw, GitCompare, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { sanitizeHtml } from '@/lib/sanitize';

interface GenerationHistoryItem {
  id: string;
  content: string;
  tone?: string;
  timestamp: Date;
  prompt?: string;
}

interface GenerationHistoryProps {
  history: GenerationHistoryItem[];
  currentContent: string;
  onRevert: (item: GenerationHistoryItem) => void;
  onCompare: (item: GenerationHistoryItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function GenerationHistory({
  history,
  currentContent,
  onRevert,
  onCompare,
  isOpen,
  onClose
}: GenerationHistoryProps) {
  const [selectedItem, setSelectedItem] = useState<GenerationHistoryItem | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  if (!isOpen) return null;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getToneLabel = (tone?: string) => {
    const labels: Record<string, string> = {
      formal: 'Formal',
      casual: 'Casual',
      shorter: 'Shorter',
      longer: 'Longer',
    };
    return tone ? labels[tone] || 'Standard' : 'Standard';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 max-w-full bg-white dark:bg-neutral-800 shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-primary-500" />
            Generation History
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-6 text-center">
              <History className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">
                No generation history yet. Generate content with AI to see versions here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className={clsx(
                    'p-4 hover:bg-neutral-50 dark:hover:bg-neutral-750 cursor-pointer transition-colors',
                    selectedItem?.id === item.id && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                  onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-neutral-500">
                          Version {history.length - index}
                        </span>
                        <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded">
                          {getToneLabel(item.tone)}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                        {item.content.replace(/<[^>]*>/g, '').slice(0, 120)}...
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.timestamp)}
                      </p>
                    </div>
                    <ChevronRight className={clsx(
                      'w-4 h-4 text-neutral-400 transition-transform',
                      selectedItem?.id === item.id && 'rotate-90'
                    )} />
                  </div>

                  {/* Expanded actions */}
                  {selectedItem?.id === item.id && (
                    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRevert(item);
                          onClose();
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revert to this
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCompare(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        Compare
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
          <p className="text-xs text-neutral-500 text-center">
            Showing last {Math.min(history.length, 5)} generations • History retained for 30 days
          </p>
        </div>
      </div>

      {/* Compare Modal */}
      {showCompare && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-primary-500" />
                Compare Versions
              </h3>
              <button
                onClick={() => setShowCompare(false)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 overflow-auto max-h-[60vh]">
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Previous Version</h4>
                <div 
                  className="prose dark:prose-invert prose-sm max-w-none p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedItem.content) }}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Current Version</h4>
                <div
                  className="prose dark:prose-invert prose-sm max-w-none p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentContent) }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setShowCompare(false)}
                className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onRevert(selectedItem);
                  setShowCompare(false);
                  onClose();
                }}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Use Previous Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
