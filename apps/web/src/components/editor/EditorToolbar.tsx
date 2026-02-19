import type { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
  RefreshCw,
  History,
} from 'lucide-react';
import clsx from 'clsx';
import { AIFeedback } from './AIFeedback';

interface EditorToolbarProps {
  editor: Editor | null;
  isSent: boolean;
  generationHistoryCount: number;
  showAIPanel: boolean;
  aiPrompt: string;
  generating: boolean;
  showAIFeedback: boolean;
  lastGenerationId: string | null;
  onToggleHistory: () => void;
  onToggleAIPanel: () => void;
  onAiPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onRegenerate: (tone?: string) => void;
  onFeedback: (rating: 'up' | 'down', comment?: string) => void;
  onDismissAIFeedback: () => void;
}

export function EditorToolbar({
  editor,
  isSent,
  generationHistoryCount,
  showAIPanel,
  aiPrompt,
  generating,
  showAIFeedback,
  lastGenerationId,
  onToggleHistory,
  onToggleAIPanel,
  onAiPromptChange,
  onGenerate,
  onRegenerate,
  onFeedback,
  onDismissAIFeedback,
}: EditorToolbarProps) {
  return (
    <>
      {/* Toolbar */}
      {!isSent && (
        <div className="flex items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-700 flex-wrap">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={clsx(
              'p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700',
              editor?.isActive('bold') && 'bg-neutral-100 dark:bg-neutral-700'
            )}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={clsx(
              'p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700',
              editor?.isActive('italic') && 'bg-neutral-100 dark:bg-neutral-700'
            )}
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={clsx(
              'p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700',
              editor?.isActive('heading', { level: 1 }) && 'bg-neutral-100 dark:bg-neutral-700'
            )}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={clsx(
              'p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700',
              editor?.isActive('heading', { level: 2 }) && 'bg-neutral-100 dark:bg-neutral-700'
            )}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={clsx(
              'p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700',
              editor?.isActive('bulletList') && 'bg-neutral-100 dark:bg-neutral-700'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={clsx(
              'p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700',
              editor?.isActive('orderedList') && 'bg-neutral-100 dark:bg-neutral-700'
            )}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={clsx(
              'p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700',
              editor?.isActive('blockquote') && 'bg-neutral-100 dark:bg-neutral-700'
            )}
          >
            <Quote className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />
          <button
            onClick={() => editor?.chain().focus().undo().run()}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          {generationHistoryCount > 0 && (
            <button
              onClick={onToggleHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="View generation history"
            >
              <History className="w-4 h-4" />
              History ({generationHistoryCount})
            </button>
          )}
          <button
            onClick={onToggleAIPanel}
            className={clsx(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors',
              showAIPanel
                ? 'bg-primary-500 text-white'
                : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100'
            )}
          >
            <Sparkles className="w-4 h-4" />
            AI Assist
          </button>
        </div>
      )}

      {/* AI Panel */}
      {showAIPanel && !isSent && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => onAiPromptChange(e.target.value)}
              placeholder="What would you like to write about?"
              className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
            />
            <button
              onClick={onGenerate}
              disabled={generating || !aiPrompt.trim()}
              className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Generate'}
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {['Expand on this', 'Make it punchier', 'Add a call to action', 'Summarize'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onAiPromptChange(suggestion)}
                className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm text-neutral-600 dark:text-neutral-400 hover:border-primary-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback — shown after generation, independent of the AI prompt panel */}
      {showAIFeedback && !isSent && (
        <div className="px-4 pb-3 border-b border-neutral-200 dark:border-neutral-700 bg-primary-50/30 dark:bg-primary-900/5">
          <AIFeedback
            generationId={lastGenerationId || undefined}
            onRegenerate={onRegenerate}
            onFeedback={onFeedback}
            isRegenerating={generating}
            disabled={isSent}
          />
          <button
            onClick={onDismissAIFeedback}
            className="mt-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
