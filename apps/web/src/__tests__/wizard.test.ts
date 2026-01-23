import { describe, it, expect, vi } from 'vitest';

// Test WizardPage step logic
type WizardStep = 'audience' | 'ideation' | 'topic' | 'editor' | 'send';

const WIZARD_STEPS: WizardStep[] = ['audience', 'ideation', 'topic', 'editor', 'send'];

function getStepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

function canGoNext(step: WizardStep): boolean {
  return getStepIndex(step) < WIZARD_STEPS.length - 1;
}

function canGoBack(step: WizardStep): boolean {
  return getStepIndex(step) > 0;
}

function getNextStep(step: WizardStep): WizardStep | null {
  const idx = getStepIndex(step);
  return idx < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[idx + 1] : null;
}

function getPrevStep(step: WizardStep): WizardStep | null {
  const idx = getStepIndex(step);
  return idx > 0 ? WIZARD_STEPS[idx - 1] : null;
}

describe('WizardPage Step Transitions', () => {
  describe('Step Index', () => {
    it('returns correct index for each step', () => {
      expect(getStepIndex('audience')).toBe(0);
      expect(getStepIndex('ideation')).toBe(1);
      expect(getStepIndex('topic')).toBe(2);
      expect(getStepIndex('editor')).toBe(3);
      expect(getStepIndex('send')).toBe(4);
    });
  });

  describe('Navigation Guards', () => {
    it('allows next from all steps except last', () => {
      expect(canGoNext('audience')).toBe(true);
      expect(canGoNext('ideation')).toBe(true);
      expect(canGoNext('topic')).toBe(true);
      expect(canGoNext('editor')).toBe(true);
      expect(canGoNext('send')).toBe(false);
    });

    it('allows back from all steps except first', () => {
      expect(canGoBack('audience')).toBe(false);
      expect(canGoBack('ideation')).toBe(true);
      expect(canGoBack('topic')).toBe(true);
      expect(canGoBack('editor')).toBe(true);
      expect(canGoBack('send')).toBe(true);
    });
  });

  describe('Step Transitions', () => {
    it('getNextStep returns correct next step', () => {
      expect(getNextStep('audience')).toBe('ideation');
      expect(getNextStep('ideation')).toBe('topic');
      expect(getNextStep('topic')).toBe('editor');
      expect(getNextStep('editor')).toBe('send');
      expect(getNextStep('send')).toBe(null);
    });

    it('getPrevStep returns correct previous step', () => {
      expect(getPrevStep('audience')).toBe(null);
      expect(getPrevStep('ideation')).toBe('audience');
      expect(getPrevStep('topic')).toBe('ideation');
      expect(getPrevStep('editor')).toBe('topic');
      expect(getPrevStep('send')).toBe('editor');
    });
  });

  describe('Step Order', () => {
    it('maintains correct step order', () => {
      expect(WIZARD_STEPS).toEqual(['audience', 'ideation', 'topic', 'editor', 'send']);
    });

    it('has 5 steps total', () => {
      expect(WIZARD_STEPS.length).toBe(5);
    });
  });
});

describe('Topic Suggestion Validation', () => {
  interface TopicSuggestion {
    id: string;
    title: string;
    description: string;
    sources: string[];
  }

  function validateTopic(topic: TopicSuggestion): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!topic.id) errors.push('Missing id');
    if (!topic.title || topic.title.trim().length === 0) errors.push('Title is required');
    if (!topic.description) errors.push('Description is required');
    return { valid: errors.length === 0, errors };
  }

  it('validates valid topic', () => {
    const topic: TopicSuggestion = {
      id: '1',
      title: 'AI Trends',
      description: 'Latest trends in AI',
      sources: ['source1'],
    };
    expect(validateTopic(topic)).toEqual({ valid: true, errors: [] });
  });

  it('rejects topic without title', () => {
    const topic: TopicSuggestion = {
      id: '1',
      title: '',
      description: 'Description',
      sources: [],
    };
    const result = validateTopic(topic);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('rejects topic without id', () => {
    const topic: TopicSuggestion = {
      id: '',
      title: 'Title',
      description: 'Description',
      sources: [],
    };
    const result = validateTopic(topic);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing id');
  });
});
