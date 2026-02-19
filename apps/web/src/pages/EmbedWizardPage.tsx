import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, FileText, Send, Check } from 'lucide-react';
import clsx from 'clsx';

interface EmbedConfig {
  tenantId?: string;
  apiKey?: string;
  primaryColor?: string;
  brandName?: string;
  parentOrigin?: string;
}

type Step = 'topic' | 'generate' | 'review' | 'complete';

export function EmbedWizardPage() {
  const [config, setConfig] = useState<EmbedConfig>({});
  const [step, setStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Parse config from URL params
    const params = new URLSearchParams(window.location.search);
    const parentOrigin = params.get('parentOrigin') || undefined;
    setConfig({
      tenantId: params.get('tenantId') || undefined,
      apiKey: params.get('apiKey') || undefined,
      primaryColor: params.get('primaryColor') || '#6366f1',
      brandName: params.get('brandName') || 'Newsletter Wizard',
      parentOrigin,
    });

    // Listen for postMessage config — reject all messages unless a trusted
    // parentOrigin was explicitly provided via URL param. Without a known
    // trusted origin we cannot safely accept configuration from any caller.
    const handleMessage = (event: MessageEvent) => {
      if (!parentOrigin || event.origin !== parentOrigin) return;
      if (event.data?.type === 'EMBED_CONFIG') {
        setConfig(prev => ({ ...prev, ...event.data.config }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function generateContent() {
    if (!topic) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
        },
        body: JSON.stringify({
          topic,
          tenant_id: config.tenantId,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedContent(data.content || '');
      setSubjectLine(data.subject_line || topic);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  }

  async function saveNewsletter() {
    setLoading(true);
    try {
      const referrerOrigin = window.parent !== window && document.referrer
        ? new URL(document.referrer).origin
        : null;
      const targetOrigin = config.parentOrigin || referrerOrigin;
      if (!targetOrigin) {
        setError('Cannot save: parent origin not configured. Add ?parentOrigin=https://yoursite.com to the embed URL.');
        setLoading(false);
        return;
      }
      window.parent.postMessage({
        type: 'NEWSLETTER_CREATED',
        data: {
          topic,
          subject_line: subjectLine,
          content: generatedContent,
        },
      }, targetOrigin);

      setStep('complete');
    } catch (err) {
      setError('Failed to save newsletter');
    } finally {
      setLoading(false);
    }
  }

  const primaryColor = config.primaryColor || '#6366f1';

  const steps = [
    { id: 'topic', label: 'Topic', icon: FileText },
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'review', label: 'Review', icon: Send },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background-dark p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            {config.brandName}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Create your newsletter</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div 
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  step === s.id || steps.findIndex(x => x.id === step) > i
                    ? "text-white"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                )}
                style={step === s.id || steps.findIndex(x => x.id === step) > i ? { backgroundColor: primaryColor } : {}}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-neutral-300 dark:bg-neutral-600 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm">
          {step === 'topic' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">What would you like to write about?</h2>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Enter your newsletter topic or paste content to summarize..."
                rows={4}
                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-none"
              />
              <button
                onClick={() => { setStep('generate'); generateContent(); }}
                disabled={!topic || loading}
                className="w-full py-3 text-white font-medium rounded-lg disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                Generate Newsletter
              </button>
            </div>
          )}

          {step === 'generate' && (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                <Sparkles className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Generating your newsletter...</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">This may take a moment</p>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subjectLine}
                  onChange={e => setSubjectLine(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Content Preview
                </label>
                <div className="border border-neutral-300 dark:border-neutral-600 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-700 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 font-sans">
                    {generatedContent}
                  </pre>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('topic')}
                  className="flex-1 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5"
                >
                  Start Over
                </button>
                <button
                  onClick={saveNewsletter}
                  disabled={loading}
                  className="flex-1 py-3 text-white font-medium rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? 'Saving...' : 'Save Newsletter'}
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: '#10b981' + '20' }}
              >
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Newsletter Created!</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-2">Your newsletter has been saved</p>
              <button
                onClick={() => { setStep('topic'); setTopic(''); setGeneratedContent(''); }}
                className="mt-4 px-6 py-2 text-white font-medium rounded-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Create Another
              </button>
            </div>
          )}
        </div>

        {/* Powered By Footer */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Powered by Newsletter Wizard
        </p>
      </div>
    </div>
  );
}
