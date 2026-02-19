import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TIER_LIMITS, SubscriptionTier } from '@/lib/supabase';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import {
  User,
  CreditCard,
  Link as LinkIcon,
  Check,
  ArrowRight,
  Mail,
  Zap,
  Key,
  Eye,
  EyeOff,
  Save,
  Mic,
  Plus,
  Trash2,
  RefreshCw,
  X,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';

type SettingsTab = 'profile' | 'billing' | 'integrations' | 'api-keys' | 'voice-profiles';

interface VoiceProfile {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  tone_markers: Record<string, string> | null;
  voice_prompt: string | null;
  training_samples: string[] | null;
  created_at: string;
}

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
  const [showSendgrid, setShowSendgrid] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  
  // ESP state
  const [espProvider, setEspProvider] = useState('sendgrid');
  const [mailchimpKey, setMailchimpKey] = useState('');
  const [convertkitKey, setConvertkitKey] = useState('');
  const [showMailchimp, setShowMailchimp] = useState(false);
  const [showConvertkit, setShowConvertkit] = useState(false);
  
  // Voice Profiles state
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceDesc, setNewVoiceDesc] = useState('');
  const [trainingSamples, setTrainingSamples] = useState<string[]>(['']);
  const [trainingProfile, setTrainingProfile] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'api-keys', name: 'API Keys', icon: Key },
    { id: 'voice-profiles', name: 'Voice Profiles', icon: Mic },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
  ];

  const currentTier = (tenant?.subscription_tier || 'free') as SubscriptionTier;
  const currentLimits = TIER_LIMITS[currentTier];

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
      setKeysLoaded(true);
    }
    loadSettings();
  }, [tenant?.id]);

  // Load voice profiles
  useEffect(() => {
    async function loadVoiceProfiles() {
      if (!tenant?.id) return;
      const { data } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      setVoiceProfiles(data || []);
    }
    loadVoiceProfiles();
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

  async function createVoiceProfile() {
    if (!tenant?.id || !newVoiceName) return;
    
    const { data, error } = await supabase
      .from('voice_profiles')
      .insert({
        tenant_id: tenant.id,
        name: newVoiceName,
        description: newVoiceDesc || null,
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to create voice profile');
      return;
    }
    
    setVoiceProfiles([data, ...voiceProfiles]);
    setShowVoiceModal(false);
    setNewVoiceName('');
    setNewVoiceDesc('');
  }

  async function deleteVoiceProfile(id: string) {
    setDeleteProfileId(id);
  }

  async function confirmDeleteVoiceProfile() {
    if (!deleteProfileId) return;
    await supabase.from('voice_profiles').delete().eq('id', deleteProfileId);
    setVoiceProfiles(voiceProfiles.filter(v => v.id !== deleteProfileId));
    setDeleteProfileId(null);
  }

  async function trainVoiceProfile(profileId: string) {
    const samples = trainingSamples.filter(s => s.trim().length > 50);
    if (samples.length === 0) {
      toast.warning('Please add at least one training sample (minimum 50 characters)');
      return;
    }
    
    setTraining(true);
    try {
      await api.trainVoice({
        voice_profile_id: profileId,
        training_samples: samples,
      });
      
      // Reload profiles
      const { data } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false });
      setVoiceProfiles(data || []);
      setTrainingProfile(null);
      setTrainingSamples(['']);
      toast.success('Voice profile trained successfully!');
    } catch (error) {
      console.error('Training error:', error);
      toast.error('Failed to train voice profile');
    } finally {
      setTraining(false);
    }
  }

  const plans = [
    { name: 'Free', tier: 'free' as SubscriptionTier, price: 0, features: ['10 knowledge sources', '5 newsletters/month', '50 AI generations', 'Basic analytics'] },
    { name: 'Creator', tier: 'creator' as SubscriptionTier, price: 39, features: ['50 knowledge sources', '25 newsletters/month', '250 AI generations', 'Advanced analytics', 'Voice profiles'] },
    { name: 'Pro', tier: 'pro' as SubscriptionTier, price: 99, popular: true, features: ['200 knowledge sources', '100 newsletters/month', '1,000 AI generations', 'A/B testing', 'Priority support'] },
    { name: 'Business', tier: 'business' as SubscriptionTier, price: 249, features: ['1,000 knowledge sources', '500 newsletters/month', '5,000 AI generations', 'Team collaboration', 'API access', 'Custom integrations'] }
  ];

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
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
          <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-700">
            <Link
              to="/partner"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Partner Portal</span>
            </Link>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">Profile Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                </div>

                <button onClick={saveProfile} disabled={saving} className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                {/* Appearance Settings */}
                <div className="pt-6 mt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-base font-medium text-neutral-900 dark:text-white mb-1">Appearance</h3>
                  <p className="text-sm text-neutral-500 mb-4">Choose your preferred theme</p>
                  <ThemeSwitcher />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">API Keys</h2>
              <p className="text-neutral-500 text-sm mb-6">Configure your AI provider and ESP API keys.</p>
              
              <div className="space-y-6">
                {/* AI Provider Keys */}
                <div className="space-y-4">
                  <h3 className="font-medium text-neutral-900 dark:text-white">AI Providers</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">OpenAI API Key</label>
                    <div className="relative">
                      <input
                        type={showOpenai ? 'text' : 'password'}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
                      />
                      <button type="button" onClick={() => setShowOpenai(!showOpenai)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showOpenai ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Anthropic API Key <span className="text-neutral-400">(Optional)</span></label>
                    <div className="relative">
                      <input
                        type={showAnthropic ? 'text' : 'password'}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm"
                      />
                      <button type="button" onClick={() => setShowAnthropic(!showAnthropic)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showAnthropic ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ESP Keys */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
                  <h3 className="font-medium text-neutral-900 dark:text-white">Email Service Provider</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Default ESP Provider</label>
                    <select
                      value={espProvider}
                      onChange={(e) => setEspProvider(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailchimp">Mailchimp</option>
                      <option value="convertkit">ConvertKit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">SendGrid API Key</label>
                    <div className="relative">
                      <input type={showSendgrid ? 'text' : 'password'} value={sendgridKey} onChange={(e) => setSendgridKey(e.target.value)} placeholder="SG..." className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm" />
                      <button type="button" onClick={() => setShowSendgrid(!showSendgrid)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showSendgrid ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Mailchimp API Key</label>
                    <div className="relative">
                      <input type={showMailchimp ? 'text' : 'password'} value={mailchimpKey} onChange={(e) => setMailchimpKey(e.target.value)} placeholder="xxx-dc" className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm" />
                      <button type="button" onClick={() => setShowMailchimp(!showMailchimp)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showMailchimp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">ConvertKit API Secret</label>
                    <div className="relative">
                      <input type={showConvertkit ? 'text' : 'password'} value={convertkitKey} onChange={(e) => setConvertkitKey(e.target.value)} placeholder="API Secret" className="w-full px-4 py-3 pr-12 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm" />
                      <button type="button" onClick={() => setShowConvertkit(!showConvertkit)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                        {showConvertkit ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <button onClick={saveApiKeys} disabled={savingKeys} className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {savingKeys ? 'Saving...' : 'Save API Keys'}
                  </button>
                  {keysSaved && <span className="text-success flex items-center gap-1 text-sm"><Check className="w-4 h-4" /> Saved successfully</span>}
                </div>

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Security Note:</strong> Your API keys are stored securely and are only used server-side.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice-profiles' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Voice Profiles</h2>
                    <p className="text-neutral-500 text-sm">Train AI to write in your unique voice</p>
                  </div>
                  <button onClick={() => setShowVoiceModal(true)} className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Voice
                  </button>
                </div>

                {voiceProfiles.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    <Mic className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No voice profiles yet</p>
                    <p className="text-sm">Create one to train AI on your writing style</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voiceProfiles.map((voice) => (
                      <div key={voice.id} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-neutral-900 dark:text-white">{voice.name}</h3>
                            {voice.description && <p className="text-sm text-neutral-500 mt-1">{voice.description}</p>}
                            {voice.tone_markers && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(voice.tone_markers).map(([key, value]) => (
                                  <span key={key} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-xs rounded-full">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setTrainingProfile(voice.id);
                                setTrainingSamples(voice.training_samples?.length ? voice.training_samples : ['']);
                              }}
                              className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteVoiceProfile(voice.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {trainingProfile === voice.id && (
                          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <h4 className="font-medium text-neutral-900 dark:text-white mb-2">Training Samples</h4>
                            <p className="text-sm text-neutral-500 mb-3">Paste examples of your writing (at least 50 characters each)</p>
                            
                            {trainingSamples.map((sample, idx) => (
                              <div key={idx} className="mb-3">
                                <textarea
                                  value={sample}
                                  onChange={(e) => {
                                    const newSamples = [...trainingSamples];
                                    newSamples[idx] = e.target.value;
                                    setTrainingSamples(newSamples);
                                  }}
                                  placeholder="Paste a writing sample here..."
                                  rows={4}
                                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
                                />
                              </div>
                            ))}
                            
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setTrainingSamples([...trainingSamples, ''])}
                                className="text-sm text-primary-500 hover:underline"
                              >
                                + Add another sample
                              </button>
                              <button
                                onClick={() => trainVoiceProfile(voice.id)}
                                disabled={training}
                                className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {training ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                                {training ? 'Training...' : 'Train Voice'}
                              </button>
                              <button onClick={() => setTrainingProfile(null)} className="text-sm text-neutral-500 hover:underline">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Current Plan</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">{currentTier}</p>
                    <p className="text-neutral-500">${currentLimits.price}/month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">Usage this period</p>
                    <p className="font-medium text-neutral-900 dark:text-white">8 / {currentLimits.aiGenerations} AI generations</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Available Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div key={plan.tier} className={clsx('rounded-xl border-2 p-6 relative', currentTier === plan.tier ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800')}>
                      {plan.popular && <span className="absolute -top-3 left-4 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">Popular</span>}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{plan.name}</h3>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">${plan.price}<span className="text-sm font-normal text-neutral-500">/mo</span></p>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Check className="w-4 h-4 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {currentTier === plan.tier ? (
                        <button disabled className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 font-medium rounded-lg">Current Plan</button>
                      ) : (
                        <button onClick={() => handleUpgrade(plan.tier)} disabled={upgrading === plan.tier} className="w-full py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                          {upgrading === plan.tier ? 'Processing...' : 'Upgrade'} <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Integrations</h2>
                <p className="text-neutral-500 text-sm mt-1">Connect your favorite tools</p>
              </div>
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {integrations.map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <integration.icon className="w-6 h-6 text-neutral-500" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{integration.name}</p>
                        <p className="text-sm text-neutral-500">{integration.description}</p>
                      </div>
                    </div>
                    <button className={clsx('px-4 py-2 rounded-lg font-medium text-sm transition-colors', integration.connected ? 'bg-success/10 text-success' : 'bg-primary-500 text-white hover:bg-primary-600')}>
                      {integration.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete voice profile confirmation */}
      <ConfirmDialog
        open={!!deleteProfileId}
        onOpenChange={(open) => { if (!open) setDeleteProfileId(null); }}
        title="Delete voice profile?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteVoiceProfile}
      />

      {/* Create Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Create Voice Profile</h3>
              <button onClick={() => setShowVoiceModal(false)} className="text-neutral-500 hover:text-neutral-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Name</label>
                <input type="text" value={newVoiceName} onChange={(e) => setNewVoiceName(e.target.value)} placeholder="e.g., Professional, Casual, Brand Voice" className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Description (optional)</label>
                <textarea value={newVoiceDesc} onChange={(e) => setNewVoiceDesc(e.target.value)} placeholder="Describe this voice style..." rows={3} className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowVoiceModal(false)} className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700">Cancel</button>
                <button onClick={createVoiceProfile} disabled={!newVoiceName} className="flex-1 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
