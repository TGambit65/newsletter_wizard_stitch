import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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
    const body = await req.json();
    const { tenant_id, sample_text, tone_markers } = body;

    if (!tenant_id || !sample_text?.trim() || !tone_markers) {
      return json({ error: 'tenant_id, sample_text, and tone_markers are required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    // Load tenant API keys
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('anthropic_api_key, openai_api_key')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    const anthropicKey = settings?.anthropic_api_key || Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey    = settings?.openai_api_key    || Deno.env.get('OPENAI_API_KEY');

    const { archetype = 'default', formality = 50, humor = 50, technicality = 50, energy = 50 } = tone_markers;

    const systemPrompt = `You are a writing style transformer. Rewrite the provided text to match this voice profile exactly:

Archetype: ${archetype}
Formality: ${formality}/100 (0=very casual, 100=very formal)
Humor: ${humor}/100 (0=completely serious, 100=very playful)
Technicality: ${technicality}/100 (0=simple everyday language, 100=highly technical/jargon-heavy)
Energy: ${energy}/100 (0=calm and measured, 100=high-energy and enthusiastic)

Rules:
- Preserve the exact meaning and all key facts
- Only change writing style, tone, vocabulary, and sentence structure
- Keep approximately the same length (within 20%)
- Output ONLY the rewritten text — no labels, no explanations, no preamble`;

    let rewrittenText: string | null = null;

    // ── Try Anthropic first ────────────────────────────────────────────────
    if (anthropicKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key':         anthropicKey,
            'anthropic-version': '2023-06-01',
            'Content-Type':      'application/json',
          },
          body: JSON.stringify({
            model:      'claude-3-haiku-20240307',
            max_tokens: 1024,
            system:     systemPrompt,
            messages:   [{ role: 'user', content: sample_text }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          rewrittenText = data.content?.[0]?.text?.trim() || null;
        }
      } catch (e) {
        console.error('Anthropic error:', e);
      }
    }

    // ── Fallback to OpenAI ─────────────────────────────────────────────────
    if (!rewrittenText && openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            model:    'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: sample_text  },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          rewrittenText = data.choices?.[0]?.message?.content?.trim() || null;
        }
      } catch (e) {
        console.error('OpenAI error:', e);
      }
    }

    if (!rewrittenText) {
      return json({
        error: 'No AI provider available. Add Anthropic or OpenAI API keys in Settings.',
      }, 422);
    }

    return json({ rewritten_text: rewrittenText });

  } catch (error) {
    console.error('preview-voice error:', error);
    return json({ error: { code: 'PREVIEW_FAILED', message: (error as Error).message } }, 500);
  }
});
