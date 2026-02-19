import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    // Load sent newsletters with their stats and send times
    const { data: newsletters } = await supabase
      .from('newsletters')
      .select('sent_at, newsletter_stats(open_rate, click_rate)')
      .eq('tenant_id', tenantId)
      .eq('status', 'sent')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(50);

    // If insufficient history, return industry-standard defaults
    if (!newsletters || newsletters.length < 3) {
      return json({
        recommended_slots: [
          { day: 2, day_name: 'Tuesday',   hour: 10, confidence: 0.6, reason: 'Industry standard: high open rates on Tuesday morning' },
          { day: 4, day_name: 'Thursday',  hour: 14, confidence: 0.55, reason: 'Industry standard: strong Thursday afternoon engagement' },
          { day: 3, day_name: 'Wednesday', hour: 9,  confidence: 0.5,  reason: 'Industry standard: mid-week morning performs well' },
        ],
        based_on_data: false,
        sample_size: newsletters?.length || 0,
      });
    }

    // Aggregate open rates by day of week and hour
    const slotStats: Record<string, { open_rate_sum: number; count: number }> = {};

    for (const nl of newsletters) {
      if (!nl.sent_at) continue;
      const date  = new Date(nl.sent_at);
      const day   = date.getUTCDay();
      const hour  = date.getUTCHours();
      const key   = `${day}:${hour}`;
      const stats = Array.isArray(nl.newsletter_stats)
        ? nl.newsletter_stats[0]
        : nl.newsletter_stats;
      const openRate = (stats as { open_rate?: number })?.open_rate || 0;

      if (!slotStats[key]) slotStats[key] = { open_rate_sum: 0, count: 0 };
      slotStats[key].open_rate_sum += openRate;
      slotStats[key].count++;
    }

    // Score and rank slots
    const scored = Object.entries(slotStats)
      .map(([key, s]) => {
        const [day, hour] = key.split(':').map(Number);
        const avgOpenRate = s.open_rate_sum / s.count;
        const confidence  = Math.min(0.95, 0.4 + s.count * 0.1);
        return {
          day,
          day_name:   DAY_NAMES[day],
          hour,
          avg_open_rate: Math.round(avgOpenRate * 10) / 10,
          confidence: Math.round(confidence * 100) / 100,
          reason: `Your newsletters sent on ${DAY_NAMES[day]} at ${hour}:00 averaged ${avgOpenRate.toFixed(1)}% opens across ${s.count} send${s.count > 1 ? 's' : ''}`,
        };
      })
      .sort((a, b) => b.avg_open_rate - a.avg_open_rate)
      .slice(0, 3);

    return json({
      recommended_slots: scored,
      based_on_data: true,
      sample_size: newsletters.length,
    });

  } catch (error) {
    console.error('suggest-send-time error:', error);
    return json({ error: { code: 'SUGGEST_FAILED', message: (error as Error).message } }, 500);
  }
});
