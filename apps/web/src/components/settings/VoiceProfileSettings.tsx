import { useState, useEffect } from 'react';
import { Mic, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/Dialog';

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

interface VoiceProfileSettingsProps {
  tenantId: string;
}

export function VoiceProfileSettings({ tenantId }: VoiceProfileSettingsProps) {
  const toast = useToast();
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceDesc, setNewVoiceDesc] = useState('');
  const [trainingSamples, setTrainingSamples] = useState<string[]>(['']);
  const [trainingProfile, setTrainingProfile] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function loadVoiceProfiles() {
      const { data } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      setVoiceProfiles(data || []);
    }
    loadVoiceProfiles();
  }, [tenantId]);

  async function createVoiceProfile() {
    if (!newVoiceName) return;
    const { data, error } = await supabase
      .from('voice_profiles')
      .insert({ tenant_id: tenantId, name: newVoiceName, description: newVoiceDesc || null })
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

  async function confirmDeleteVoiceProfile() {
    if (!deleteProfileId) return;
    await supabase.from('voice_profiles').delete().eq('id', deleteProfileId);
    setVoiceProfiles(voiceProfiles.filter((v) => v.id !== deleteProfileId));
    setDeleteProfileId(null);
  }

  async function trainVoiceProfile(profileId: string) {
    const samples = trainingSamples.filter((s) => s.trim().length > 50);
    if (samples.length === 0) {
      toast.warning('Please add at least one training sample (minimum 50 characters)');
      return;
    }
    setTraining(true);
    try {
      await api.trainVoice({ voice_profile_id: profileId, training_samples: samples });
      const { data } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-200 dark:border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Voice Profiles</h2>
            <p className="text-neutral-500 text-sm">Train AI to write in your unique voice</p>
          </div>
          <button
            onClick={() => setShowVoiceModal(true)}
            className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
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
              <div key={voice.id} className="p-4 border border-neutral-200 dark:border-white/10 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-white">{voice.name}</h3>
                    {voice.description && (
                      <p className="text-sm text-neutral-500 mt-1">{voice.description}</p>
                    )}
                    {voice.tone_markers && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(voice.tone_markers).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-xs rounded-full"
                          >
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
                        setTrainingSamples(
                          voice.training_samples?.length ? voice.training_samples : ['']
                        );
                      }}
                      className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteProfileId(voice.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {trainingProfile === voice.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-white/10">
                    <h4 className="font-medium text-neutral-900 dark:text-white mb-2">
                      Training Samples
                    </h4>
                    <p className="text-sm text-neutral-500 mb-3">
                      Paste examples of your writing (at least 50 characters each)
                    </p>
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
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-background-dark border border-neutral-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
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
                        {training ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                        {training ? 'Training...' : 'Train Voice'}
                      </button>
                      <button
                        onClick={() => setTrainingProfile(null)}
                        className="text-sm text-neutral-500 hover:underline"
                      >
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

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteProfileId}
        onOpenChange={(open) => {
          if (!open) setDeleteProfileId(null);
        }}
        title="Delete voice profile?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteVoiceProfile}
      />

      {/* Create Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-surface-dark rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Create Voice Profile
              </h3>
              <button
                onClick={() => setShowVoiceModal(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  placeholder="e.g., Professional, Casual, Brand Voice"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-background-dark border border-neutral-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={newVoiceDesc}
                  onChange={(e) => setNewVoiceDesc(e.target.value)}
                  placeholder="Describe this voice style..."
                  rows={3}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-background-dark border border-neutral-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={createVoiceProfile}
                  disabled={!newVoiceName}
                  className="flex-1 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
