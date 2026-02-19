import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function snippet(text: string, query: string, maxLen = 150): string {
  const lower = text.toLowerCase();
  const q     = query.toLowerCase();
  const idx   = lower.indexOf(q);
  if (idx === -1) return text.slice(0, maxLen);
  const start = Math.max(0, idx - 60);
  const end   = Math.min(text.length, idx + q.length + 90);
  const s     = text.slice(start, end);
  return (start > 0 ? '…' : '') + s + (end < text.length ? '…' : '');
}

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
    const body = await req.json();
    const { query, filters = {}, limit = 20 } = body;

    if (!query?.trim()) return json({ error: 'query is required' }, 400);

    const q    = query.trim().toLowerCase();
    const types: string[] = filters.types || ['newsletter', 'source'];

    const results: Array<{
      type:      string;
      id:        string;
      title:     string;
      snippet:   string;
      relevance: number;
      date:      string;
      status?:   string;
    }> = [];

    // ── Search newsletters ────────────────────────────────────────────────────
    if (types.includes('newsletter')) {
      let query = supabase
        .from('newsletters')
        .select('id, title, subject_line, content_html, status, created_at, updated_at')
        .eq('tenant_id', tenantId)
        .limit(limit);

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.date_range?.start) query = query.gte('created_at', filters.date_range.start);
      if (filters.date_range?.end)   query = query.lte('created_at', filters.date_range.end);

      const { data: newsletters } = await query;

      for (const nl of newsletters || []) {
        const searchable = `${nl.title || ''} ${nl.subject_line || ''}`.toLowerCase();
        if (!searchable.includes(q)) continue;

        const plain = (nl.content_html || '').replace(/<[^>]+>/g, ' ');
        results.push({
          type:     'newsletter',
          id:       nl.id,
          title:    nl.title,
          snippet:  snippet(nl.subject_line || plain, q),
          relevance: searchable.startsWith(q) ? 1.0 : 0.7,
          date:     nl.updated_at || nl.created_at,
          status:   nl.status,
        });
      }
    }

    // ── Search knowledge sources ──────────────────────────────────────────────
    if (types.includes('source')) {
      const { data: sources } = await supabase
        .from('knowledge_sources')
        .select('id, title, url, source_type, status, created_at')
        .eq('tenant_id', tenantId)
        .limit(limit);

      for (const src of sources || []) {
        const searchable = `${src.title || ''} ${src.url || ''}`.toLowerCase();
        if (!searchable.includes(q)) continue;

        results.push({
          type:     'source',
          id:       src.id,
          title:    src.title,
          snippet:  snippet(src.url || src.title, q),
          relevance: searchable.startsWith(q) ? 1.0 : 0.7,
          date:     src.created_at,
          status:   src.status,
        });
      }
    }

    // Sort by relevance then date
    results.sort((a, b) => b.relevance - a.relevance || new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate simple suggestions from query words
    const suggestions = q.split(/\s+/)
      .filter(w => w.length > 3)
      .map(w => `All ${w}s`)
      .slice(0, 3);

    return json({
      results: results.slice(0, limit),
      total:   results.length,
      suggestions,
    });

  } catch (error) {
    console.error('global-search error:', error);
    return json({ error: { code: 'SEARCH_FAILED', message: (error as Error).message } }, 500);
  }
});
