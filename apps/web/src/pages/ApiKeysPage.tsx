import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Activity } from 'lucide-react';
import clsx from 'clsx';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
  full_key?: string;
  current_usage?: number;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'sources:read', label: 'Read Sources' },
  { id: 'sources:write', label: 'Write Sources' },
  { id: 'newsletters:read', label: 'Read Newsletters' },
  { id: 'newsletters:write', label: 'Write Newsletters' },
  { id: 'analytics:read', label: 'Read Analytics' },
];

export function ApiKeysPage() {
  const { session } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['sources:read', 'newsletters:read', 'analytics:read']);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [usageData, setUsageData] = useState<Record<string, number>>({});

  useEffect(() => {
    loadKeys();
  }, []);

  useEffect(() => {
    if (keys.length > 0) {
      loadUsageData();
    }
  }, [keys]);

  async function loadUsageData() {
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const usage: Record<string, number> = {};
    
    for (const key of keys) {
      if (!key.revoked_at) {
        const { count } = await supabase
          .from('api_key_usage')
          .select('*', { count: 'exact', head: true })
          .eq('api_key_id', key.id)
          .gte('created_at', hourAgo);
        usage[key.id] = count || 0;
      }
    }
    setUsageData(usage);
  }

  async function loadKeys() {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Error loading keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    setCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          name: newKeyName || 'API Key',
          permissions: newKeyPermissions,
          rate_limit: newKeyRateLimit,
        }),
      });
      const data = await response.json();
      if (data.key) {
        setCreatedKey(data.key);
        setShowCreate(false);
        setNewKeyName('');
        await loadKeys();
      }
    } catch (error) {
      console.error('Error creating key:', error);
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'revoke', keyId }),
      });
      await loadKeys();
    } catch (error) {
      console.error('Error revoking key:', error);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function togglePermission(perm: string) {
    setNewKeyPermissions(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">API Keys</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Key
        </button>
      </div>

      {/* Created Key Modal */}
      {createdKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">API Key Created</h2>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Copy this key now. It will not be shown again.
                </p>
              </div>
            </div>
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-3 font-mono text-sm break-all">
              {createdKey.full_key}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => copyToClipboard(createdKey.full_key!)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setCreatedKey(null)}
                className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Create API Key</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="My API Key"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newKeyPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Rate Limit (requests/hour)
                </label>
                <input
                  type="number"
                  value={newKeyRateLimit}
                  onChange={e => setNewKeyRateLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createKey}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
          <Key className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600 dark:text-neutral-400">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <div 
              key={key.id}
              className={clsx(
                "bg-white dark:bg-neutral-800 rounded-xl p-4 border",
                key.revoked_at 
                  ? "border-red-200 dark:border-red-800 opacity-60"
                  : "border-neutral-200 dark:border-neutral-700"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                    <Key className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{key.name}</h3>
                    <p className="text-sm text-neutral-500 font-mono">{key.key_prefix}...</p>
                  </div>
                </div>
                {key.revoked_at ? (
                  <span className="text-sm text-red-600 dark:text-red-400">Revoked</span>
                ) : (
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {key.permissions.map(perm => (
                  <span 
                    key={perm}
                    className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded"
                  >
                    {perm}
                  </span>
                ))}
              </div>
              {!key.revoked_at && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                      <Activity className="w-3.5 h-3.5" />
                      Rate Limit Usage
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {usageData[key.id] || 0} / {key.rate_limit} requests/hour
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all",
                        ((usageData[key.id] || 0) / key.rate_limit) > 0.8 
                          ? "bg-red-500" 
                          : ((usageData[key.id] || 0) / key.rate_limit) > 0.5 
                            ? "bg-amber-500" 
                            : "bg-green-500"
                      )}
                      style={{ width: `${Math.min(((usageData[key.id] || 0) / key.rate_limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-neutral-500">
                Created {new Date(key.created_at).toLocaleDateString()}
                {key.last_used_at && ` | Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
