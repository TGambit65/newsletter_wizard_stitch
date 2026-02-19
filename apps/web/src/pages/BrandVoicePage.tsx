import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { AITrainingProgress } from '@/components/AITrainingProgress';
import { api } from '@/lib/api';
import {
  BookOpen,
  Laugh,
  Shield,
  Feather,
  BarChart2,
  Plus,
  Save,
  Trash2,
  Star,
  Wand2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

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

type Archetype = 'educator' | 'entertainer' | 'authority' | 'storyteller' | 'analyst';

interface ArchetypeConfig {
  id: Archetype;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  sliders: { formality: number; humor: number; technicality: number; energy: number };
}

const ARCHETYPES: ArchetypeConfig[] = [
  {
    id: 'educator',
    label: 'Educator',
    tagline: 'Clear, structured, builds understanding',
    icon: BookOpen,
    sliders: { formality: 70, humor: 20, technicality: 55, energy: 50 },
  },
  {
    id: 'entertainer',
    label: 'Entertainer',
    tagline: 'Fun, energetic, keeps readers engaged',
    icon: Laugh,
    sliders: { formality: 20, humor: 85, technicality: 20, energy: 90 },
  },
  {
    id: 'authority',
    label: 'Authority',
    tagline: 'Expert, confident, trusted perspective',
    icon: Shield,
    sliders: { formality: 85, humor: 10, technicality: 75, energy: 40 },
  },
  {
    id: 'storyteller',
    label: 'Storyteller',
    tagline: 'Narrative-driven, emotional, memorable',
    icon: Feather,
    sliders: { formality: 40, humor: 40, technicality: 25, energy: 65 },
  },
  {
    id: 'analyst',
    label: 'Analyst',
    tagline: 'Data-first, precise, evidence-based',
    icon: BarChart2,
    sliders: { formality: 80, humor: 5, technicality: 90, energy: 35 },
  },
];

interface SliderConfig {
  key: 'formality' | 'humor' | 'technicality' | 'energy';
  label: string;
  leftLabel: string;
  rightLabel: string;
  color: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'formality', label: 'Formality', leftLabel: 'Casual', rightLabel: 'Formal', color: 'primary' },
  { key: 'humor', label: 'Humor', leftLabel: 'Serious', rightLabel: 'Playful', color: 'warning' },
  { key: 'technicality', label: 'Technicality', leftLabel: 'Simple', rightLabel: 'Technical', color: 'info' },
  { key: 'energy', label: 'Energy', leftLabel: 'Calm', rightLabel: 'Energetic', color: 'success' },
];

type SliderValues = { formality: number; humor: number; technicality: number; energy: number };

function defaultSliders(): SliderValues {
  return { formality: 50, humor: 50, technicality: 50, energy: 50 };
}

function parseSliders(tm: Record<string, string> | null): SliderValues {
  if (!tm) return defaultSliders();
  return {
    formality: parseInt(tm.formality || '50', 10),
    humor: parseInt(tm.humor || '50', 10),
    technicality: parseInt(tm.technicality || '50', 10),
    energy: parseInt(tm.energy || '50', 10),
  };
}

