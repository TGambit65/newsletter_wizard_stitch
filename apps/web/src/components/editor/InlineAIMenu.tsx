import { useState, useEffect, useRef } from 'react';
import { Sparkles, Wand2, FileText, Expand, Lightbulb, X } from 'lucide-react';
import clsx from 'clsx';

interface InlineAIMenuProps {
  selectedText: string;
  position: { top: number; left: number } | null;
  onImprove: (action: string, text: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const IMPROVEMENT_OPTIONS = [
  { 
    value: 'clearer', 
    label: 'Make it clearer', 
    icon: Lightbulb,
    description: 'Improve readability and clarity'
  },
  { 
    value: 'punchier', 
    label: 'Make it punchier', 
    icon: Wand2,
    description: 'More engaging and impactful'
  },
  { 
    value: 'expand', 
    label: 'Expand this point', 
    icon: Expand,
    description: 'Add more detail and context'
  },
  { 
    value: 'example', 
    label: 'Add example', 
    icon: FileText,
    description: 'Include a practical example'
  },
];

export function InlineAIMenu({ 
  selectedText, 
  position, 
  onImprove, 
  onClose,
  isProcessing = false 
}: InlineAIMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (position && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft = position.left;
      let newTop = position.top;

      // Adjust horizontal position
      if (position.left + rect.width > viewportWidth - 20) {
        newLeft = viewportWidth - rect.width - 20;
      }
      if (newLeft < 20) {
        newLeft = 20;
      }

      // Adjust vertical position
      if (position.top + rect.height > viewportHeight - 20) {
        newTop = position.top - rect.height - 10;
      }

      setAdjustedPosition({ top: newTop, left: newLeft });
    }
  }, [position]);

  if (!position || !selectedText) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-neutral-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          top: adjustedPosition?.top ?? position.top,
          left: adjustedPosition?.left ?? position.left,
          minWidth: '220px'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-white/10 bg-primary-50/50 dark:bg-primary-900/10">
          <span className="text-xs font-medium text-primary-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Improve with AI
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-white/5 rounded"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>

        {/* Selected text preview */}
        <div className="px-3 py-2 border-b border-neutral-100 dark:border-white/10">
          <p className="text-xs text-neutral-500 line-clamp-2">
            "{selectedText.slice(0, 100)}{selectedText.length > 100 ? '...' : ''}"
          </p>
        </div>

        {/* Options */}
        <div className="py-1">
          {IMPROVEMENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => onImprove(option.value, selectedText)}
                disabled={isProcessing}
                className={clsx(
                  'w-full px-3 py-2 text-left hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors flex items-start gap-3',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                    {option.label}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {option.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
