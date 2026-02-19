import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import {
  Wand2, Database, Globe, Youtube, FileText, Share2,
  BarChart3, ChevronRight, ArrowRight, CheckCircle, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

const ONBOARDING_KEY = (userId: string) => `onboarding-complete-${userId}`;

export function markOnboardingComplete(userId: string) {
  localStorage.setItem(ONBOARDING_KEY(userId), 'true');
}

export function hasCompletedOnboarding(userId?: string | null): boolean {
  if (!userId) return false;
  return localStorage.getItem(ONBOARDING_KEY(userId)) === 'true';
}

const SOURCE_TYPES = [
  { icon: Globe, label: 'Website URL', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { icon: Youtube, label: 'YouTube Video', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { icon: FileText, label: 'Document', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { icon: Database, label: 'Manual Note', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { icon: Share2, label: 'RSS Feed', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { icon: BarChart3, label: 'Google Drive', color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
];

const STEPS = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Knowledge' },
  { id: 3, label: 'Repurpose' },
  { id: 4, label: 'Ready' },
];

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const { user, profile } = useAuth();
  const { config } = useWhiteLabel();
  const navigate = useNavigate();

  function complete() {
    if (user) markOnboardingComplete(user.id);
    navigate('/dashboard', { replace: true });
  }

  function skip() {
    complete();
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* Progress header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: config.primary_color }}
          >
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-neutral-900 dark:text-white">{config.brand_name}</span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={clsx(
                'transition-all duration-300',
                s.id === step
                  ? 'w-6 h-2 rounded-full bg-primary-500'
                  : s.id < step
                  ? 'w-2 h-2 rounded-full bg-primary-300'
                  : 'w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600'
              )}
            />
          ))}
        </div>

        <button
          onClick={skip}
          className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div className="text-center">
              {/* Animated hero illustration */}
              <div className="relative mx-auto mb-8 w-32 h-32">
                <div
                  className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl"
                  style={{ backgroundColor: config.primary_color }}
                >
                  <Wand2 className="w-16 h-16 text-white" />
                </div>
                <span
                  className="absolute inset-0 rounded-3xl animate-ping opacity-15"
                  style={{ backgroundColor: config.primary_color }}
                />
                <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
              </div>

              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                Welcome, {firstName}!
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">
                {config.brand_name} turns your knowledge into
              </p>
              <p className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-8">
                polished newsletters in minutes.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { icon: Database, label: 'Add sources', desc: 'URLs, docs, videos' },
                  { icon: Wand2, label: 'AI generates', desc: 'Newsletter draft' },
                  { icon: Share2, label: 'Publish & share', desc: 'Email + social' },
                ].map((item) => (
                  <div key={item.label} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 text-center">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <item.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2 — Knowledge Base */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  Your Knowledge Base
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Add sources and the AI uses them as context to write your newsletters.
                  The more you add, the smarter it gets.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {SOURCE_TYPES.map((type) => (
                  <div
                    key={type.label}
                    className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 flex flex-col items-center text-center gap-2"
                  >
                    <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', type.color)}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{type.label}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-neutral-500 text-center mb-6">
                You can add sources at any time from the Knowledge Base page.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-[2] px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Repurposing */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  One Newsletter, Many Channels
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  After writing your newsletter, instantly generate social media posts
                  for every platform — tailored to each one's format and tone.
                </p>
              </div>

              {/* Before/after mockup */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Newsletter</p>
                  <div className="space-y-1.5">
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-4/5" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-primary-500">
                  <Wand2 className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-2">
                  {['Twitter', 'LinkedIn', 'Instagram'].map((platform) => (
                    <div key={platform} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-primary-100 dark:bg-primary-900/30" />
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-[2] px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Complete */}
          {step === 4 && (
            <div className="text-center">
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                You're all set!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                Start by adding knowledge sources or jump straight into creating your first newsletter.
              </p>

              <div className="space-y-3">
                <button
                  onClick={complete}
                  className="w-full px-6 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Create my first newsletter
                </button>
                <button
                  onClick={complete}
                  className="w-full px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Explore the dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
