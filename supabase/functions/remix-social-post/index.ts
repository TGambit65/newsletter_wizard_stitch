import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLATFORM_GUIDES: Record<string, string> = {
  twitter:   'Twitter/X: max 280 chars, punchy and direct, use 1-2 hashtags, strong hook in first line',
  threads:   'Threads: conversational and personal, 500 char limit, less formal than Twitter',
  linkedin:  'LinkedIn: professional tone, 1300 chars, use line breaks, end with question or CTA',
  instagram: 'Instagram: visual-first caption, 2200 chars, use 3-5 relevant hashtags, emojis welcome',
  facebook:  'Facebook: conversational, 63k chars, can be longer, include a question to drive comments',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { content, target_platform, tenant_id } = body;

    if (!content || !target_platform || !tenant_id) {
      return json({ error: 'content, target_platform, and tenant_id are required' }, 400);
    }

    const guide = PLATFORM_GUIDES[target_platform.toLowerCase()];
    if (!guide) {
      return json({ error: `Unknown platform: ${target_platform}` }, 400);
    }

    // Load tenant API keys
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('anthropic_api_key, openai_api_key')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    const anthropicKey = settings?.anthropic_api_key || Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey    = settings?.openai_api_key    || Deno.env.get('OPENAI_API_KEY');

    const systemPrompt = `You are a social media copywriter. Adapt the provided content for ${target_platform}.

Platform guidelines: ${guide}

Rules:
- Preserve the core message and key facts
- Optimise for this specific platform's style, length, and audience
- Output ONLY the adapted post text — no labels, no explanations`;

    let remixedContent: string | null = null;

    // Try Anthropic first
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
            max_tokens: 512,
            system:     systemPrompt,
            messages:   [{ role: 'user', content }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          remixedContent = data.content?.[0]?.text?.trim() || null;
        }
      } catch (e) {
        console.error('Anthropic error:', e);
      }
    }

    // Fallback to OpenAI
    if (!remixedContent && openaiKey) {
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
              { role: 'user',   content },
            ],
            max_tokens: 512,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          remixedContent = data.choices?.[0]?.message?.content?.trim() || null;
        }
      } catch (e) {
        console.error('OpenAI error:', e);
      }
    }

    if (!remixedContent) {
      return json({ error: 'No AI provider available. Add API keys in Settings.' }, 422);
    }

    return json({ remixed_content: remixedContent, platform: target_platform });

  } catch (error) {
    console.error('remix-social-post error:', error);
    return json({ error: { code: 'REMIX_FAILED', message: (error as Error).message } }, 500);
  }
});
