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

    const tenantId = profile.tenant_id;

    // Load tenant newsletter history for context
    const { data: newsletters } = await supabase
      .from('newsletters')
      .select('title, subject_line')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Load all system templates + tenant's own templates
    const { data: templates } = await supabase
      .from('newsletter_templates')
      .select('id, name, category, goal_tags, usage_count, avg_open_rate')
      .or(`is_system.eq.true,tenant_id.eq.${tenantId}`);

    if (!templates?.length) {
      return json({ template_ids: [], reason: 'No templates available' });
    }

    // Keyword-based relevance scoring against newsletter history
    const historyText = (newsletters || [])
      .map(n => `${n.title || ''} ${n.subject_line || ''}`)
      .join(' ')
      .toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      'Promotional':    ['sale', 'offer', 'deal', 'discount', 'launch', 'new', 'product'],
      'Educational':    ['how', 'why', 'guide', 'tips', 'learn', 'understand', 'tutorial'],
      'Curated':        ['roundup', 'digest', 'week', 'links', 'reading', 'news'],
      'Company Update': ['update', 'team', 'milestone', 'announce', 'behind', 'month'],
      'Event Recap':    ['event', 'recap', 'conference', 'summit', 'meetup'],
    };

    const scored = templates.map(t => {
      let score = (t.usage_count || 0) * 0.5 + (t.avg_open_rate || 0) * 2;
      const keywords = categoryKeywords[t.category] || [];
      for (const kw of keywords) {
        if (historyText.includes(kw)) score += 10;
      }
      return { id: t.id, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return json({
      template_ids: scored.map(s => s.id),
      total: scored.length,
    });

  } catch (error) {
    console.error('recommend-templates error:', error);
    return json({ error: { code: 'RECOMMEND_FAILED', message: (error as Error).message } }, 500);
  }
});
