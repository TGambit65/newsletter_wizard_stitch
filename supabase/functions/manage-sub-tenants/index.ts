import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's tenant and check if it's a partner tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ error: 'No tenant found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, partner_id')
      .eq('id', profile.tenant_id)
      .single();

    if (!tenant?.partner_id) {
      return new Response(JSON.stringify({ error: 'Not a partner tenant' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const partnerId = tenant.partner_id;
    const parentTenantId = tenant.id;
    const body = await req.json().catch(() => ({}));
    const { action, tenantId, name, slug, subscription_tier } = body;

    // LIST sub-tenants
    if (action === 'list') {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, subscription_tier, created_at, max_sources, max_newsletters_per_month')
        .eq('partner_id', partnerId)
        .neq('id', parentTenantId) // Exclude parent
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ tenants: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CREATE sub-tenant
    if (action === 'create') {
      if (!name || !slug) {
        return new Response(JSON.stringify({ error: 'Name and slug are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (existing) {
        return new Response(JSON.stringify({ error: 'Slug already exists' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name,
          slug,
          partner_id: partnerId,
          parent_tenant_id: parentTenantId,
          subscription_tier: subscription_tier || 'free',
          max_sources: 10,
          max_newsletters_per_month: 5,
          max_ai_generations_per_month: 20,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ tenant: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPDATE sub-tenant
    if (action === 'update' && tenantId) {
      const updates: Record<string, unknown> = {};
      if (name) updates.name = name;
      if (subscription_tier) updates.subscription_tier = subscription_tier;

      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .eq('partner_id', partnerId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ tenant: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE sub-tenant
    if (action === 'delete' && tenantId) {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId)
        .eq('partner_id', partnerId)
        .neq('id', parentTenantId); // Cannot delete parent

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET usage stats
    if (action === 'stats') {
      // Get all sub-tenant IDs
      const { data: subTenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('partner_id', partnerId);

      const tenantIds = subTenants?.map(t => t.id) || [];

      // Aggregate usage
      const { count: totalNewsletters } = await supabase
        .from('newsletters')
        .select('*', { count: 'exact', head: true })
        .in('tenant_id', tenantIds);

      const { count: totalSources } = await supabase
        .from('sources')
        .select('*', { count: 'exact', head: true })
        .in('tenant_id', tenantIds);

      return new Response(JSON.stringify({
        stats: {
          total_tenants: tenantIds.length,
          total_newsletters: totalNewsletters || 0,
          total_sources: totalSources || 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
