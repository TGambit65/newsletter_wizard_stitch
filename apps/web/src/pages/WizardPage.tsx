import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, KnowledgeSource } from '@/lib/supabase';
import { api } from '@/lib/api';
import { 
  Wand2, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Lightbulb,
  Edit3,
  Send,
  Sparkles,
  RefreshCw,
  Database,
  Users,
  Target,
  Mic,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import clsx from 'clsx';

type WizardStep = 'audience' | 'ideation' | 'topic' | 'editor' | 'send';

interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  sources: string[];
}

interface VoiceProfile {
  id: string;
  name: string;
  description: string | null;
}

interface AudiencePersona {
  id: string;
  name: string;
  description: string;
  engagementLevel: 'high' | 'medium' | 'low';
  size: number;
}

export function WizardPage() {
  const { tenant, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('audience');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicSuggestion | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Audience state
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  
  // Ideation state
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [contentGaps, setContentGaps] = useState<string[]>([]);
  
  // Draft auto-save state
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Draft storage key
  const getDraftKey = useCallback(() => {
    return tenant ? `wizard_draft_${tenant.id}` : null;
  }, [tenant]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    const key = getDraftKey();
    if (!key) return;
    
    const draft = {
      step,
      selectedAudience,
      selectedVoice,
      selectedTopic,
      customTopic,
      generatedContent,
      subjectLine,
      savedAt: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [getDraftKey, step, selectedAudience, selectedVoice, selectedTopic, customTopic, generatedContent, subjectLine]);

  // Restore draft from localStorage
  const restoreDraft = useCallback(() => {
    const key = getDraftKey();
    if (!key || draftRestored) return;
    
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.step) setStep(draft.step);
        if (draft.selectedAudience) setSelectedAudience(draft.selectedAudience);
        if (draft.selectedVoice) setSelectedVoice(draft.selectedVoice);
        if (draft.selectedTopic) setSelectedTopic(draft.selectedTopic);
        if (draft.customTopic) setCustomTopic(draft.customTopic);
        if (draft.generatedContent) setGeneratedContent(draft.generatedContent);
        if (draft.subjectLine) setSubjectLine(draft.subjectLine);
        if (draft.savedAt) setLastSaved(new Date(draft.savedAt));
      }
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
    setDraftRestored(true);
  }, [getDraftKey, draftRestored]);

  // Clear draft
  const clearDraft = useCallback(() => {
    const key = getDraftKey();
    if (key) {
      localStorage.removeItem(key);
      setLastSaved(null);
    }
  }, [getDraftKey]);

  // Auto-save draft when state changes
  useEffect(() => {
    if (draftRestored && tenant) {
      const timeoutId = setTimeout(saveDraft, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [step, selectedAudience, selectedVoice, selectedTopic, customTopic, generatedContent, subjectLine, saveDraft, draftRestored, tenant]);

  useEffect(() => {
    if (tenant) {
      loadSources();
      loadVoiceProfiles();
      generateTrendingTopics();
      restoreDraft();
    }
  }, [tenant, restoreDraft]);

  async function loadSources() {
    const { data } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .eq('status', 'ready');
    setSources(data || []);
  }

  async function loadVoiceProfiles() {
    const { data } = await supabase
      .from('voice_profiles')
      .select('id, name, description')
      .eq('tenant_id', tenant!.id);
    setVoiceProfiles(data || []);
  }

  function generateTrendingTopics() {
    // Generate topics based on knowledge base content
    setTrendingTopics([
      'Industry Trends Update',
      'Expert Insights Roundup',
      'Weekly Digest',
      'Behind the Scenes',
      'Customer Success Stories'
    ]);
    setContentGaps([
      'How-to guides',
      'Case studies',
      'Product comparisons',
      'Industry news analysis'
    ]);
  }

  // Mock audience personas
  const audiencePersonas: AudiencePersona[] = [
    { id: 'all', name: 'All Subscribers', description: 'Your entire mailing list', engagementLevel: 'medium', size: 2500 },
    { id: 'engaged', name: 'Highly Engaged', description: 'Opened 3+ of last 5 emails', engagementLevel: 'high', size: 890 },
    { id: 'new', name: 'New Subscribers', description: 'Joined in the last 30 days', engagementLevel: 'medium', size: 340 },
    { id: 'inactive', name: 'Re-engagement', description: "Haven't opened in 60+ days", engagementLevel: 'low', size: 520 }
  ];

  const topicSuggestions: TopicSuggestion[] = [
    {
      id: '1',
      title: 'Weekly Industry Roundup',
      description: 'Summarize the latest trends and news from your knowledge base',
      sources: sources.slice(0, 3).map(s => s.title)
    },
    {
      id: '2',
      title: 'Expert Tips & Best Practices',
      description: 'Share actionable insights extracted from your content',
      sources: sources.slice(0, 2).map(s => s.title)
    },
    {
      id: '3',
      title: 'Product Updates Digest',
      description: 'Highlight recent developments and features',
      sources: sources.slice(0, 2).map(s => s.title)
    }
  ];

  async function generateNewsletter() {
    if (!tenant) return;
    setGenerating(true);
    const topic = selectedTopic?.title || customTopic;
    
    try {
      const { results } = await api.ragSearch({
        tenant_id: tenant.id,
        query: topic,
        limit: 5
      });

      const generated = await api.generateNewsletter({
        tenant_id: tenant.id,
        topic,
        context: results,
        voice_profile_id: selectedVoice || undefined
      });

      setGeneratedContent(generated.content_html);
      setSubjectLine(generated.subject_line);
      setStep('editor');
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function saveNewsletter(navigateToEditor = false) {
    if (!tenant) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          tenant_id: tenant.id,
          title: selectedTopic?.title || customTopic || 'Untitled Newsletter',
          subject_line: subjectLine,
          content_html: generatedContent,
          status: 'draft',
          created_by: profile?.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      // Clear the draft after successful save
      clearDraft();
      
      if (navigateToEditor && data?.id) {
        navigate(`/newsletters/${data.id}/edit`);
      }
    } catch (error) {
      console.error('Error saving newsletter:', error);
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    { id: 'audience', name: 'Audience', icon: Users },
    { id: 'ideation', name: 'Ideation', icon: Lightbulb },
    { id: 'topic', name: 'Topic', icon: Target },
    { id: 'editor', name: 'Editor', icon: Edit3 },
    { id: 'send', name: 'Send', icon: Send },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Draft indicator */}
      {lastSaved && (
        <div className="mb-4 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900 rounded-lg px-4 py-2">
          <span className="text-sm text-neutral-500">
            Draft auto-saved at {lastSaved.toLocaleTimeString()}
          </span>
          <button
            onClick={clearDraft}
            className="text-sm text-error hover:text-error/80 transition-colors"
          >
            Discard Draft
          </button>
        </div>
      )}

      {/* Step Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => index < currentStepIndex && setStep(s.id as WizardStep)}
                disabled={index > currentStepIndex}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all',
                  step === s.id
                    ? 'bg-primary-500 text-white'
                    : index < currentStepIndex
                      ? 'bg-success text-white cursor-pointer'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                )}
              >
                {index < currentStepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">{s.name}</span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Audience Analysis */}
      {step === 'audience' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Who are you writing for?
            </h1>
            <p className="text-neutral-500">
              Select your target audience for personalized content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {audiencePersonas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedAudience(persona.id)}
                className={clsx(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedAudience === persona.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{persona.name}</h3>
                    <p className="text-sm text-neutral-500 mt-1">{persona.description}</p>
                  </div>
                  <span className={clsx(
                    'px-2 py-0.5 text-xs rounded-full',
                    persona.engagementLevel === 'high' ? 'bg-success/10 text-success' :
                    persona.engagementLevel === 'medium' ? 'bg-warning/10 text-warning' :
                    'bg-neutral-100 text-neutral-500'
                  )}>
                    {persona.engagementLevel}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <BarChart3 className="w-4 h-4" />
                  {persona.size.toLocaleString()} subscribers
                </div>
              </button>
            ))}
          </div>

          {/* Engagement Metrics */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 mb-6">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-3">Audience Insights</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-500">42%</p>
                <p className="text-xs text-neutral-500">Avg Open Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">8.5%</p>
                <p className="text-xs text-neutral-500">Click Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-info">3.2</p>
                <p className="text-xs text-neutral-500">Avg Emails/Subscriber</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep('ideation')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Content Ideation */}
      {step === 'ideation' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Content Inspiration
            </h1>
            <p className="text-neutral-500">
              Discover trending topics and content opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Trending Topics */}
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <h3 className="font-medium text-neutral-900 dark:text-white">Trending Topics</h3>
              </div>
              <ul className="space-y-2">
                {trendingTopics.map((topic, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => {
                        setCustomTopic(topic);
                        setSelectedTopic(null);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      {topic}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content Gaps */}
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-warning" />
                <h3 className="font-medium text-neutral-900 dark:text-white">Content Gaps</h3>
              </div>
              <p className="text-xs text-neutral-500 mb-2">Topics your audience wants more of:</p>
              <div className="flex flex-wrap gap-2">
                {contentGaps.map((gap, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomTopic(gap);
                      setSelectedTopic(null);
                    }}
                    className="px-3 py-1.5 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full hover:border-primary-500 transition-colors"
                  >
                    {gap}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Content Blocks */}
          <div className="bg-gradient-to-r from-primary-50 to-info/10 dark:from-primary-900/20 dark:to-info/10 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className="font-medium text-neutral-900 dark:text-white">AI Suggested Content Blocks</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Key Takeaways', 'Expert Quote', 'Data Highlight', 'Call to Action'].map((block) => (
                <div key={block} className="px-3 py-2 bg-white dark:bg-neutral-800 rounded-lg text-sm text-center text-neutral-700 dark:text-neutral-300">
                  {block}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('audience')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={() => setStep('topic')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Topic Selection */}
      {step === 'topic' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              What would you like to write about?
            </h1>
            <p className="text-neutral-500">
              Choose a suggested topic or enter your own idea
            </p>
          </div>

          {sources.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-900 rounded-xl mb-6">
              <Database className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">Add sources to your knowledge base first</p>
              <button
                onClick={() => navigate('/knowledge-base')}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Add Sources
              </button>
            </div>
          ) : (
            <>
              {/* Voice Profile Selection */}
              {voiceProfiles.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Mic className="w-4 h-4 inline mr-1" /> Writing Voice
                  </label>
                  <select
                    value={selectedVoice || ''}
                    onChange={(e) => setSelectedVoice(e.target.value || null)}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Default Voice</option>
                    {voiceProfiles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Topic Suggestions */}
              <div className="space-y-3 mb-6">
                {topicSuggestions.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setCustomTopic('');
                    }}
                    className={clsx(
                      'w-full p-4 rounded-xl border-2 text-left transition-all',
                      selectedTopic?.id === topic.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className={clsx(
                        'w-5 h-5 mt-0.5',
                        selectedTopic?.id === topic.id ? 'text-primary-500' : 'text-neutral-400'
                      )} />
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{topic.title}</h3>
                        <p className="text-sm text-neutral-500 mt-1">{topic.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-neutral-800 px-4 text-sm text-neutral-500">or</span>
                </div>
              </div>

              <div className="mt-6">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    setSelectedTopic(null);
                  }}
                  placeholder="Enter your own topic..."
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep('ideation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={generateNewsletter}
              disabled={(!selectedTopic && !customTopic) || generating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Newsletter
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Editor */}
      {step === 'editor' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Subject Line
            </label>
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-lg"
            />
          </div>

          <div className="p-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Content
            </label>
            <textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm resize-none"
            />
          </div>

          <div className="flex justify-between p-6 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setStep('topic')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={() => setStep('send')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Send */}
      {step === 'send' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Ready to send?
            </h1>
            <p className="text-neutral-500">
              Review your newsletter before sending
            </p>
          </div>

          {/* Audience summary */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-500" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Target Audience:</span>
              </div>
              <span className="font-medium text-neutral-900 dark:text-white">
                {audiencePersonas.find(a => a.id === selectedAudience)?.name || 'All Subscribers'}
              </span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-6 mb-6">
            <div className="mb-4">
              <span className="text-xs text-neutral-500">Subject:</span>
              <p className="font-medium text-neutral-900 dark:text-white">{subjectLine}</p>
            </div>
            <div className="prose dark:prose-invert max-w-none text-sm">
              <pre className="whitespace-pre-wrap bg-transparent text-neutral-700 dark:text-neutral-300">{generatedContent.substring(0, 500)}...</pre>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep('editor')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => saveNewsletter(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => saveNewsletter(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Edit'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
