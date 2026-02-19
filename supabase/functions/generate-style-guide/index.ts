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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return json({ error: 'Profile not found' }, 404);

    const { voice_profile_id } = await req.json();
    if (!voice_profile_id) return json({ error: 'voice_profile_id is required' }, 400);

    // Load voice profile (verify it belongs to this tenant)
    const { data: vp } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('id', voice_profile_id)
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle();

    if (!vp) return json({ error: 'Voice profile not found' }, 404);

    // Load tenant API keys for AI generation
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('anthropic_api_key, openai_api_key')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle();

    const anthropicKey = settings?.anthropic_api_key || Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey    = settings?.openai_api_key    || Deno.env.get('OPENAI_API_KEY');

    const formality    = vp.formality    ?? 50;
    const humor        = vp.humor        ?? 50;
    const technicality = vp.technicality ?? 50;
    const energy       = vp.energy       ?? 50;
    const archetype    = vp.archetype    || 'Informative';

    // Map slider values to descriptors
    const formalLabel = formality > 66 ? 'formal and professional' : formality > 33 ? 'conversational' : 'casual and relaxed';
    const humorLabel  = humor > 66 ? 'playful and witty' : humor > 33 ? 'occasionally light-hearted' : 'serious and earnest';
    const techLabel   = technicality > 66 ? 'technical and precise' : technicality > 33 ? 'accessible with some jargon' : 'jargon-free and simple';
    const energyLabel = energy > 66 ? 'high-energy and enthusiastic' : energy > 33 ? 'steady and measured' : 'calm and understated';

    let guideBody: string | null = null;

    // Try AI-generated guide
    const aiPrompt = `Generate a concise brand voice style guide for the following profile:

Name: ${vp.name}
Archetype: ${archetype}
Tone: ${formalLabel}, ${humorLabel}, ${techLabel}, ${energyLabel}
Description: ${vp.description || 'N/A'}

Return a style guide with these sections:
1. Voice Summary (2-3 sentences)
2. Do Use (5 bullet points of vocabulary/phrases that fit this voice)
3. Avoid (5 bullet points of vocabulary/phrases that conflict with this voice)
4. Sentence Structure (2-3 rules)
5. Example Sentences (3 examples showing the voice in action)

Format as clean HTML using h2 for sections and ul/li for bullets.`;

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
            messages:   [{ role: 'user', content: aiPrompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          guideBody = data.content?.[0]?.text?.trim() || null;
        }
      } catch (e) {
        console.error('Anthropic error:', e);
      }
    }

    if (!guideBody && openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            model:      'gpt-4o-mini',
            max_tokens: 1024,
            messages:   [{ role: 'user', content: aiPrompt }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          guideBody = data.choices?.[0]?.message?.content?.trim() || null;
        }
      } catch (e) {
        console.error('OpenAI error:', e);
      }
    }

    // Fallback: static rule-based guide
    if (!guideBody) {
      guideBody = `
<h2>Voice Summary</h2>
<p>The <strong>${vp.name}</strong> voice is ${formalLabel} with a ${humorLabel} quality. Writing is ${techLabel} and delivered in a ${energyLabel} manner. Every piece should feel consistent with the ${archetype} archetype.</p>

<h2>Do Use</h2>
<ul>
  <li>${formality > 50 ? 'Complete sentences with proper grammar' : 'Contractions and everyday language'}</li>
  <li>${humor > 50 ? 'Occasional wit and wordplay' : 'Direct, clear statements'}</li>
  <li>${technicality > 50 ? 'Industry-specific terminology where appropriate' : 'Plain language that anyone can understand'}</li>
  <li>${energy > 50 ? 'Action verbs and energetic phrasing' : 'Measured, thoughtful phrasing'}</li>
  <li>Active voice over passive constructions</li>
</ul>

<h2>Avoid</h2>
<ul>
  <li>${formality < 50 ? 'Overly formal or stiff language' : 'Slang or overly casual expressions'}</li>
  <li>${humor < 50 ? 'Forced humour or jokes' : 'Humourless, robotic copy'}</li>
  <li>${technicality < 50 ? 'Unnecessary jargon or acronyms' : 'Oversimplified explanations that talk down to readers'}</li>
  <li>Passive constructions that weaken impact</li>
  <li>Vague filler phrases ("very", "really", "basically")</li>
</ul>

<h2>Sentence Structure</h2>
<ul>
  <li>Lead with the most important information</li>
  <li>${formality > 50 ? 'Use complete sentences; avoid fragments' : 'Short sentences are fine — even fragments for impact'}</li>
  <li>Vary sentence length to maintain rhythm</li>
</ul>`;
    }

    const styleGuideHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${vp.name} — Brand Voice Style Guide</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 48px 32px; color: #111; }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .meta { color: #6b7280; font-size: 14px; margin-bottom: 40px; }
  .sliders { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; padding: 24px; background: #f9fafb; border-radius: 12px; }
  .slider-item { display: flex; justify-content: space-between; align-items: center; }
  .slider-label { font-size: 13px; font-weight: 500; color: #374151; }
  .slider-bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; margin: 0 12px; position: relative; }
  .slider-fill { height: 100%; background: #6366f1; border-radius: 3px; }
  .slider-value { font-size: 12px; color: #6b7280; width: 36px; text-align: right; }
  h2 { font-size: 18px; font-weight: 600; margin-top: 32px; margin-bottom: 12px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; line-height: 1.6; }
  p { line-height: 1.7; }
  .footer { margin-top: 48px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px; }
</style>
</head>
<body>
<h1>${vp.name}</h1>
<p class="meta">Archetype: <strong>${archetype}</strong> &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

<div class="sliders">
  <div class="slider-item">
    <span class="slider-label">Formality</span>
    <div class="slider-bar"><div class="slider-fill" style="width:${formality}%"></div></div>
    <span class="slider-value">${formality}/100</span>
  </div>
  <div class="slider-item">
    <span class="slider-label">Humor</span>
    <div class="slider-bar"><div class="slider-fill" style="width:${humor}%"></div></div>
    <span class="slider-value">${humor}/100</span>
  </div>
  <div class="slider-item">
    <span class="slider-label">Technicality</span>
    <div class="slider-bar"><div class="slider-fill" style="width:${technicality}%"></div></div>
    <span class="slider-value">${technicality}/100</span>
  </div>
  <div class="slider-item">
    <span class="slider-label">Energy</span>
    <div class="slider-bar"><div class="slider-fill" style="width:${energy}%"></div></div>
    <span class="slider-value">${energy}/100</span>
  </div>
</div>

${guideBody}

<div class="footer">Generated by Newsletter Wizard</div>
</body>
</html>`;

    return json({ style_guide_html: styleGuideHtml });

  } catch (error) {
    console.error('generate-style-guide error:', error);
    return json({ error: { code: 'STYLE_GUIDE_FAILED', message: (error as Error).message } }, 500);
  }
});
