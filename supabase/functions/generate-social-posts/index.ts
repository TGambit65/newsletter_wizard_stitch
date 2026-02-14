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
    const { newsletter_content, newsletter_title } = body;

    if (!newsletter_content) {
      throw new Error('newsletter_content is required');
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    // Strip HTML tags for plain text content
    const plainText = newsletter_content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    const systemPrompt = `You are a social media expert. Convert newsletter content into platform-optimized social media posts for ALL 10 platforms.

Platform requirements:
- twitter (X): Max 280 chars, punchy hook, 3-5 hashtags, thread option for longer content
- linkedin: Professional tone, up to 3000 chars, credibility proof, intelligent question at end
- facebook: Casual tone, up to 5000 chars, mini-story structure, share CTA
- instagram: Caption up to 2200 chars, 20-30 hashtags, image suggestion
- tiktok: Hook under 100 chars, video script, video_prompt for AI generation (15-45s)
- youtube_shorts: Hook, script outline, video_prompt (45-60s target)
- threads: Up to 500 chars, hot take + bullets + question
- reddit: Case study format, up to 40000 chars, peer tone, subreddit suggestions
- pinterest: SEO title (100 chars), description (500 chars), keywords, board suggestion
- snapchat: Short hook, video script (7-20s), large caption style

Return valid JSON only.`;

    const userPrompt = `Convert this newsletter into social media posts for ALL 10 platforms:

Title: ${newsletter_title || 'Newsletter'}

Content:
${plainText}

Generate optimized posts following each platform's best practices. Return this exact JSON structure:
{
  "twitter": { "main_post": "...", "hashtags": ["..."], "thread": null },
  "linkedin": { "post": "...", "hashtags": ["..."] },
  "facebook": { "post": "...", "cta": "..." },
  "instagram": { "caption": "...", "hashtags": ["..."], "image_suggestion": "..." },
  "tiktok": { "hook": "...", "script": "...", "video_prompt": "..." },
  "youtube_shorts": { "hook": "...", "script": "...", "video_prompt": "..." },
  "threads": { "post": "...", "hashtags": ["..."] },
  "reddit": { "title": "...", "body": "...", "subreddit_suggestions": ["..."] },
  "pinterest": { "title": "...", "description": "...", "keywords": ["..."], "board_suggestion": "..." },
  "snapchat": { "hook": "...", "script": "...", "duration": "15s" }
}`;

    let generatedPosts = null;

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
            generatedPosts = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error('Claude API error:', e);
      }
    }

    // Fallback to OpenAI
    if (!generatedPosts && openaiKey) {
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
          generatedPosts = JSON.parse(text);
        }
      } catch (e) {
        console.error('OpenAI API error:', e);
      }
    }

    // Fallback template if no API available - ALL 10 PLATFORMS
    if (!generatedPosts) {
      const shortContent = plainText.substring(0, 200);
      const title = newsletter_title || 'Check out our latest update';
      
      generatedPosts = {
        twitter: {
          main_post: `${title.substring(0, 200)} #newsletter #update`,
          hashtags: ['newsletter', 'update', 'insights'],
          thread: null
        },
        linkedin: {
          post: `${title}\n\n${shortContent}...\n\nRead more in our latest newsletter.\n\nWhat's your take on this?`,
          hashtags: ['newsletter', 'insights', 'update', 'business']
        },
        facebook: {
          post: `${title}\n\n${shortContent}...\n\nWhat do you think? Share with someone who needs to see this!`,
          cta: 'Read the full newsletter'
        },
        instagram: {
          caption: `${title}\n\n${shortContent.substring(0, 150)}...\n\nSave this for later! 📌`,
          hashtags: ['newsletter', 'insights', 'mustread', 'update', 'content', 'business', 'growth', 'tips', 'advice', 'learn'],
          image_suggestion: 'A clean, professional graphic with the newsletter title and key visual elements'
        },
        tiktok: {
          hook: `Stop scrolling if you want to know about ${title.substring(0, 50)}...`,
          script: `[Hook] ${title}\n\n[Main Content] Here's what you need to know...\n\n[CTA] Follow for more insights!`,
          video_prompt: `Create a dynamic 30-second vertical video about: ${title}. Fast-paced editing, text overlays for key points, engaging visuals.`
        },
        youtube_shorts: {
          hook: title.substring(0, 100),
          script: `[0-5s] Hook: ${title}\n[5-45s] Key insights from the newsletter\n[45-60s] Subscribe for more content like this!`,
          video_prompt: `Create a 60-second vertical video about: ${title}. Include text overlays, smooth transitions, and call-to-action at the end.`
        },
        threads: {
          post: `Hot take: ${title}\n\n${shortContent.substring(0, 350)}...\n\nThoughts? 👇`,
          hashtags: ['newsletter', 'update', 'thoughts']
        },
        reddit: {
          title: `[Discussion] ${title}`,
          body: `Hey everyone,\n\nI wanted to share some insights from our latest newsletter:\n\n${shortContent}...\n\n**Key takeaways:**\n- Point 1\n- Point 2\n- Point 3\n\nWhat are your thoughts? Am I missing something here?\n\n---\n*Full newsletter link in comments*`,
          subreddit_suggestions: ['business', 'entrepreneur', 'marketing']
        },
        pinterest: {
          title: title.substring(0, 100),
          description: `${shortContent.substring(0, 400)}... Click to read the full newsletter and get all the insights!`,
          keywords: ['newsletter', 'insights', 'tips', 'business', 'growth'],
          board_suggestion: 'Business Tips & Insights'
        },
        snapchat: {
          hook: `You NEED to know this about ${title.substring(0, 30)}! 👀`,
          script: `[1-3s] Hook text overlay\n[4-12s] Quick key points with visuals\n[13-15s] Swipe up CTA`,
          duration: '15s'
        }
      };
    }

    return new Response(JSON.stringify({
      success: true,
      posts: generatedPosts,
      ai_generated: !!anthropicKey || !!openaiKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate social posts error:', error);

    return new Response(JSON.stringify({
      error: { code: 'GENERATE_SOCIAL_POSTS_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
