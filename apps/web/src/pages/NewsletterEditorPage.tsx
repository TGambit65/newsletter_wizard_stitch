import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Newsletter } from '@/lib/supabase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useToast } from '@/components/ui/Toast';
import { sanitizeHtml } from '@/lib/sanitize';
import { EditorSkeleton } from '@/components/ui/Skeleton';
import { AIFeedback, InlineAIMenu, GenerationHistory } from '@/components/editor';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Eye, 
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Sparkles,
  X,
  Clock,
  Check,
  RefreshCw,
  AlertCircle,
  Users,
  FlaskConical,
  Share2,
  History
} from 'lucide-react';
import clsx from 'clsx';

// Types for generation history
interface GenerationHistoryItem {
  id: string;
  content: string;
  tone?: string;
  timestamp: Date;
  prompt?: string;
}

export function NewsletterEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [preheader, setPreheader] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Send state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendRecipients, setSendRecipients] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  
  // Test send state
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState('');
  
  // Schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  
  // Autosave state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // AI Feedback Loop state
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [lastGenerationId, setLastGenerationId] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [inlineMenuPosition, setInlineMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isInlineProcessing, setIsInlineProcessing] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const regenerationResetRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your newsletter...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
  });

  // Track changes for autosave
  const markAsChanged = useCallback(() => {
    if (!isSent && newsletter) {
      setHasUnsavedChanges(true);
    }
  }, [newsletter]);
  
  // Autosave function
  const performAutosave = useCallback(async () => {
    if (!id || !tenant || !hasUnsavedChanges || saving) return;
    
    try {
      await supabase
        .from('newsletters')
        .update({
          title,
          subject_line: subjectLine,
          preheader,
          content_html: editor?.getHTML() || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      setHasUnsavedChanges(false);
      setLastAutoSaved(new Date());
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, [id, tenant, hasUnsavedChanges, saving, title, subjectLine, preheader, editor]);
  
  // Autosave effect - triggers after 3 seconds of no changes
  useEffect(() => {
    if (hasUnsavedChanges && !newsletter?.status?.includes('sent')) {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
      autosaveTimeoutRef.current = setTimeout(performAutosave, 3000);
    }
    
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, performAutosave, newsletter?.status]);
  
  // Watch for content changes
  useEffect(() => {
    if (editor) {
      const handler = () => markAsChanged();
      editor.on('update', handler);
      return () => {
        editor.off('update', handler);
      };
    }
  }, [editor, markAsChanged]);

  useEffect(() => {
    if (id && tenant) {
      loadNewsletter();
    }
  }, [id, tenant]);

  async function loadNewsletter() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setNewsletter(data);
        setTitle(data.title);
        setSubjectLine(data.subject_line || '');
        setPreheader(data.preheader || '');
        if (data.content_html && editor) {
          editor.commands.setContent(data.content_html);
        }
        if (data.scheduled_at) {
          const dt = new Date(data.scheduled_at);
          setScheduleDate(dt.toISOString().split('T')[0]);
          setScheduleTime(dt.toTimeString().slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error loading newsletter:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveNewsletter() {
    if (!id || !tenant) return;
    setSaving(true);
    try {
      await supabase
        .from('newsletters')
        .update({
          title,
          subject_line: subjectLine,
          preheader,
          content_html: editor?.getHTML() || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      setHasUnsavedChanges(false);
      toast.success('Newsletter saved');
    } catch (error) {
      console.error('Error saving newsletter:', error);
      toast.error('Failed to save newsletter');
    } finally {
      setSaving(false);
    }
  }

  async function sendTestEmail() {
    if (!testEmail.trim() || !id) return;
    setSendingTest(true);
    setTestError('');
    setTestSuccess(false);
    
    // Save first
    await saveNewsletter();
    
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          newsletter_id: id,
          recipients: [testEmail.trim()],
          is_test: true,
        },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);
      
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (error: any) {
      setTestError(error.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  }

  async function sendNewsletter() {
    if (!sendRecipients.trim() || !id) return;
    setSending(true);
    setSendError('');
    
    // Save first
    await saveNewsletter();
    
    const recipients = sendRecipients
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));
    
    if (recipients.length === 0) {
      setSendError('Please enter valid email addresses');
      setSending(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          newsletter_id: id,
          recipients,
          is_test: false,
        },
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);
      
      setSendSuccess(true);
      setShowSendModal(false);
      
      // Reload newsletter to get updated status
      loadNewsletter();
    } catch (error: any) {
      setSendError(error.message || 'Failed to send newsletter');
    } finally {
      setSending(false);
    }
  }

  async function scheduleNewsletter() {
    if (!scheduleDate || !scheduleTime || !id) return;
    setScheduling(true);
    
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    
    try {
      await supabase
        .from('newsletters')
        .update({
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      setShowScheduleModal(false);
      loadNewsletter();
    } catch (error) {
      console.error('Error scheduling:', error);
    } finally {
      setScheduling(false);
    }
  }

  async function generateWithAI(tone?: string) {
    if (!aiPrompt.trim() || !tenant) return;
    
    // Rate limiting: max 10 regenerations per hour
    if (regenerationCount >= 10) {
      toast.error('Rate limit reached. Please wait before regenerating.');
      return;
    }
    
    setGenerating(true);
    setRegenerationCount(prev => prev + 1);
    
    // Reset counter after an hour
    if (regenerationResetRef.current) {
      clearTimeout(regenerationResetRef.current);
    }
    regenerationResetRef.current = setTimeout(() => {
      setRegenerationCount(0);
    }, 3600000); // 1 hour

    try {
      // Save current content to history before generating new
      if (editor && editor.getHTML().length > 20) {
        const newHistoryItem: GenerationHistoryItem = {
          id: crypto.randomUUID(),
          content: editor.getHTML(),
          tone: tone,
          timestamp: new Date(),
          prompt: aiPrompt
        };
        setGenerationHistory(prev => [newHistoryItem, ...prev].slice(0, 5));
      }
      
      // First do RAG search
      const { data: ragData } = await supabase.functions.invoke('rag-search', {
        body: { tenant_id: tenant.id, query: aiPrompt, limit: 5 },
      });

      // Then generate content with optional tone
      const { data: genData } = await supabase.functions.invoke('generate-content', {
        body: {
          tenant_id: tenant.id,
          topic: aiPrompt,
          context: ragData?.results || [],
          tone: tone, // Pass tone parameter
        },
      });

      if (genData && !genData.error) {
        const generationId = crypto.randomUUID();
        setLastGenerationId(generationId);
        
        if (editor) {
          const currentContent = editor.getHTML();
          editor.commands.setContent(currentContent + (genData.content_html || ''));
        }
        if (genData.subject_line && !subjectLine) {
          setSubjectLine(genData.subject_line);
        }
        
        // Show feedback UI after generation
        setShowAIFeedback(true);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content');
    }

    setAiPrompt('');
    setShowAIPanel(false);
    setGenerating(false);
  }
  
  // Handle AI feedback submission
  async function handleAIFeedback(rating: 'up' | 'down', comment?: string) {
    if (!lastGenerationId || !tenant) return;
    
    try {
      // Store feedback (would go to ai_feedback table in production)
      console.log('AI Feedback:', { 
        generation_id: lastGenerationId, 
        rating, 
        comment,
        tenant_id: tenant.id 
      });
      
      toast.success(rating === 'up' ? 'Thanks for the feedback!' : 'Feedback recorded. We\'ll improve.');
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  }
  
  // Handle regeneration with tone
  function handleRegenerate(tone?: string) {
    generateWithAI(tone);
  }
  
  // Handle inline text improvement
  async function handleInlineImprove(action: string, text: string) {
    if (!tenant || !editor) return;
    
    setIsInlineProcessing(true);
    
    try {
      const actionPrompts: Record<string, string> = {
        clearer: `Make this text clearer and more readable: "${text}"`,
        punchier: `Make this text more engaging and impactful: "${text}"`,
        expand: `Expand on this point with more detail: "${text}"`,
        example: `Add a practical example to illustrate this point: "${text}"`,
      };
      
      const { data: genData } = await supabase.functions.invoke('generate-content', {
        body: {
          tenant_id: tenant.id,
          topic: actionPrompts[action] || text,
          context: [],
          inline_improvement: true,
        },
      });
      
      if (genData && !genData.error && genData.content_html) {
        // Replace selected text with improved version
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(genData.content_html).run();
        toast.success('Text improved!');
      }
    } catch (error) {
      console.error('Inline improvement error:', error);
      toast.error('Failed to improve text');
    } finally {
      setIsInlineProcessing(false);
      setInlineMenuPosition(null);
      setSelectedText('');
    }
  }
  
  // Handle text selection for inline menu
  useEffect(() => {
    if (!editor) return;
    
    const handleSelectionChange = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (text.length > 10) {
        // Get selection coordinates
        const coords = editor.view.coordsAtPos(from);
        setSelectedText(text);
        setInlineMenuPosition({ 
          top: coords.top - 10, 
          left: coords.left 
        });
      } else {
        setSelectedText('');
        setInlineMenuPosition(null);
      }
    };
    
    editor.on('selectionUpdate', handleSelectionChange);
    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor]);
  
  // Revert to history item
  function handleRevertToHistory(item: GenerationHistoryItem) {
    if (editor) {
      editor.commands.setContent(item.content);
      markAsChanged();
      toast.success('Reverted to previous version');
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-8 w-64 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EditorSkeleton />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-3" />
                <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Newsletter not found</p>
        <Link to="/newsletters" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          Back to Newsletters
        </Link>
      </div>
    );
  }

  const isSent = newsletter.status === 'sent';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/newsletters')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </button>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markAsChanged();
              }}
              disabled={isSent}
              className="text-2xl font-bold text-neutral-900 dark:text-white bg-transparent border-none outline-none w-full disabled:cursor-not-allowed"
              placeholder="Newsletter title"
            />
            <p className="text-sm text-neutral-500">
              {newsletter.status === 'draft' ? 'Draft' : 
               newsletter.status === 'sent' ? `Sent on ${new Date(newsletter.sent_at!).toLocaleString()}` :
               newsletter.status === 'scheduled' ? `Scheduled for ${new Date(newsletter.scheduled_at!).toLocaleString()}` :
               newsletter.status} 
              {newsletter.status === 'draft' && ` - Last saved ${new Date(newsletter.updated_at).toLocaleString()}`}
              {lastAutoSaved && hasUnsavedChanges === false && (
                <span className="ml-2 text-success">✓ Saved</span>
              )}
              {hasUnsavedChanges && (
                <span className="ml-2 text-warning">● Unsaved changes</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
            Preview
          </button>
          {!isSent && (
            <>
              <button
                onClick={saveNewsletter}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save
              </button>
              <button 
                onClick={() => setShowSendModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </>
          )}
        </div>
      </div>

      {sendSuccess && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-success" />
          <p className="text-success font-medium">Newsletter sent successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subject Line */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => {
                setSubjectLine(e.target.value);
                markAsChanged();
              }}
              disabled={isSent}
              placeholder="Enter your email subject line"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Preheader */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Preheader
            </label>
            <input
              type="text"
              value={preheader}
              onChange={(e) => {
                setPreheader(e.target.value);
                markAsChanged();
              }}
              disabled={isSent}
              placeholder="Preview text shown in inbox"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Editor */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
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
                {generationHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    title="View generation history"
                  >
                    <History className="w-4 h-4" />
                    History ({generationHistory.length})
                  </button>
                )}
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
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
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="What would you like to write about?"
                    className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && generateWithAI()}
                  />
                  <button
                    onClick={() => generateWithAI()}
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
                      onClick={() => setAiPrompt(suggestion)}
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
                  onRegenerate={handleRegenerate}
                  onFeedback={handleAIFeedback}
                  isRegenerating={generating}
                  disabled={isSent}
                />
                <button
                  onClick={() => setShowAIFeedback(false)}
                  className="mt-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Editor Content */}
            <EditorContent 
              editor={editor} 
              className={clsx('min-h-[400px]', isSent && 'pointer-events-none opacity-80')} 
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Status</h3>
            <div className="flex items-center gap-2">
              <span className={clsx(
                'w-3 h-3 rounded-full',
                newsletter.status === 'draft' ? 'bg-neutral-400' :
                newsletter.status === 'sent' ? 'bg-success' : 
                newsletter.status === 'scheduled' ? 'bg-warning' : 'bg-neutral-400'
              )} />
              <span className="capitalize text-neutral-700 dark:text-neutral-300">{newsletter.status}</span>
            </div>
          </div>

          {/* Schedule */}
          {!isSent && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Schedule</h3>
              {newsletter.scheduled_at ? (
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  <p>Scheduled for:</p>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {new Date(newsletter.scheduled_at).toLocaleString()}
                  </p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Change schedule
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  Schedule Send
                </button>
              )}
            </div>
          )}

          {/* A/B Testing */}
          {!isSent && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">A/B Testing</h3>
              <button 
                onClick={() => navigate(`/newsletters/${id}/ab-test`)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <FlaskConical className="w-5 h-5" />
                Create A/B Test
              </button>
            </div>
          )}

          {/* Social Media */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Social Media</h3>
            <button 
              onClick={() => navigate(`/newsletters/${id}/social`)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Generate Social Posts
            </button>
          </div>

          {/* Test Send */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Test</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
              <button 
                onClick={sendTestEmail}
                disabled={sendingTest || !testEmail.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
              >
                {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test
              </button>
              {testSuccess && (
                <p className="text-success text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" /> Test email sent!
                </p>
              )}
              {testError && (
                <p className="text-error text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {testError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="font-semibold text-neutral-900 dark:text-white">Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 mb-4">
                <p className="text-sm text-neutral-500">Subject: <span className="text-neutral-900 dark:text-white">{subjectLine || 'No subject'}</span></p>
                <p className="text-sm text-neutral-500 mt-1">Preheader: <span className="text-neutral-700 dark:text-neutral-300">{preheader || 'No preheader'}</span></p>
              </div>
              {/* HTML is sanitized via DOMPurify before rendering */}
              <div
                className="prose dark:prose-invert max-w-none"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(editor?.getHTML() ?? '') }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5" /> Send Newsletter
              </h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <Users className="w-4 h-4 inline mr-1" />
                  Recipients
                </label>
                <p className="text-xs text-neutral-500 mb-2">
                  Enter email addresses separated by commas, semicolons, or new lines
                </p>
                <textarea
                  value={sendRecipients}
                  onChange={(e) => setSendRecipients(e.target.value)}
                  placeholder="user1@example.com, user2@example.com"
                  rows={5}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                />
              </div>
              
              {sendError && (
                <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-error text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {sendError}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={sendNewsletter}
                  disabled={sending || !sendRecipients.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5" /> Schedule Newsletter
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
              
              <p className="text-xs text-neutral-500 mt-4">
                Note: Scheduled sends require a background cron job to be configured. For MVP, the schedule is stored but manual sending may be needed.
              </p>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={scheduleNewsletter}
                  disabled={scheduling || !scheduleDate || !scheduleTime}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {scheduling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline AI Menu for text selection */}
      <InlineAIMenu
        selectedText={selectedText}
        position={inlineMenuPosition}
        onImprove={handleInlineImprove}
        onClose={() => {
          setInlineMenuPosition(null);
          setSelectedText('');
        }}
        isProcessing={isInlineProcessing}
      />

      {/* Generation History Drawer */}
      <GenerationHistory
        history={generationHistory}
        currentContent={editor?.getHTML() || ''}
        onRevert={handleRevertToHistory}
        onCompare={() => {}}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
