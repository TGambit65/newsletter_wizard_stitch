import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, SubscriptionTier } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import {
  User,
  CreditCard,
  Link as LinkIcon,
  Mail,
  Zap,
  Key,
  Mic,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';
import {
  ProfileSettings,
  ApiKeySettings,
  VoiceProfileSettings,
  BillingSettings,
  IntegrationSettings,
} from '@/components/settings';

type SettingsTab = 'profile' | 'billing' | 'integrations' | 'api-keys' | 'voice-profiles';

export function SettingsPage() {
  const { profile, tenant } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  
  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [sendgridKey, setSendgridKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);

  // ESP state
  const [espProvider, setEspProvider] = useState('sendgrid');
  const [mailchimpKey, setMailchimpKey] = useState('');
  const [convertkitKey, setConvertkitKey] = useState('');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'api-keys', name: 'API Keys', icon: Key },
    { id: 'voice-profiles', name: 'Voice Profiles', icon: Mic },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
  ];

  const currentTier = (tenant?.subscription_tier || 'free') as SubscriptionTier;

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      if (!tenant?.id) return;
      
      const { data } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();
      
      if (data) {
        setOpenaiKey(data.openai_api_key || '');
        setAnthropicKey(data.anthropic_api_key || '');
        setSendgridKey(data.sendgrid_api_key || '');
        setMailchimpKey(data.mailchimp_api_key || '');
        setConvertkitKey(data.convertkit_api_key || '');
        setEspProvider(data.esp_provider || 'sendgrid');
      }
    }
    loadSettings();
  }, [tenant?.id]);

  async function saveApiKeys() {
    if (!tenant?.id) return;
    setSavingKeys(true);
    setKeysSaved(false);
    
    try {
      const { error } = await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: tenant.id,
          openai_api_key: openaiKey || null,
          anthropic_api_key: anthropicKey || null,
          sendgrid_api_key: sendgridKey || null,
          mailchimp_api_key: mailchimpKey || null,
          convertkit_api_key: convertkitKey || null,
          esp_provider: espProvider,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tenant_id' });
      
      if (error) throw error;
      setKeysSaved(true);
      setTimeout(() => setKeysSaved(false), 3000);
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast.error('Failed to save API keys');
    } finally {
      setSavingKeys(false);
    }
  }

  const integrations = [
    { name: 'SendGrid', description: 'Email delivery service', connected: !!sendgridKey, icon: Mail },
    { name: 'Mailchimp', description: 'Marketing automation', connected: !!mailchimpKey, icon: Mail },
    { name: 'ConvertKit', description: 'Creator marketing', connected: !!convertkitKey, icon: Mail },
    { name: 'Zapier', description: 'Connect with 5000+ apps', connected: false, icon: Zap },
  ];

  async function handleUpgrade(tier: SubscriptionTier) {
    setUpgrading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planType: tier, customerEmail: profile?.email }
      });
      if (error) throw error;
      if (data?.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Stripe integration requires API key configuration. Contact support.');
    } finally {
      setUpgrading(null);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <nav className="w-full md:w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
          <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-white/10">
            <Link
              to="/partner"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Partner Portal</span>
            </Link>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <ProfileSettings
              fullName={fullName}
              email={email}
              saving={saving}
              onFullNameChange={setFullName}
              onSave={saveProfile}
            />
          )}

          {activeTab === 'api-keys' && (
            <ApiKeySettings
              openaiKey={openaiKey}
              anthropicKey={anthropicKey}
              sendgridKey={sendgridKey}
              mailchimpKey={mailchimpKey}
              convertkitKey={convertkitKey}
              espProvider={espProvider}
              savingKeys={savingKeys}
              keysSaved={keysSaved}
              onOpenaiChange={setOpenaiKey}
              onAnthropicChange={setAnthropicKey}
              onSendgridChange={setSendgridKey}
              onMailchimpChange={setMailchimpKey}
              onConvertkitChange={setConvertkitKey}
              onEspProviderChange={setEspProvider}
              onSave={saveApiKeys}
            />
          )}

          {activeTab === 'voice-profiles' && (
            <VoiceProfileSettings tenantId={tenant!.id} />
          )}

          {activeTab === 'billing' && (
            <BillingSettings currentTier={currentTier} upgrading={upgrading} onUpgrade={handleUpgrade} />
          )}

          {activeTab === 'integrations' && (
            <IntegrationSettings integrations={integrations} />
          )}
        </div>
      </div>
    </div>
  );
}