export function BrandVoicePage() {
  const { tenant } = useAuth();
  const toast = useToast();

  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Edit state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [sliders, setSliders] = useState<SliderValues>(defaultSliders());
  const [saving, setSaving] = useState(false);

  // Training
  const [training, setTraining] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  // Playground
  const [playgroundText, setPlaygroundText] = useState('');
  const [playgroundResult, setPlaygroundResult] = useState('');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) loadProfiles();
  }, [tenant]);

  async function loadProfiles() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: true });
      setProfiles(data || []);
      if (data && data.length > 0 && !selectedId) {
        selectProfile(data[0]);
      }
    } catch {
      toast.error('Failed to load voice profiles');
    } finally {
      setLoading(false);
    }
  }

  function selectProfile(p: VoiceProfile) {
    setSelectedId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    const tm = p.tone_markers;
    setArchetype((tm?.archetype as Archetype) || null);
    setSliders(parseSliders(tm));
    setPlaygroundResult('');
    setPlaygroundText('');
  }

  function handleNewProfile() {
    setSelectedId(null);
    setName('New Voice Profile');
    setDescription('');
    setArchetype(null);
    setSliders(defaultSliders());
    setPlaygroundResult('');
    setPlaygroundText('');
  }

  function applyArchetype(a: ArchetypeConfig) {
    setArchetype(a.id);
    setSliders(a.sliders);
  }

  async function handleSave() {
    if (!tenant || !name.trim()) return;
    setSaving(true);
    try {
      const tone_markers: Record<string, string> = {
        archetype: archetype || '',
        formality: String(sliders.formality),
        humor: String(sliders.humor),
        technicality: String(sliders.technicality),
        energy: String(sliders.energy),
      };

      if (selectedId) {
        await supabase
          .from('voice_profiles')
          .update({ name: name.trim(), description: description || null, tone_markers })
          .eq('id', selectedId);
        setProfiles(prev => prev.map(p => p.id === selectedId
          ? { ...p, name: name.trim(), description: description || null, tone_markers }
          : p
        ));
        toast.success('Voice profile saved');
      } else {
        const { data, error } = await supabase
          .from('voice_profiles')
          .insert({
            tenant_id: tenant.id,
            name: name.trim(),
            description: description || null,
            tone_markers,
            is_default: profiles.length === 0,
          })
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setProfiles(prev => [...prev, data]);
          setSelectedId(data.id);
          toast.success('Voice profile created');
        }
      }
    } catch {
      toast.error('Failed to save voice profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleTrain() {
    if (!selectedId) {
      toast.error('Save the profile first before training');
      return;
    }
    const profile = profiles.find(p => p.id === selectedId);
    const samples = profile?.training_samples || [];
    if (samples.length === 0) {
      toast.error('Add training samples in Settings → Voice Profiles first');
      return;
    }
    setTrainingError(null);
    setTraining(true);
    try {
      await api.trainVoice({ voice_profile_id: selectedId, training_samples: samples });
    } catch (err) {
      setTrainingError(err instanceof Error ? err.message : 'Training failed');
    }
  }

  function handleTrainingComplete() {
    setTraining(false);
    toast.success('Voice model trained successfully');
  }

  function handleTrainingRetry() {
    setTrainingError(null);
    handleTrain();
  }

  const runPlayground = useCallback(async (text: string) => {
    if (!text.trim() || !archetype) return;
    setPlaygroundLoading(true);
    try {
      const tone_markers: Record<string, string> = {
        archetype: archetype || '',
        formality: String(sliders.formality),
        humor: String(sliders.humor),
        technicality: String(sliders.technicality),
        energy: String(sliders.energy),
      };
      // Optimistic mock — show a placeholder while real edge fn is not wired
      await new Promise(r => setTimeout(r, 1200));
      const arch = ARCHETYPES.find(a => a.id === archetype);
      setPlaygroundResult(
        `[${arch?.label || 'Voice'} style applied — ${sliders.formality > 60 ? 'formal' : 'casual'}, ${sliders.energy > 60 ? 'energetic' : 'measured'} tone]\n\n${text}`
      );
    } catch {
      setPlaygroundResult('Could not generate preview. Check your API keys in Settings.');
    } finally {
      setPlaygroundLoading(false);
    }
  }, [archetype, sliders]);

  function handlePlaygroundChange(text: string) {
    setPlaygroundText(text);
    setPlaygroundResult('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runPlayground(text), 1000);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await supabase.from('voice_profiles').delete().eq('id', deleteId);
      setProfiles(prev => prev.filter(p => p.id !== deleteId));
      if (selectedId === deleteId) {
        const remaining = profiles.filter(p => p.id !== deleteId);
        if (remaining.length > 0) selectProfile(remaining[0]);
        else handleNewProfile();
      }
      toast.success('Voice profile deleted');
    } catch {
      toast.error('Failed to delete voice profile');
    } finally {
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Brand Voice</h1>
          <p className="text-neutral-500 mt-1">Define how your AI writes — archetype, tone, and style</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: profile list */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">Voice Profiles</h2>
              <button
                onClick={handleNewProfile}
                aria-label="New voice profile"
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                <Plus className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectProfile(p)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    selectedId === p.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                  )}
                >
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold',
                    selectedId === p.id ? 'bg-primary-500 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                  )}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-sm font-medium truncate', selectedId === p.id ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-white')}>
                      {p.name}
                    </p>
                    {p.is_default && (
                      <span className="text-xs text-neutral-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  {selectedId === p.id && <ChevronRight className="w-4 h-4 text-primary-400 flex-shrink-0" />}
                </button>
              ))}
              {profiles.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-neutral-400">
                  No profiles yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main editor */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic info */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Profile Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Profile name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="e.g. Main Brand Voice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Brief description (optional)"
                />
              </div>
            </div>
          </div>

          {/* Archetype picker */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">Archetype</h2>
            <p className="text-sm text-neutral-500 mb-4">Select an archetype to pre-fill slider positions, then customize.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {ARCHETYPES.map(a => {
                const Icon = a.icon;
                const isSelected = archetype === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => applyArchetype(a)}
                    className={clsx(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                    )}
                  >
                    <div className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      isSelected ? 'bg-primary-500 text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={clsx('text-sm font-semibold', isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-900 dark:text-white')}>
                        {a.label}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{a.tagline}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="font-semibold text-neutral-900 dark:text-white mb-1">Tone Sliders</h2>
            <p className="text-sm text-neutral-500 mb-5">Fine-tune each dimension of your brand voice (0–100).</p>
            <div className="space-y-6">
              {SLIDERS.map(s => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{s.label}</label>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white w-8 text-right">{sliders[s.key]}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sliders[s.key]}
                      onChange={e => setSliders(prev => ({ ...prev, [s.key]: parseInt(e.target.value) }))}
                      className="w-full h-2 appearance-none cursor-pointer rounded-full bg-neutral-200 dark:bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, rgb(var(--color-primary-500)) 0%, rgb(var(--color-primary-500)) ${sliders[s.key]}%, rgb(229 231 235) ${sliders[s.key]}%, rgb(229 231 235) 100%)`
                      }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-neutral-400">{s.leftLabel}</span>
                      <span className="text-xs text-neutral-400">{s.rightLabel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Playground */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="w-4 h-4 text-primary-500" />
              <h2 className="font-semibold text-neutral-900 dark:text-white">Voice Playground</h2>
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Paste sample text to preview how your voice settings would rewrite it.
              {!archetype && (
                <span className="text-warning ml-1">Select an archetype first.</span>
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Your text</label>
                <textarea
                  value={playgroundText}
                  onChange={e => handlePlaygroundChange(e.target.value)}
                  disabled={!archetype}
                  rows={6}
                  placeholder="Paste a paragraph to preview..."
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm resize-none outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide">AI preview</label>
                  {playgroundLoading && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  )}
                </div>
                <div className="h-[144px] p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm overflow-y-auto">
                  {playgroundResult ? (
                    <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{playgroundResult}</p>
                  ) : (
                    <p className="text-neutral-400 italic">
                      {playgroundText ? 'Generating preview...' : 'Preview will appear here'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between gap-4 pb-6">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : selectedId ? 'Save Changes' : 'Create Profile'}
              </button>

              {selectedId && (
                <button
                  onClick={handleTrain}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Train Voice Model
                </button>
              )}
            </div>

            {selectedId && profiles.find(p => p.id === selectedId && !p.is_default) && (
              <button
                onClick={() => setDeleteId(selectedId)}
                className="p-2.5 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                aria-label="Delete profile"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Training Progress */}
      <AITrainingProgress
        open={training}
        onComplete={handleTrainingComplete}
        onRetry={handleTrainingRetry}
        error={trainingError}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        title="Delete voice profile?"
        description="This cannot be undone. Any newsletters using this profile will revert to default settings."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
