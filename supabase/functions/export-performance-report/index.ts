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
      .select('id, title, subject_line, sent_at, newsletter_stats(open_rate, click_rate, unsubscribes, total_sent, unique_opens, unique_clicks)')
      .eq('tenant_id', tenantId)
      .eq('status', 'sent')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (date_range?.start) query = query.gte('sent_at', date_range.start);
    if (date_range?.end)   query = query.lte('sent_at', date_range.end);

    const { data: newsletters } = await query;
    const { data: tenant } = await supabase.from('tenants').select('name').eq('id', tenantId).single();

    const dateLabel = date_range?.start
      ? `${date_range.start.slice(0, 10)} – ${(date_range.end || new Date().toISOString()).slice(0, 10)}`
      : 'All time';

    const rows = (newsletters || []).map(nl => {
      const s = Array.isArray(nl.newsletter_stats) ? nl.newsletter_stats[0] : nl.newsletter_stats;
      return {
        title:      nl.title,
        subject:    nl.subject_line || '',
        sent_at:    nl.sent_at ? new Date(nl.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        total_sent: (s as { total_sent?: number })?.total_sent  || 0,
        open_rate:  ((s as { open_rate?: number })?.open_rate   || 0).toFixed(1),
        click_rate: ((s as { click_rate?: number })?.click_rate || 0).toFixed(1),
        unsubs:     (s as { unsubscribes?: number })?.unsubscribes || 0,
      };
    });

    const avgOpen  = rows.length ? (rows.reduce((a, r) => a + parseFloat(r.open_rate), 0) / rows.length).toFixed(1) : '0.0';
    const avgClick = rows.length ? (rows.reduce((a, r) => a + parseFloat(r.click_rate), 0) / rows.length).toFixed(1) : '0.0';
    const totalSent = rows.reduce((a, r) => a + r.total_sent, 0);

    const tableRows = rows.map(r => `
      <tr>
        <td>${r.title}</td>
        <td style="color:#6b7280">${r.subject}</td>
        <td>${r.sent_at}</td>
        <td>${r.total_sent.toLocaleString()}</td>
        <td>${r.open_rate}%</td>
        <td>${r.click_rate}%</td>
        <td>${r.unsubs}</td>
      </tr>`).join('');

    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Performance Report — ${tenant?.name || 'Newsletter Wizard'}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #111; background: #fff; }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: #6b7280; margin-bottom: 32px; font-size: 14px; }
  .summary { display: flex; gap: 24px; margin-bottom: 40px; }
  .stat-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; }
  .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
  .stat-value { font-size: 32px; font-weight: 700; color: #6366f1; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
  td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  tr:hover td { background: #f9fafb; }
  .footer { margin-top: 48px; font-size: 12px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
<h1>${tenant?.name || 'Newsletter Wizard'} — Performance Report</h1>
<p class="subtitle">Period: ${dateLabel} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

<div class="summary">
  <div class="stat-card"><div class="stat-label">Newsletters Sent</div><div class="stat-value">${rows.length}</div></div>
  <div class="stat-card"><div class="stat-label">Total Recipients</div><div class="stat-value">${totalSent.toLocaleString()}</div></div>
  <div class="stat-card"><div class="stat-label">Avg Open Rate</div><div class="stat-value">${avgOpen}%</div></div>
  <div class="stat-card"><div class="stat-label">Avg Click Rate</div><div class="stat-value">${avgClick}%</div></div>
</div>

<table>
  <thead>
    <tr>
      <th>Newsletter</th>
      <th>Subject</th>
      <th>Sent</th>
      <th>Recipients</th>
      <th>Open Rate</th>
      <th>Click Rate</th>
      <th>Unsubs</th>
    </tr>
  </thead>
  <tbody>${tableRows || '<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af">No sent newsletters in this period</td></tr>'}</tbody>
</table>

<div class="footer">Generated by Newsletter Wizard</div>
</body>
</html>`;

    return json({ report_html: reportHtml, row_count: rows.length });

  } catch (error) {
    console.error('export-performance-report error:', error);
    return json({ error: { code: 'EXPORT_FAILED', message: (error as Error).message } }, 500);
  }
});
