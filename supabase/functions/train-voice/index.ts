Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { voice_profile_id, training_samples } = await req.json();

    if (!voice_profile_id || !training_samples || training_samples.length === 0) {
      throw new Error('voice_profile_id and training_samples are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Get voice profile
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/voice_profiles?id=eq.${voice_profile_id}&select=*,tenant_id`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });
    const profileData = await profileRes.json();
    const profile = profileData[0];

    if (!profile) {
      throw new Error('Voice profile not found');
    }

    // Get API keys
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/tenant_settings?tenant_id=eq.${profile.tenant_id}&select=openai_api_key,anthropic_api_key`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });
    const settingsData = await settingsRes.json();
    const openaiKey = settingsData[0]?.openai_api_key || Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = settingsData[0]?.anthropic_api_key || Deno.env.get('ANTHROPIC_API_KEY');

    // Analyze writing samples
    const combinedText = training_samples.join('\n\n---\n\n');
    
    const analysisPrompt = `Analyze the following writing samples and extract the author's unique voice characteristics. Provide a detailed analysis in JSON format.

Writing Samples:
${combinedText}

Return JSON with:
{
  "tone_markers": {
    "formality": "formal|semi-formal|casual|mixed",
    "sentiment": "positive|neutral|critical|balanced",
    "energy": "high|medium|low",
    "approach": "direct|diplomatic|analytical|conversational"
  },
  "vocabulary": {
    "common_phrases": ["phrase1", "phrase2"],
    "preferred_words": ["word1", "word2"],
    "avoided_words": ["word1", "word2"],
    "technical_level": "high|medium|low",
    "jargon_usage": "heavy|moderate|minimal"
  },
  "voice_prompt": "A detailed system prompt that captures this writing voice. Should be 2-3 paragraphs describing exactly how to write in this style, including specific examples of phrases, sentence structures, and tonal qualities."
}`;

    let analysisResult = null;

    // Try Anthropic first
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
            max_tokens: 2048,
            messages: [{ role: 'user', content: analysisPrompt }],
          }),
        });

        if (claudeRes.ok) {
          const claudeData = await claudeRes.json();
          const text = claudeData.content[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error('Claude API error:', e);
      }
    }

    // Fallback to OpenAI
    if (!analysisResult && openaiKey) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: analysisPrompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (openaiRes.ok) {
          const openaiData = await openaiRes.json();
          const text = openaiData.choices[0]?.message?.content || '';
          analysisResult = JSON.parse(text);
        }
      } catch (e) {
        console.error('OpenAI API error:', e);
      }
    }

    // Fallback analysis if no API available
    if (!analysisResult) {
      const wordCount = combinedText.split(/\s+/).length;
      const avgSentenceLength = combinedText.split(/[.!?]/).filter(s => s.trim()).length;
      const hasQuestions = combinedText.includes('?');
      const hasExclamations = combinedText.includes('!');
      
      analysisResult = {
        tone_markers: {
          formality: wordCount > 500 ? 'formal' : 'semi-formal',
          sentiment: 'balanced',
          energy: hasExclamations ? 'high' : 'medium',
          approach: hasQuestions ? 'conversational' : 'direct'
        },
        vocabulary: {
          common_phrases: [],
          preferred_words: [],
          avoided_words: [],
          technical_level: 'medium',
          jargon_usage: 'moderate'
        },
        voice_prompt: `Write in a ${wordCount > 500 ? 'formal' : 'conversational'} tone. ${hasQuestions ? 'Engage readers with questions.' : ''} ${hasExclamations ? 'Use energetic language.' : ''} Maintain a balanced, professional voice while being accessible to readers.`
      };
    }

    // Update voice profile with analysis
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/voice_profiles?id=eq.${voice_profile_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        training_samples: training_samples,
        tone_markers: analysisResult.tone_markers,
        vocabulary: analysisResult.vocabulary,
        vocabulary_preferences: analysisResult.vocabulary,
        voice_prompt: analysisResult.voice_prompt,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!updateRes.ok) {
      throw new Error('Failed to update voice profile');
    }

    return new Response(JSON.stringify({
      success: true,
      tone_markers: analysisResult.tone_markers,
      vocabulary: analysisResult.vocabulary,
      voice_prompt: analysisResult.voice_prompt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Train voice error:', error);

    return new Response(JSON.stringify({
      error: { code: 'TRAIN_VOICE_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
