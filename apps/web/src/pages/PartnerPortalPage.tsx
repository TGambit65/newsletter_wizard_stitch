import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';
import {
  Building2, Users, FileText, Key, Webhook, Palette,
  Plus, Trash2, Settings, BarChart3, ArrowUpRight, DollarSign
} from 'lucide-react';
import clsx from 'clsx';

type Tab = 'dashboard' | 'tenants' | 'api-keys' | 'webhooks' | 'white-label' | 'billing';

interface SubTenant {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  created_at: string;
  max_sources: number;
  max_newsletters_per_month: number;
}

interface BillingRecord {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  newsletters_sent: number;
  api_calls: number;
  storage_mb: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue';
}

interface PartnerStats {
  total_tenants: number;
  total_newsletters: number;
  total_sources: number;
}

interface WhiteLabelConfig {
  id?: string;
  brand_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  custom_domain: string;
  feature_flags: Record<string, boolean>;
}

export function PartnerPortalPage() {
  const { session, tenant } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [subTenants, setSubTenants] = useState<SubTenant[]>([]);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
    brand_name: '',
    logo_url: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    custom_domain: '',
    feature_flags: { ab_testing: true, voice_profiles: true, multi_esp: true },
  });
  const [loading, setLoading] = useState(true);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [isPartner, setIsPartner] = useState(false);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    checkPartnerStatus();
  }, [tenant]);

  async function checkPartnerStatus() {
    if (!tenant) return;
    
    const { data } = await supabase
      .from('tenants')
      .select('partner_id')
      .eq('id', tenant.id)
      .single();
    
    if (data?.partner_id) {
      setIsPartner(true);
      loadData();
    } else {
      setIsPartner(false);
      setLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);
    await Promise.all([loadSubTenants(), loadStats(), loadWhiteLabelConfig(), loadBilling()]);
    setLoading(false);
  }

  async function loadSubTenants() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-sub-tenants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await response.json();
      setSubTenants(data.tenants || []);
    } catch (error) {
      console.error('Error loading sub-tenants:', error);
      toast.error('Failed to load sub-tenants');
    }
  }

  async function loadStats() {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-sub-tenants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stats' }),
      });
      const data = await response.json();
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load stats');
    }
  }

  async function loadWhiteLabelConfig() {
    if (!tenant) return;
    
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('partner_id')
      .eq('id', tenant.id)
      .single();
    
    if (tenantData?.partner_id) {
      const { data } = await supabase
        .from('white_label_config')
        .select('*')
        .eq('partner_id', tenantData.partner_id)
        .single();
      
      if (data) {
        setWhiteLabelConfig(data);
      }
    }
  }

  async function loadBilling() {
    try {
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(12);
      if (!error && data) setBillingRecords(data);
    } catch (error) {
      console.error('Error loading billing:', error);
      toast.error('Failed to load billing');
    }
  }

  async function createSubTenant() {
    if (!newTenantName || !newTenantSlug) return;

    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-sub-tenants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          name: newTenantName,
          slug: newTenantSlug,
        }),
      });
      setShowCreateTenant(false);
      setNewTenantName('');
      setNewTenantSlug('');
      await loadSubTenants();
      await loadStats();
      toast.success(`Tenant "${newTenantName}" created`);
    } catch (error) {
      console.error('Error creating sub-tenant:', error);
      toast.error('Failed to create tenant');
    }
  }

  async function deleteSubTenant(tenantId: string) {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-sub-tenants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', tenantId }),
      });
      await loadSubTenants();
      await loadStats();
      toast.success('Tenant deleted');
    } catch (error) {
      console.error('Error deleting sub-tenant:', error);
      toast.error('Failed to delete tenant');
    }
  }

  async function saveWhiteLabelConfig() {
    if (!tenant) return;

    try {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('partner_id')
        .eq('id', tenant.id)
        .single();

      if (!tenantData?.partner_id) return;

      if (whiteLabelConfig.id) {
        await supabase
          .from('white_label_config')
          .update({
            brand_name: whiteLabelConfig.brand_name,
            logo_url: whiteLabelConfig.logo_url,
            primary_color: whiteLabelConfig.primary_color,
            secondary_color: whiteLabelConfig.secondary_color,
            custom_domain: whiteLabelConfig.custom_domain,
            feature_flags: whiteLabelConfig.feature_flags,
            updated_at: new Date().toISOString(),
          })
          .eq('id', whiteLabelConfig.id);
      } else {
        await supabase
          .from('white_label_config')
          .insert({
            partner_id: tenantData.partner_id,
            ...whiteLabelConfig,
          });
      }

      await loadWhiteLabelConfig();
      toast.success('White label configuration saved');
    } catch (error) {
      console.error('Error saving white label config:', error);
      toast.error('Failed to save configuration');
    }
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
    { id: 'tenants' as Tab, label: 'Sub-Tenants', icon: Users },
    { id: 'api-keys' as Tab, label: 'API Keys', icon: Key },
    { id: 'webhooks' as Tab, label: 'Webhooks', icon: Webhook },
    { id: 'white-label' as Tab, label: 'White Label', icon: Palette },
    { id: 'billing' as Tab, label: 'Billing', icon: DollarSign },
  ];

  if (!isPartner && !loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
          <Building2 className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Partner Access Required</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Contact support to upgrade to a partner account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Partner Portal</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage your sub-tenants and platform settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total_tenants}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Sub-Tenants</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total_newsletters}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Newsletters</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <ArrowUpRight className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total_sources}</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Sources</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tenants Tab */}
          {activeTab === 'tenants' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowCreateTenant(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <Plus className="w-4 h-4" /> Create Sub-Tenant
                </button>
              </div>

              {showCreateTenant && (
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 mb-4">
                  <h3 className="font-medium text-neutral-900 dark:text-white mb-4">Create Sub-Tenant</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newTenantName}
                      onChange={e => setNewTenantName(e.target.value)}
                      placeholder="Tenant Name"
                      className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newTenantSlug}
                      onChange={e => setNewTenantSlug(e.target.value)}
                      placeholder="tenant-slug"
                      className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setShowCreateTenant(false)}
                      className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createSubTenant}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              {subTenants.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <Users className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600 dark:text-neutral-400">No sub-tenants yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subTenants.map(t => (
                    <div key={t.id} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-neutral-900 dark:text-white">{t.name}</h3>
                          <p className="text-sm text-neutral-500">{t.slug} | {t.subscription_tier}</p>
                        </div>
                        <button
                          onClick={() => setDeleteConfirmId(t.id)}
                          aria-label={`Delete ${t.name}`}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* API Keys Tab - redirect to dedicated page */}
          {activeTab === 'api-keys' && (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <Key className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">Manage API keys in the dedicated settings page</p>
              <a 
                href="/settings/api-keys"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Go to API Keys <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Webhooks Tab - redirect to dedicated page */}
          {activeTab === 'webhooks' && (
            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
              <Webhook className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">Manage webhooks in the dedicated settings page</p>
              <a 
                href="/settings/webhooks"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Go to Webhooks <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* White Label Tab */}
          {activeTab === 'white-label' && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="font-medium text-neutral-900 dark:text-white mb-4">White Label Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={whiteLabelConfig.brand_name}
                    onChange={e => setWhiteLabelConfig(c => ({ ...c, brand_name: e.target.value }))}
                    placeholder="Your Brand"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={whiteLabelConfig.logo_url}
                    onChange={e => setWhiteLabelConfig(c => ({ ...c, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={whiteLabelConfig.primary_color}
                        onChange={e => setWhiteLabelConfig(c => ({ ...c, primary_color: e.target.value }))}
                        className="w-10 h-10 rounded border border-neutral-300"
                      />
                      <input
                        type="text"
                        value={whiteLabelConfig.primary_color}
                        onChange={e => setWhiteLabelConfig(c => ({ ...c, primary_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Secondary Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={whiteLabelConfig.secondary_color}
                        onChange={e => setWhiteLabelConfig(c => ({ ...c, secondary_color: e.target.value }))}
                        className="w-10 h-10 rounded border border-neutral-300"
                      />
                      <input
                        type="text"
                        value={whiteLabelConfig.secondary_color}
                        onChange={e => setWhiteLabelConfig(c => ({ ...c, secondary_color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    value={whiteLabelConfig.custom_domain}
                    onChange={e => setWhiteLabelConfig(c => ({ ...c, custom_domain: e.target.value }))}
                    placeholder="app.yourdomain.com"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Feature Flags
                  </label>
                  <div className="space-y-2">
                    {Object.entries(whiteLabelConfig.feature_flags).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={e => setWhiteLabelConfig(c => ({
                            ...c,
                            feature_flags: { ...c.feature_flags, [key]: e.target.checked }
                          }))}
                          className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={saveWhiteLabelConfig}
                className="mt-6 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Save Configuration
              </button>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-white mb-4">Billing History</h3>
              {billingRecords.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <DollarSign className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600 dark:text-neutral-400">No billing records yet</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-700">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Period</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Newsletters</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">API Calls</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Storage</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Amount</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {billingRecords.map(record => (
                        <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                          <td className="px-4 py-3 text-sm text-neutral-900 dark:text-white">
                            {new Date(record.period_start).toLocaleDateString()} - {new Date(record.period_end).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{record.newsletters_sent}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{record.api_calls.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{record.storage_mb} MB</td>
                          <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white">${(record.total_amount / 100).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={clsx(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              record.status === 'paid' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                              record.status === 'pending' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                              record.status === 'overdue' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            )}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={open => { if (!open) setDeleteConfirmId(null); }}
        title="Delete tenant?"
        description="This will permanently delete the tenant and all their data. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirmId) deleteSubTenant(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
      />
    </div>
  );
}
