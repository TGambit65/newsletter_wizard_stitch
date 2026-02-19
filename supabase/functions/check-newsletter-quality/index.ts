import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SPAM_WORDS = [
  'free', 'winner', 'won', 'prize', 'urgent', 'act now', 'limited time',
  'click here', 'guaranteed', 'no risk', 'earn money', 'make money',
  'cash bonus', 'double your', 'while supplies last',
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = stripped.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

function readabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (sentences.length === 0 || words.length === 0) return 50;

  const avgWordsPerSentence = words.length / sentences.length;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function detectSpam(subject: string, content: string): string[] {
  const text = (subject + ' ' + content).toLowerCase();
  return SPAM_WORDS.filter(word => text.includes(word));
}

function findMissingAltText(html: string): string[] {
  const missing: string[] = [];
  for (const m of html.matchAll(/<img[^>]*>/gi)) {
    const tag = m[0];
    if (!/alt\s*=\s*["'][^"']+["']/.test(tag)) {
      const srcM = tag.match(/src\s*=\s*["']([^"']+)["']/);
      missing.push(srcM ? srcM[1] : 'unknown image');
    }
  }
  return missing;
}

function findLinks(html: string): string[] {
  const links: string[] = [];
  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const href = m[1];
    if (href.startsWith('http://') || href.startsWith('https://')) {
      links.push(href);
    }
  }
  return [...new Set(links)];
}

function letterGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const { content_html = '', subject_line = '' } = await req.json();

    if (!content_html?.trim()) {
      return json({ error: 'content_html is required' }, 400);
    }

    const plainText      = stripHtml(content_html);
    const readability    = readabilityScore(plainText);
    const spamWords      = detectSpam(subject_line, plainText);
    const spamScore      = Math.min(100, spamWords.length * 15);
    const missingAltText = findMissingAltText(content_html);
    const links          = findLinks(content_html);
    const subjectLengthOk = subject_line.length > 0 && subject_line.length <= 50;

    const altScore     = missingAltText.length === 0 ? 100 : Math.max(0, 100 - missingAltText.length * 20);
    const subjectScore = subjectLengthOk ? 100 : (subject_line.length === 0 ? 0 : 60);
    const composite    = Math.round(
      readability * 0.4 +
      (100 - spamScore) * 0.3 +
      altScore * 0.2 +
      subjectScore * 0.1
    );

    return json({
      readability_score: readability,
      spam_score:        spamScore,
      spam_words_found:  spamWords,
      missing_alt_text:  missingAltText,
      links_found:       links,
      subject_length_ok: subjectLengthOk,
      subject_length:    subject_line.length,
      overall_score:     composite,
      overall_grade:     letterGrade(composite),
    });

  } catch (error) {
    console.error('check-newsletter-quality error:', error);
    return json({ error: { code: 'CHECK_FAILED', message: (error as Error).message } }, 500);
  }
});
