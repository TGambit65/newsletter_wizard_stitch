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
    const { newsletter_id, recipients, is_test, list_id } = await req.json();

    if (!newsletter_id) {
      throw new Error('newsletter_id is required');
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('recipients array is required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Fetch newsletter
    const newsletterRes = await fetch(
      `${supabaseUrl}/rest/v1/newsletters?id=eq.${newsletter_id}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );
    const newsletters = await newsletterRes.json();
    const newsletter = newsletters[0];

    if (!newsletter) {
      throw new Error('Newsletter not found');
    }

    // Get tenant settings including ESP provider
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/tenant_settings?tenant_id=eq.${newsletter.tenant_id}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );
    const settingsData = await settingsRes.json();
    const settings = settingsData[0] || {};
    
    const espProvider = settings.esp_provider || 'sendgrid';
    const sendgridKey = settings.sendgrid_api_key || Deno.env.get('SENDGRID_API_KEY');
    const mailchimpKey = settings.mailchimp_api_key;
    const convertkitKey = settings.convertkit_api_key;

    // Get tenant info for from email
    const tenantRes = await fetch(
      `${supabaseUrl}/rest/v1/tenants?id=eq.${newsletter.tenant_id}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );
    const tenants = await tenantRes.json();
    const tenant = tenants[0];

    const fromEmail = tenant?.sender_email || 'newsletter@example.com';
    const fromName = tenant?.company_name || 'Newsletter Wizard';

    // Prepare email content
    const subject = is_test ? `[TEST] ${newsletter.subject_line || newsletter.title}` : (newsletter.subject_line || newsletter.title);
    const htmlContent = wrapInEmailTemplate(newsletter.content_html || '', newsletter.title);

    let sendResult = { success: false, provider: espProvider, message: '' };

    // Route to appropriate ESP based on provider setting
    if (espProvider === 'mailchimp' && mailchimpKey) {
      // Send via Mailchimp
      sendResult = await sendViaMailchimp(mailchimpKey, list_id, subject, fromName, fromEmail, htmlContent);
    } else if (espProvider === 'convertkit' && convertkitKey) {
      // Send via ConvertKit
      sendResult = await sendViaConvertKit(convertkitKey, subject, htmlContent);
    } else if (sendgridKey) {
      // Send via SendGrid (default)
      sendResult = await sendViaSendGrid(sendgridKey, recipients, subject, fromEmail, fromName, htmlContent, newsletter.content_text);
    } else {
      throw new Error(`No API key configured for ${espProvider}. Please add it in Settings.`);
    }

    if (!sendResult.success) {
      throw new Error(sendResult.message || `Failed to send via ${espProvider}`);
    }

    // Update newsletter status if not a test send
    if (!is_test) {
      await fetch(`${supabaseUrl}/rest/v1/newsletters?id=eq.${newsletter_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      provider: sendResult.provider,
      recipients_count: recipients.length,
      is_test,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Send newsletter error:', error);

    return new Response(JSON.stringify({
      error: { code: 'SEND_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendViaSendGrid(
  apiKey: string,
  recipients: string[],
  subject: string,
  fromEmail: string,
  fromName: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; provider: string; message: string }> {
  const personalizations = recipients.map((email: string) => ({
    to: [{ email }],
  }));

  const sendgridRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations,
      from: { email: fromEmail, name: fromName },
      subject,
      content: [
        { type: 'text/plain', value: textContent || stripHtml(htmlContent) },
        { type: 'text/html', value: htmlContent },
      ],
    }),
  });

  if (!sendgridRes.ok) {
    const errorText = await sendgridRes.text();
    console.error('SendGrid error:', errorText);
    return { success: false, provider: 'sendgrid', message: `SendGrid error: ${sendgridRes.status}` };
  }

  return { success: true, provider: 'sendgrid', message: 'Sent successfully' };
}

async function sendViaMailchimp(
  apiKey: string,
  listId: string,
  subject: string,
  fromName: string,
  fromEmail: string,
  htmlContent: string
): Promise<{ success: boolean; provider: string; message: string }> {
  // Extract datacenter from API key
  const dcMatch = apiKey.match(/-([a-z]+\d+)$/);
  if (!dcMatch) {
    return { success: false, provider: 'mailchimp', message: 'Invalid Mailchimp API key format' };
  }
  const datacenter = dcMatch[1];
  const baseUrl = `https://${datacenter}.api.mailchimp.com/3.0`;

  if (!listId) {
    return { success: false, provider: 'mailchimp', message: 'Mailchimp list_id is required' };
  }

  try {
    // Create campaign
    const campaignRes = await fetch(`${baseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${apiKey}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'regular',
        recipients: { list_id: listId },
        settings: {
          subject_line: subject,
          from_name: fromName,
          reply_to: fromEmail,
          title: subject,
        },
      }),
    });

    if (!campaignRes.ok) {
      const errorData = await campaignRes.json();
      return { success: false, provider: 'mailchimp', message: errorData.detail || 'Failed to create campaign' };
    }

    const campaign = await campaignRes.json();

    // Set content
    await fetch(`${baseUrl}/campaigns/${campaign.id}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${apiKey}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html: htmlContent }),
    });

    // Send
    const sendRes = await fetch(`${baseUrl}/campaigns/${campaign.id}/actions/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${apiKey}`)}`,
      },
    });

    if (!sendRes.ok) {
      const errorData = await sendRes.json();
      return { success: false, provider: 'mailchimp', message: errorData.detail || 'Failed to send' };
    }

    return { success: true, provider: 'mailchimp', message: 'Campaign sent' };
  } catch (e) {
    return { success: false, provider: 'mailchimp', message: e.message };
  }
}

async function sendViaConvertKit(
  apiSecret: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; provider: string; message: string }> {
  try {
    const broadcastRes = await fetch('https://api.convertkit.com/v3/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: apiSecret,
        subject,
        content: htmlContent,
        email_layout_template: 'Text only',
        public: false,
      }),
    });

    if (!broadcastRes.ok) {
      const errorData = await broadcastRes.json();
      return { success: false, provider: 'convertkit', message: errorData.message || 'Failed to create broadcast' };
    }

    const broadcast = await broadcastRes.json();

    // Publish/send the broadcast
    await fetch(`https://api.convertkit.com/v3/broadcasts/${broadcast.broadcast?.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: apiSecret,
        published_at: new Date().toISOString(),
      }),
    });

    return { success: true, provider: 'convertkit', message: 'Broadcast created' };
  } catch (e) {
    return { success: false, provider: 'convertkit', message: e.message };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function wrapInEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; }
    h2 { color: #333; }
    p { margin: 1em 0; }
    ul, ol { padding-left: 20px; }
    blockquote { border-left: 4px solid #e5e5e5; margin-left: 0; padding-left: 16px; color: #666; }
    a { color: #6366f1; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  ${content}
  <div class="footer">
    <p>Sent via Newsletter Wizard</p>
  </div>
</body>
</html>
  `.trim();
}
