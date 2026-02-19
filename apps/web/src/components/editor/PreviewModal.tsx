import { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { sanitizeHtml } from '@/lib/sanitize';
import { api } from '@/lib/api';

type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: 'max-w-[650px]',
  tablet: 'max-w-[480px]',
  mobile: 'max-w-[375px]',
};

const SPAM_WORDS = [
  'free!!!', 'guaranteed', 'winner', "you've been selected", 'act now',
  'click here', 'make money', 'earn cash', 'no obligation', 'risk-free offer',
  'limited time offer', 'order now', 'buy direct', 'cash bonus',
];

interface QualityResult {
  subjectLength: { pass: boolean; value: number; message: string };
  hasContent: { pass: boolean };
  spamWords: { pass: boolean; found: string[] };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface RichQualityResult {
  readability_score: number;
  spam_score: number;
  spam_words_found: string[];
  missing_alt_text: string[];
  links_found: string[];
  overall_score: number;
  overall_grade: string;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-success bg-success/10',
  B: 'text-info bg-info/10',
  C: 'text-warning bg-warning/10',
  D: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  F: 'text-error bg-error/10',
};

function runQualityCheck(subject: string, html: string): QualityResult {
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const subjectLen = subject.trim().length;
  const subjectLength = {
    pass: subjectLen > 0 && subjectLen <= 50,
    value: subjectLen,
    message:
      subjectLen === 0
        ? 'No subject line set'
        : subjectLen > 50
        ? `${subjectLen} chars — aim for under 50`
        : `${subjectLen} chars — good`,
  };

  const hasContent = { pass: textContent.length > 50 };

  const textLower = textContent.toLowerCase();
  const foundSpam = SPAM_WORDS.filter((w) => textLower.includes(w));
  const spamWords = { pass: foundSpam.length === 0, found: foundSpam };

  const checks = [subjectLength.pass, hasContent.pass, spamWords.pass];
  const passing = checks.filter(Boolean).length;
  const grade: QualityResult['grade'] =
    passing === 3 ? 'A' : passing === 2 ? 'B' : passing === 1 ? 'C' : 'F';

  return { subjectLength, hasContent, spamWords, grade };
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  subjectLine: string;
  preheader: string;
}

export function PreviewModal({ isOpen, onClose, html, subjectLine, preheader }: PreviewModalProps) {
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [richQuality, setRichQuality] = useState<RichQualityResult | null>(null);
  const [richQualityLoading, setRichQualityLoading] = useState(false);

  if (!isOpen) return null;

  const quality = qualityResult ?? runQualityCheck(subjectLine, html);

  function handleClose() {
    setShowQualityPanel(false);
    setQualityResult(null);
    setRichQuality(null);
    onClose();
  }

  async function handleQualityToggle() {
    const localResult = runQualityCheck(subjectLine, html);
    setQualityResult(localResult);
    const wasOpen = showQualityPanel;
    setShowQualityPanel((v) => !v);
    if (!wasOpen) {
      setRichQuality(null);
      setRichQualityLoading(true);
      try {
        const rich = await api.checkNewsletterQuality({ content_html: html, subject_line: subjectLine });
        setRichQuality(rich);
      } catch {
        // local-only fallback
      } finally {
        setRichQualityLoading(false);
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex flex-col z-50">
      {/* Modal toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
        <h2 className="font-semibold text-neutral-900 dark:text-white text-sm">Email Preview</h2>

        {/* Device selector */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg p-1">
          {([
            { id: 'desktop' as PreviewDevice, icon: Monitor, label: 'Desktop (650px)' },
            { id: 'tablet' as PreviewDevice, icon: Tablet, label: 'Tablet (480px)' },
            { id: 'mobile' as PreviewDevice, icon: Smartphone, label: 'Mobile (375px)' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setPreviewDevice(id)}
              aria-label={label}
              className={clsx(
                'p-1.5 rounded transition-colors',
                previewDevice === id
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-primary-600 dark:text-primary-400'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        {/* Quality check toggle */}
        <button
          onClick={handleQualityToggle}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            showQualityPanel
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
          )}
        >
          <span
            className={clsx(
              'w-5 h-5 rounded font-bold text-xs flex items-center justify-center flex-shrink-0',
              GRADE_COLORS[quality.grade]
            )}
          >
            {quality.grade}
          </span>
          Quality Check
          {showQualityPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <button
          onClick={handleClose}
          aria-label="Close preview"
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      {/* Quality check panel */}
      {showQualityPanel && quality && (
        <div className="flex-shrink-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-4">
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0',
                GRADE_COLORS[richQuality ? richQuality.overall_grade : quality.grade]
              )}
            >
              {richQuality ? richQuality.overall_grade : quality.grade}
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                {quality.subjectLength.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-error" />
                )}
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Subject: {quality.subjectLength.message}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {quality.hasContent.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-error" />
                )}
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {quality.hasContent.pass ? 'Has content' : 'Body is empty'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {quality.spamWords.pass ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-warning" />
                )}
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {quality.spamWords.pass
                    ? 'No spam keywords'
                    : `Spam words: ${quality.spamWords.found.join(', ')}`}
                </span>
              </div>
              {richQuality && (
                <>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={clsx(
                        'w-4 h-4',
                        richQuality.readability_score >= 60
                          ? 'text-success'
                          : richQuality.readability_score >= 30
                          ? 'text-warning'
                          : 'text-error'
                      )}
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      Readability: {richQuality.readability_score}/100
                    </span>
                  </div>
                  {richQuality.missing_alt_text.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-warning" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {richQuality.missing_alt_text.length} image(s) missing alt text
                      </span>
                    </div>
                  )}
                  {richQuality.links_found.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-info" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {richQuality.links_found.length} link(s)
                      </span>
                    </div>
                  )}
                </>
              )}
              {richQualityLoading && (
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  <span className="text-xs text-neutral-400">Checking...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview content — scrollable */}
      <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-900 py-6">
        <div className={clsx('mx-auto transition-all duration-300', DEVICE_WIDTHS[previewDevice])}>
          {/* Email chrome / inbox header */}
          <div className="bg-white dark:bg-neutral-800 rounded-t-xl border border-neutral-200 dark:border-neutral-700 border-b-0 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400 font-semibold text-sm">
                N
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Newsletter Wizard</p>
                  <p className="text-xs text-neutral-400 flex-shrink-0">just now</p>
                </div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mt-0.5 truncate">
                  {subjectLine || <span className="italic text-neutral-400">No subject line</span>}
                </p>
                {preheader && (
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{preheader}</p>
                )}
              </div>
            </div>
          </div>

          {/* Email body */}
          <div className="bg-white dark:bg-neutral-800 rounded-b-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-6">
              {/* HTML is sanitized via DOMPurify before rendering */}
              <div
                className="prose dark:prose-invert max-w-none"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
              />
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-700 text-center">
              <p className="text-xs text-neutral-400">
                You received this email because you subscribed.{' '}
                <span className="underline cursor-default">Unsubscribe</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
