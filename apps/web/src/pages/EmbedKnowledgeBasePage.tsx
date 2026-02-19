import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Trash2, FileText, Link, Upload, Check, X } from 'lucide-react';
import clsx from 'clsx';

interface EmbedConfig {
  tenantId?: string;
  apiKey?: string;
  primaryColor?: string;
  brandName?: string;
  parentOrigin?: string;
}

interface KnowledgeSource {
  id: string;
  title: string;
  source_type: 'url' | 'text' | 'file';
  url?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  created_at: string;
}

export function EmbedKnowledgeBasePage() {
  const [config, setConfig] = useState<EmbedConfig>({});
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'url' | 'text'>('url');
  const [newUrl, setNewUrl] = useState('');
  const [newText, setNewText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get('tenantId') || undefined;
    setConfig({
      tenantId,
      apiKey: params.get('apiKey') || undefined,
      primaryColor: params.get('primaryColor') || '#6366f1',
      brandName: params.get('brandName') || 'Knowledge Base',
      parentOrigin: params.get('parentOrigin') || undefined,
    });

    // Listen for postMessage config — reject all messages unless a trusted
    // parentOrigin was explicitly provided via URL param. Without a known
    // trusted origin we cannot safely accept configuration from any caller.
    const parentOriginParam = params.get('parentOrigin') || undefined;
    const handleMessage = (event: MessageEvent) => {
      if (!parentOriginParam || event.origin !== parentOriginParam) return;
      if (event.data?.type === 'EMBED_CONFIG') {
        setConfig(prev => ({ ...prev, ...event.data.config }));
      }
    };
    window.addEventListener('message', handleMessage);

    if (tenantId) {
      fetchSources(tenantId);
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function fetchSources(tenantId: string) {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('id, title, source_type, url, status, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addSource() {
    if (!config.tenantId) return;
    setSaving(true);
    setError('');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-source`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenant_id: config.tenantId,
          source_type: addType,
          url: addType === 'url' ? newUrl : undefined,
          content: addType === 'text' ? newText : undefined,
          title: newTitle || (addType === 'url' ? newUrl : 'Text content'),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Notify parent
      notifyParent('SOURCE_ADDED', { id: data.id, title: newTitle });
      
      // Refresh list
      await fetchSources(config.tenantId);
      
      // Reset form
      setShowAddModal(false);
      setNewUrl('');
      setNewText('');
      setNewTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSource(id: string) {
    if (!config.tenantId) return;
    
    try {
      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', id)
        .eq('tenant_id', config.tenantId);

      if (error) throw error;
      
      setSources(prev => prev.filter(s => s.id !== id));
      notifyParent('SOURCE_DELETED', { id });
    } catch (err) {
      console.error('Failed to delete source:', err);
    }
  }

  function notifyParent(type: string, data: unknown) {
    const referrerOrigin = window.parent !== window && document.referrer
      ? new URL(document.referrer).origin
      : null;
    const targetOrigin = config.parentOrigin || referrerOrigin;
    if (!targetOrigin) return; // No known safe origin — skip notification
    window.parent.postMessage({ type, data }, targetOrigin);
  }

  const primaryColor = config.primaryColor || '#6366f1';

  const getStatusBadge = (status: KnowledgeSource['status']) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: null },
      processing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: null },
      ready: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: <Check className="w-3 h-3" /> },
      error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: <X className="w-3 h-3" /> },
    };
    const s = styles[status] || styles.pending;
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', s.bg, s.text)}>
        {s.icon}
        {status}
      </span>
    );
  };

  if (!config.tenantId) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-background-dark flex items-center justify-center p-6">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Missing Tenant ID</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">Please provide a tenantId parameter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background-dark p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
              {config.brandName}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
              Manage your knowledge sources
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>

        {/* Sources List */}
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading...</div>
          ) : sources.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">No sources yet</p>
              <p className="text-sm text-neutral-500 mt-1">Add URLs or text to build your knowledge base</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-white/5">
              {sources.map(source => (
                <li key={source.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-white/5">
                  <div className="flex-shrink-0">
                    {source.source_type === 'url' ? (
                      <Link className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">{source.title}</p>
                    {source.url && (
                      <p className="text-sm text-neutral-500 truncate">{source.url}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(source.status)}
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Powered by Newsletter Wizard
        </p>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-white/10">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Add Source</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-white/5 rounded">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Type Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAddType('url')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border font-medium',
                    addType === 'url'
                      ? 'border-2 text-white'
                      : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300'
                  )}
                  style={addType === 'url' ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}
                >
                  <Link className="w-4 h-4" /> URL
                </button>
                <button
                  onClick={() => setAddType('text')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border font-medium',
                    addType === 'text'
                      ? 'border-2 text-white'
                      : 'border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300'
                  )}
                  style={addType === 'text' ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}
                >
                  <FileText className="w-4 h-4" /> Text
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Enter a title for this source"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              {addType === 'url' ? (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">URL</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Content</label>
                  <textarea
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    placeholder="Paste your content here..."
                    rows={5}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-neutral-200 dark:border-white/10">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={addSource}
                disabled={saving || (addType === 'url' ? !newUrl : !newText)}
                className="flex-1 py-2 text-white font-medium rounded-lg disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? 'Adding...' : 'Add Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
