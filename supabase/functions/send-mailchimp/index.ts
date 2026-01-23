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
    const { api_key, list_id, subject, from_name, from_email, content_html, newsletter_id } = await req.json();

    if (!api_key || !list_id || !subject || !content_html) {
      throw new Error('api_key, list_id, subject, and content_html are required');
    }

    // Extract datacenter from API key (format: xxx-dc)
    const dcMatch = api_key.match(/-([a-z]+\d+)$/);
    if (!dcMatch) {
      throw new Error('Invalid Mailchimp API key format');
    }
    const datacenter = dcMatch[1];
    const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`;

    // Create campaign
    const campaignRes = await fetch(`${baseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${api_key}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'regular',
        recipients: {
          list_id: list_id,
        },
        settings: {
          subject_line: subject,
          from_name: from_name || 'Newsletter',
          reply_to: from_email || 'newsletter@example.com',
          title: subject,
        },
      }),
    });

    if (!campaignRes.ok) {
      const errorData = await campaignRes.json();
      throw new Error(`Failed to create campaign: ${errorData.detail || campaignRes.statusText}`);
    }

    const campaign = await campaignRes.json();
    const campaignId = campaign.id;

    // Set campaign content
    const contentRes = await fetch(`${baseUrl}/campaigns/${campaignId}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${api_key}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: content_html,
      }),
    });

    if (!contentRes.ok) {
      const errorData = await contentRes.json();
      throw new Error(`Failed to set content: ${errorData.detail || contentRes.statusText}`);
    }

    // Send campaign
    const sendRes = await fetch(`${baseUrl}/campaigns/${campaignId}/actions/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${api_key}`)}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sendRes.ok) {
      const errorData = await sendRes.json();
      throw new Error(`Failed to send campaign: ${errorData.detail || sendRes.statusText}`);
    }

    return new Response(JSON.stringify({
      success: true,
      campaign_id: campaignId,
      message: 'Campaign sent successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mailchimp send error:', error);

    return new Response(JSON.stringify({
      error: { code: 'MAILCHIMP_SEND_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
