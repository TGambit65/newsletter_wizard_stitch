import { callEdgeFunction } from './core';

interface TrainVoiceRequest {
  voice_profile_id: string;
  training_samples: string[];
}

interface TrainVoiceResponse {
  success:      boolean;
  tone_markers: Record<string, string>;
  vocabulary:   Record<string, unknown>;
  voice_prompt: string;
}

export interface PreviewVoiceRequest {
  tenant_id:    string;
  sample_text:  string;
  tone_markers: {
    archetype:    string;
    formality:    number;
    humor:        number;
    technicality: number;
    energy:       number;
  };
}

export async function trainVoice(request: TrainVoiceRequest): Promise<TrainVoiceResponse> {
  return callEdgeFunction('train-voice', request);
}

export async function previewVoice(request: PreviewVoiceRequest): Promise<{ rewritten_text: string }> {
  return callEdgeFunction('preview-voice', request);
}
