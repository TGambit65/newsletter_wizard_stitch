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
    const { api_secret, subject, content_html, newsletter_id, email_address } = await req.json();

    if (!api_secret || !subject || !content_html) {
      throw new Error('api_secret, subject, and content_html are required');
    }

    const baseUrl = 'https://api.convertkit.com/v3';

    // Create broadcast
    const broadcastRes = await fetch(`${baseUrl}/broadcasts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_secret: api_secret,
        subject: subject,
        content: content_html,
        email_layout_template: 'Text only',
        public: false,
      }),
    });

    if (!broadcastRes.ok) {
      const errorData = await broadcastRes.json();
      throw new Error(`Failed to create broadcast: ${errorData.error || errorData.message || broadcastRes.statusText}`);
    }

    const broadcast = await broadcastRes.json();
    const broadcastId = broadcast.broadcast?.id;

    if (!broadcastId) {
      throw new Error('Failed to get broadcast ID from response');
    }

    // Send the broadcast (schedule for immediate send)
    const sendRes = await fetch(`${baseUrl}/broadcasts/${broadcastId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_secret: api_secret,
        published_at: new Date().toISOString(),
      }),
    });

    if (!sendRes.ok) {
      const errorData = await sendRes.json();
      // If already published, that's okay
      if (!errorData.message?.includes('already published')) {
        throw new Error(`Failed to send broadcast: ${errorData.error || errorData.message || sendRes.statusText}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      broadcast_id: broadcastId,
      message: 'Broadcast created and scheduled',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ConvertKit send error:', error);

    return new Response(JSON.stringify({
      error: { code: 'CONVERTKIT_SEND_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
