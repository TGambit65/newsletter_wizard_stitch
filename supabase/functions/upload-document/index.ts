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
    const { fileData, fileName, mimeType, tenant_id } = await req.json();

    if (!fileData || !fileName || !tenant_id) {
      throw new Error('fileData, fileName, and tenant_id are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // Use the anon key directly - bucket has public RLS policies
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaWp3YWVuY29ocXNoa2FodWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTc0NjIsImV4cCI6MjA4NDYzMzQ2Mn0.rd0OgUpHQ0Uy7ZJFWdzEljAeybdn6bidPG71Jo6Zk8s';

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    // Extract base64 data
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate storage path
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${tenant_id}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/documents/${storagePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': mimeType || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: binaryData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Storage upload error:', errorText);
      throw new Error(`Storage upload failed: ${errorText}`);
    }

    // Create knowledge source record
    const sourceData = {
      tenant_id,
      source_type: 'document',
      title: fileName,
      original_filename: fileName,
      mime_type: mimeType,
      file_path: storagePath,
      file_size_bytes: binaryData.length,
      status: 'pending',
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/knowledge_sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(sourceData),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Database insert error:', errorText);
      throw new Error(`Database insert failed: ${errorText}`);
    }

    const source = await insertResponse.json();

    return new Response(JSON.stringify({
      success: true,
      source: source[0],
      file_path: storagePath,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Upload document error:', error);

    return new Response(JSON.stringify({
      error: { code: 'UPLOAD_DOCUMENT_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
