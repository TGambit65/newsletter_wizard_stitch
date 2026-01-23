import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Pricing tiers (cents)
const PRICING = {
  newsletter_sent: 5,      // $0.05 per newsletter sent
  ai_generation: 10,       // $0.10 per AI generation
  source_processed: 2,     // $0.02 per source processed
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check - require service role or authenticated partner user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, partner_id, period_start, period_end } = body;

    // CALCULATE billing for a partner
    if (action === 'calculate') {
      if (!partner_id || !period_start || !period_end) {
        return new Response(JSON.stringify({ error: 'partner_id, period_start, and period_end required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all tenants for this partner
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('partner_id', partner_id);

      if (!tenants || tenants.length === 0) {
        return new Response(JSON.stringify({ message: 'No tenants found for partner' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const billingRecords = [];

      for (const tenant of tenants) {
        // Count newsletters sent in period
        const { count: newslettersSent } = await supabase
          .from('newsletters')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'sent')
          .gte('updated_at', period_start)
          .lte('updated_at', period_end);

        // Count sources processed in period
        const { count: sourcesProcessed } = await supabase
          .from('sources')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'processed')
          .gte('processed_at', period_start)
          .lte('processed_at', period_end);

        // Estimate AI generations (rough: 1 per newsletter + some extras)
        const aiGenerations = (newslettersSent || 0) * 2;

        // Calculate amount
        const amount_cents = 
          (newslettersSent || 0) * PRICING.newsletter_sent +
          aiGenerations * PRICING.ai_generation +
          (sourcesProcessed || 0) * PRICING.source_processed;

        // Check if record already exists for this period
        const { data: existing } = await supabase
          .from('billing_records')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('period_start', period_start)
          .eq('period_end', period_end)
          .maybeSingle();

        if (existing) {
          // Update existing record
          const { data, error } = await supabase
            .from('billing_records')
            .update({
              newsletters_sent: newslettersSent || 0,
              ai_generations: aiGenerations,
              sources_processed: sourcesProcessed || 0,
              amount_cents,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (!error) billingRecords.push(data);
        } else {
          // Insert new record
          const { data, error } = await supabase
            .from('billing_records')
            .insert({
              partner_id,
              tenant_id: tenant.id,
              period_start,
              period_end,
              newsletters_sent: newslettersSent || 0,
              ai_generations: aiGenerations,
              sources_processed: sourcesProcessed || 0,
              amount_cents,
              status: 'pending',
            })
            .select()
            .single();

          if (!error) billingRecords.push(data);
        }
      }

      return new Response(JSON.stringify({ 
        records: billingRecords,
        total_amount_cents: billingRecords.reduce((sum, r) => sum + r.amount_cents, 0)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // LIST billing records for a partner
    if (action === 'list') {
      if (!partner_id) {
        return new Response(JSON.stringify({ error: 'partner_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('billing_records')
        .select(`
          *,
          tenant:tenants(name)
        `)
        .eq('partner_id', partner_id)
        .order('period_start', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ records: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPDATE billing status
    if (action === 'update_status') {
      const { record_id, status } = body;
      if (!record_id || !status) {
        return new Response(JSON.stringify({ error: 'record_id and status required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const validStatuses = ['pending', 'invoiced', 'paid'];
      if (!validStatuses.includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('billing_records')
        .update({ status })
        .eq('id', record_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ record: data }), {
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
