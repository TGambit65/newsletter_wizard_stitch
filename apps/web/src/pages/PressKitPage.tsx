import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const BRAND_COLORS = [
  { name: 'Primary Blue', hex: '#0066FF', tailwind: 'primary-500', usage: 'CTAs, links, highlights' },
  { name: 'Primary Dark', hex: '#0052CC', tailwind: 'primary-600', usage: 'Hover states, pressed CTAs' },
  { name: 'Success Green', hex: '#10B981', tailwind: 'success', usage: 'Confirmations, success states' },
  { name: 'Warning Amber', hex: '#F59E0B', tailwind: 'warning', usage: 'Caution, pending, beta' },
  { name: 'Error Red', hex: '#EF4444', tailwind: 'error', usage: 'Errors, destructive actions' },
  { name: 'Neutral 900', hex: '#171717', tailwind: 'neutral-900', usage: 'Body text, headings' },
];

const LOGO_VARIANTS = [
  { name: 'Logo + Wordmark (Dark BG)', file: 'newsletter-wizard-logo-white.svg', bg: 'bg-neutral-900' },
  { name: 'Logo + Wordmark (Light BG)', file: 'newsletter-wizard-logo-dark.svg', bg: 'bg-white border border-neutral-200' },
  { name: 'Icon only', file: 'newsletter-wizard-icon.svg', bg: 'bg-primary-50' },
];

const BOILERPLATE =
  'Newsletter Wizard is an AI-powered newsletter platform that helps creators and businesses craft, schedule, and analyze engaging email campaigns. ' +
  'Powered by advanced language models, Newsletter Wizard turns knowledge bases into compelling newsletters in minutes, ' +
  'complete with brand voice preservation, multi-device previews, and real-time analytics.';

export function PressKitPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedBoilerplate, setCopiedBoilerplate] = useState(false);

  function copyColor(hex: string) {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  }

  function copyBoilerplate() {
    navigator.clipboard.writeText(BOILERPLATE);
    setCopiedBoilerplate(true);
    setTimeout(() => setCopiedBoilerplate(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          {/* Inline wand SVG icon */}
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 3l14 14M5 17L3 21l4-2M19 3l-2 4-2-2 2-4 2 2zM3 3l4 2-2 2-4-2 2-2z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-3">Press Kit</h1>
        <p className="text-lg text-neutral-500 max-w-xl mx-auto">
          Official brand assets, guidelines, and boilerplate for media coverage of Newsletter Wizard.
        </p>
      </div>

      {/* About */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">About Newsletter Wizard</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">{BOILERPLATE}</p>
          <button
            onClick={copyBoilerplate}
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            {copiedBoilerplate ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedBoilerplate ? 'Copied!' : 'Copy boilerplate'}
          </button>
        </div>
      </section>

      {/* Logos */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Logo assets</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {LOGO_VARIANTS.map(logo => (
            <div key={logo.name} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className={`h-32 flex items-center justify-center ${logo.bg}`}>
                {/* Representative logo placeholder — real assets served from /public/brand/ */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 3l14 14M5 17L3 21l4-2" />
                    </svg>
                  </div>
                  {logo.name !== 'Icon only' && (
                    <span className={`font-semibold text-sm ${logo.bg.includes('neutral-900') ? 'text-white' : 'text-neutral-900'}`}>
                      Newsletter Wizard
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">{logo.name}</p>
                <div className="flex gap-2">
                  <a
                    href={`/brand/${logo.file}`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    SVG
                  </a>
                  <a
                    href={`/brand/${logo.file.replace('.svg', '.png')}`}
                    download
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PNG
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Please do not modify the logo. Use on backgrounds with sufficient contrast only.
        </p>
      </section>

      {/* Brand colors */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Brand colors</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BRAND_COLORS.map(color => (
            <div key={color.hex} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
              <div className="h-16" style={{ backgroundColor: color.hex }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm text-neutral-900 dark:text-white">{color.name}</p>
                  <button
                    onClick={() => copyColor(color.hex)}
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  >
                    {copiedColor === color.hex ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {color.hex}
                  </button>
                </div>
                <p className="text-xs text-neutral-500">{color.usage}</p>
                <p className="text-xs text-neutral-400 font-mono mt-1">{color.tailwind}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Typography</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
          <div>
            <p className="text-xs text-neutral-400 mb-1">Primary font — headings & UI</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white font-sans">Inter</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-1">Mono font — code & technical</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-white font-mono">JetBrains Mono</p>
          </div>
        </div>
      </section>

      {/* Media contact */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Media contact</h2>
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Press inquiries</p>
              <a href="mailto:press@newsletterwizard.io" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                press@newsletterwizard.io
              </a>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Partnership inquiries</p>
              <a href="mailto:partners@newsletterwizard.io" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                partners@newsletterwizard.io
              </a>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Website</p>
              <a
                href="https://newsletterwizard.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                newsletterwizard.io
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Response time</p>
              <p className="text-neutral-700 dark:text-neutral-300 font-medium">Within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download all */}
      <section className="text-center pb-8">
        <a
          href="/brand/newsletter-wizard-press-kit.zip"
          download
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download complete press kit (.zip)
        </a>
        <p className="mt-3 text-sm text-neutral-400">
          Includes all logo variants, brand guidelines PDF, and product screenshots.
        </p>
      </section>
    </div>
  );
}
