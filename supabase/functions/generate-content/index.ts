Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { tenant_id, topic, context, voice_profile_id } = body;

    // Check for API key authentication (for external API access)
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey) {
      // Validate API key via internal function call
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      const validationRes = await fetch(`${supabaseUrl}/functions/v1/validate-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      });
      
      const validation = await validationRes.json();
      
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validationRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check required permission
      if (!validation.permissions?.includes('newsletters:write')) {
        return new Response(JSON.stringify({ error: 'Permission denied. Requires newsletters:write permission.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Use tenant_id from validated API key
      tenant_id = validation.tenant_id;
    }

    if (!tenant_id || !topic) {
      throw new Error('tenant_id and topic are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Get API keys from tenant settings
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/tenant_settings?tenant_id=eq.${tenant_id}&select=openai_api_key,anthropic_api_key`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });
    const settingsData = await settingsRes.json();
    const openaiKey = settingsData[0]?.openai_api_key || Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = settingsData[0]?.anthropic_api_key || Deno.env.get('ANTHROPIC_API_KEY');

    // Build context from RAG results
    const contextText = (context || [])
      .map((c: { source_title: string; content: string }, i: number) => 
        `[Source ${i + 1}: ${c.source_title}]\n${c.content}`
      )
      .join('\n\n---\n\n');

    // Get voice profile if specified
    let voiceInstructions = '';
    if (voice_profile_id) {
      const voiceRes = await fetch(`${supabaseUrl}/rest/v1/voice_profiles?id=eq.${voice_profile_id}&select=*`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      });
      const voiceData = await voiceRes.json();
      if (voiceData[0]) {
        const v = voiceData[0];
        // Use trained voice_prompt if available
        if (v.voice_prompt) {
          voiceInstructions = `
VOICE STYLE GUIDELINES (Follow these exactly):
${v.voice_prompt}
`;
        } else {
          const toneMarkers = v.tone_markers || {};
          const vocab = v.vocabulary_preferences || v.vocabulary || {};
          voiceInstructions = `
Writing Style Guidelines:
- Formality: ${toneMarkers.formality || 'semi-formal'}
- Tone: ${toneMarkers.sentiment || 'balanced'}
- Energy: ${toneMarkers.energy || 'medium'}
- Approach: ${toneMarkers.approach || 'direct'}
${vocab.common_phrases?.length ? `- Use phrases like: ${vocab.common_phrases.slice(0, 5).join(', ')}` : ''}
${vocab.preferred_words?.length ? `- Preferred vocabulary: ${vocab.preferred_words.slice(0, 10).join(', ')}` : ''}
`;
        }
      }
    }

    const systemPrompt = `You are an expert newsletter writer. Create engaging, well-structured newsletter content.

${voiceInstructions}

Guidelines:
- Write compelling headlines and subheadings
- Use clear, concise language
- Include relevant insights from the provided sources
- Format content with proper HTML structure (h1, h2, p, ul, li, blockquote)
- Add a brief introduction and conclusion
- Keep paragraphs short and scannable
- Include calls-to-action where appropriate`;

    const userPrompt = `Create a newsletter about: "${topic}"

${contextText ? `Use these sources for context and insights:\n\n${contextText}` : 'No specific sources provided. Create general content about the topic.'}

Generate:
1. An engaging title
2. A compelling email subject line
3. Well-structured HTML content for the newsletter body

Respond in JSON format:
{
  "title": "Newsletter Title",
  "subject_line": "Email Subject Line",
  "content_html": "<h1>...</h1><p>...</p>..."
}`;

    let generatedContent = null;

    // Try Anthropic Claude first
    if (anthropicKey) {
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });

        if (claudeRes.ok) {
          const claudeData = await claudeRes.json();
          const text = claudeData.content[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedContent = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error('Claude API error:', e);
      }
    }

    // Fallback to OpenAI
    if (!generatedContent && openaiKey) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          const text = openaiData.choices[0]?.message?.content || '';
          generatedContent = JSON.parse(text);
        }
      } catch (e) {
        console.error('OpenAI API error:', e);
      }
    }

    // Fallback to template if no API key or API failed
    if (!generatedContent) {
      const title = topic;
      const subject_line = `${topic} - Your Latest Update`;
      
      const content_html = `
<h1>${topic}</h1>

<p><em>⚠️ AI generation unavailable. Please configure your OpenAI or Anthropic API key in Settings to enable AI-powered content generation.</em></p>

<h2>Key Highlights</h2>

${context && context.length > 0 ? context.map((c: { source_title: string; content: string }, i: number) => `
<div class="insight">
  <h3>${i + 1}. From "${c.source_title}"</h3>
  <p>${c.content.substring(0, 300)}${c.content.length > 300 ? '...' : ''}</p>
</div>
`).join('\n') : '<p>No specific insights available. Add more content to your knowledge base for personalized newsletters.</p>'}

<hr>

<p><em>Generated from your knowledge base by Newsletter Wizard.</em></p>
      `.trim();

      generatedContent = { title, subject_line, content_html };
    }

    const citations = (context || []).map((c: { chunk_id?: string; content: string }) => ({
      chunk_id: c.chunk_id || 'unknown',
      text: c.content.substring(0, 100),
    }));

    return new Response(JSON.stringify({
      ...generatedContent,
      citations,
      ai_generated: generatedContent.title !== topic,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate content error:', error);

    return new Response(JSON.stringify({
      error: { code: 'GENERATE_CONTENT_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
