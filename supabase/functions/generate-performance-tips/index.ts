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
    const { date_range } = (await req.json().catch(() => ({}))) as { date_range?: { start?: string; end?: string } };

    // Load sent newsletters with stats
    let query = supabase
      .from('newsletters')
      .select('id, title, subject_line, sent_at, newsletter_stats(open_rate, click_rate, unsubscribes, total_sent)')
      .eq('tenant_id', tenantId)
      .eq('status', 'sent')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(30);

    if (date_range?.start) query = query.gte('sent_at', date_range.start);
    if (date_range?.end)   query = query.lte('sent_at', date_range.end);

    const { data: newsletters } = await query;

    if (!newsletters?.length) {
      return json({
        tips: [
          {
            title: 'Send your first newsletter',
            description: 'Performance tips will appear here once you have sent newsletters. Start with a simple introduction to your audience.',
            metric: 'newsletters_sent',
            improvement: 'Get started',
          },
        ],
      });
    }

    // Compute aggregate metrics
    const statsArr = newsletters.map(nl => {
      const s = Array.isArray(nl.newsletter_stats) ? nl.newsletter_stats[0] : nl.newsletter_stats;
      return {
        title:        nl.title,
        subject_line: nl.subject_line || '',
        sent_at:      nl.sent_at,
        open_rate:    (s as { open_rate?: number })?.open_rate    || 0,
        click_rate:   (s as { click_rate?: number })?.click_rate  || 0,
        unsubs:       (s as { unsubscribes?: number })?.unsubscribes || 0,
        total_sent:   (s as { total_sent?: number })?.total_sent  || 0,
      };
    });

    const avgOpenRate  = statsArr.reduce((s, n) => s + n.open_rate, 0)  / statsArr.length;
    const avgClickRate = statsArr.reduce((s, n) => s + n.click_rate, 0) / statsArr.length;
    const bestNl       = statsArr.reduce((a, b) => a.open_rate > b.open_rate ? a : b);
    const worstNl      = statsArr.reduce((a, b) => a.open_rate < b.open_rate ? a : b);

    const avgSubjectLen = statsArr.reduce((s, n) => s + n.subject_line.length, 0) / statsArr.length;

    // Build rule-based tips
    const tips: Array<{ title: string; description: string; metric: string; improvement: string }> = [];

    if (avgOpenRate < 20) {
      tips.push({
        title: 'Improve your subject lines',
        description: `Your average open rate is ${avgOpenRate.toFixed(1)}%. Industry average is ~21%. Test shorter, curiosity-driven subject lines. Your best-performing newsletter "${bestNl.title}" had a ${bestNl.open_rate.toFixed(1)}% open rate.`,
        metric: `${avgOpenRate.toFixed(1)}% avg open rate`,
        improvement: 'Target: 21%+',
      });
    }

    if (avgClickRate < 2.5) {
      tips.push({
        title: 'Add clearer calls-to-action',
        description: `Your average click rate is ${avgClickRate.toFixed(1)}%. Add one prominent CTA button per newsletter rather than multiple text links. Make the action obvious and benefit-focused.`,
        metric: `${avgClickRate.toFixed(1)}% avg click rate`,
        improvement: 'Target: 2.5%+',
      });
    }

    if (avgSubjectLen > 50) {
      tips.push({
        title: 'Shorten your subject lines',
        description: `Your average subject line is ${Math.round(avgSubjectLen)} characters. Subject lines under 50 characters show higher open rates across email clients. Cut to the most compelling part.`,
        metric: `${Math.round(avgSubjectLen)} char avg subject`,
        improvement: 'Target: under 50 chars',
      });
    }

    if (bestNl.open_rate > avgOpenRate * 1.3) {
      tips.push({
        title: `Replicate what worked in "${bestNl.title}"`,
        description: `This newsletter had a ${bestNl.open_rate.toFixed(1)}% open rate — ${((bestNl.open_rate / avgOpenRate - 1) * 100).toFixed(0)}% above your average. Analyse its subject line, send time, and topic. Consider a follow-up or similar edition.`,
        metric: `${bestNl.open_rate.toFixed(1)}% open rate`,
        improvement: 'Best performer',
      });
    }

    if (statsArr.length < 5) {
      tips.push({
        title: 'Send more consistently',
        description: `You have ${statsArr.length} sent newsletter${statsArr.length > 1 ? 's' : ''}. Audiences that receive weekly content show 3x better retention than monthly senders. Set a schedule and stick to it.`,
        metric: `${statsArr.length} newsletters sent`,
        improvement: 'Goal: weekly cadence',
      });
    }

    // Ensure at least 3 tips
    if (tips.length < 3) {
      tips.push({
        title: 'Experiment with send times',
        description: `Use the Scheduling page to see AI-recommended send times based on your audience engagement patterns. Tuesday and Thursday mornings tend to perform best across industries.`,
        metric: 'Send time optimisation',
        improvement: 'Use AI suggestions',
      });
    }

    return json({ tips: tips.slice(0, 5), based_on: statsArr.length });

  } catch (error) {
    console.error('generate-performance-tips error:', error);
    return json({ error: { code: 'TIPS_FAILED', message: (error as Error).message } }, 500);
  }
});
