import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Webhook, Plus, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
  secret?: string;
}

interface Delivery {
  id: string;
  event_type: string;
  status: string;
  attempts: number;
  response_code: number;
  delivered_at: string;
}

const AVAILABLE_EVENTS = [
  { id: 'newsletter.sent', label: 'Newsletter Sent' },
  { id: 'newsletter.opened', label: 'Newsletter Opened' },
  { id: 'newsletter.clicked', label: 'Newsletter Clicked' },
  { id: 'source.processed', label: 'Source Processed' },
];

export function WebhooksPage() {
  const { session } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['newsletter.sent']);
  const [createdWebhook, setCreatedWebhook] = useState<WebhookData | null>(null);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});

  useEffect(() => {
    loadWebhooks();
  }, []);

  async function loadWebhooks() {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDeliveries(webhookId: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deliveries', webhookId }),
      });
      const data = await response.json();
      setDeliveries(prev => ({ ...prev, [webhookId]: data.deliveries || [] }));
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  }

  async function createWebhook() {
    if (!newUrl) return;
    setCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          url: newUrl,
          events: newEvents,
        }),
      });
      const data = await response.json();
      if (data.webhook) {
        setCreatedWebhook(data.webhook);
        setShowCreate(false);
        setNewUrl('');
        setNewEvents(['newsletter.sent']);
        await loadWebhooks();
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
    } finally {
      setCreating(false);
    }
  }

  async function toggleWebhook(webhookId: string, enabled: boolean) {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update', webhookId, enabled }),
      });
      await loadWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  }

  async function deleteWebhook(webhookId: string) {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', webhookId }),
      });
      await loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  }

  function toggleExpand(webhookId: string) {
    if (expandedId === webhookId) {
      setExpandedId(null);
    } else {
      setExpandedId(webhookId);
      if (!deliveries[webhookId]) {
        loadDeliveries(webhookId);
      }
    }
  }

  function toggleEvent(event: string) {
    setNewEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Webhooks</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Receive real-time notifications for events</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {/* Created Webhook Secret Modal */}
      {createdWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Webhook Created</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Use this secret to verify webhook signatures:
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-3 font-mono text-sm break-all">
              {createdWebhook.secret}
            </div>
            <button
              onClick={() => setCreatedWebhook(null)}
              className="w-full mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Add Webhook</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Events
                </label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map(event => (
                    <label key={event.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newEvents.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{event.label}</span>
                    </label>
                  ))}
                </div>
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
                onClick={createWebhook}
                disabled={creating || !newUrl}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
          <Webhook className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600 dark:text-neutral-400">No webhooks configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <div 
              key={webhook.id}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={clsx(
                      "p-2 rounded-lg",
                      webhook.enabled ? "bg-green-100 dark:bg-green-900/30" : "bg-neutral-100 dark:bg-neutral-700"
                    )}>
                      <Webhook className={clsx(
                        "w-5 h-5",
                        webhook.enabled ? "text-green-600" : "text-neutral-400"
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">{webhook.url}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map(event => (
                          <span 
                            key={event}
                            className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleWebhook(webhook.id, !webhook.enabled)}
                      className={clsx(
                        "p-2 rounded-lg",
                        webhook.enabled ? "text-green-600 hover:bg-green-50" : "text-neutral-400 hover:bg-neutral-100"
                      )}
                    >
                      {webhook.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteWebhook(webhook.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(webhook.id)}
                      className="p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                    >
                      {expandedId === webhook.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Delivery Logs */}
              {expandedId === webhook.id && (
                <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-4">
                  <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Recent Deliveries</h4>
                  {deliveries[webhook.id]?.length ? (
                    <div className="space-y-2">
                      {deliveries[webhook.id].map(delivery => (
                        <div key={delivery.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={clsx(
                              "w-2 h-2 rounded-full",
                              delivery.status === 'delivered' ? "bg-green-500" : "bg-red-500"
                            )} />
                            <span className="text-neutral-600 dark:text-neutral-400">{delivery.event_type}</span>
                          </div>
                          <div className="flex items-center gap-4 text-neutral-500">
                            <span>HTTP {delivery.response_code}</span>
                            <span>{new Date(delivery.delivered_at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No deliveries yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
