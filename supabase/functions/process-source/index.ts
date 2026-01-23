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
    const { source_id, source_type, url, content, file_path } = await req.json();

    if (!source_id) {
      throw new Error('source_id is required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Update source status to processing
    await fetch(`${supabaseUrl}/rest/v1/knowledge_sources?id=eq.${source_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'processing' }),
    });

    let extractedContent = '';
    let title = '';
    let headers: string[] = [];

    /**
     * Parse DOCX file - DOCX is a ZIP archive containing XML files
     * Main content is in word/document.xml
     * Uses Deno's built-in compression APIs
     */
    async function parseDOCX(buffer: ArrayBuffer): Promise<{ text: string; headers: string[] }> {
      const foundHeaders: string[] = [];
      const texts: string[] = [];
      
      try {
        // DOCX is a ZIP file - use DecompressionStream to extract
        const zipData = new Uint8Array(buffer);
        
        // Look for the document.xml content within the ZIP
        // ZIP files have a specific structure - find local file headers
        let documentXml = '';
        let pos = 0;
        
        while (pos < zipData.length - 30) {
          // Local file header signature: 0x04034b50
          if (zipData[pos] === 0x50 && zipData[pos + 1] === 0x4B && 
              zipData[pos + 2] === 0x03 && zipData[pos + 3] === 0x04) {
            
            const compressionMethod = zipData[pos + 8] | (zipData[pos + 9] << 8);
            const compressedSize = zipData[pos + 18] | (zipData[pos + 19] << 8) | 
                                   (zipData[pos + 20] << 16) | (zipData[pos + 21] << 24);
            const uncompressedSize = zipData[pos + 22] | (zipData[pos + 23] << 8) | 
                                     (zipData[pos + 24] << 16) | (zipData[pos + 25] << 24);
            const fileNameLength = zipData[pos + 26] | (zipData[pos + 27] << 8);
            const extraFieldLength = zipData[pos + 28] | (zipData[pos + 29] << 8);
            
            const fileName = new TextDecoder().decode(
              zipData.slice(pos + 30, pos + 30 + fileNameLength)
            );
            
            const dataStart = pos + 30 + fileNameLength + extraFieldLength;
            const dataEnd = dataStart + compressedSize;
            
            if (fileName === 'word/document.xml' || fileName.endsWith('/document.xml')) {
              const compressedData = zipData.slice(dataStart, dataEnd);
              
              if (compressionMethod === 0) {
                // Stored (no compression)
                documentXml = new TextDecoder().decode(compressedData);
              } else if (compressionMethod === 8) {
                // Deflate compression - use DecompressionStream
                try {
                  const ds = new DecompressionStream('deflate-raw');
                  const writer = ds.writable.getWriter();
                  const reader = ds.readable.getReader();
                  
                  writer.write(compressedData);
                  writer.close();
                  
                  const chunks: Uint8Array[] = [];
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                  }
                  
                  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
                  const result = new Uint8Array(totalLength);
                  let offset = 0;
                  for (const chunk of chunks) {
                    result.set(chunk, offset);
                    offset += chunk.length;
                  }
                  
                  documentXml = new TextDecoder().decode(result);
                } catch (e) {
                  console.error('Decompression failed:', e);
                }
              }
              break;
            }
            
            pos = dataEnd;
          } else {
            pos++;
          }
        }
        
        if (documentXml) {
          // Extract text from <w:t> tags (Word text elements)
          const textMatches = documentXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
          for (const match of textMatches) {
            if (match[1].trim()) {
              texts.push(match[1]);
            }
          }
          
          // Look for heading styles to extract headers
          const paraMatches = documentXml.matchAll(/<w:p[^>]*>([\s\S]*?)<\/w:p>/g);
          for (const paraMatch of paraMatches) {
            const para = paraMatch[1];
            if (para.includes('Heading') || para.includes('Title')) {
              const paraTexts = para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g);
              const headerText = Array.from(paraTexts).map(m => m[1]).join('').trim();
              if (headerText && headerText.length < 200) {
                foundHeaders.push(headerText);
              }
            }
          }
        }
      } catch (e) {
        console.error('DOCX parsing error:', e);
      }
      
      const text = texts.join(' ').replace(/\s+/g, ' ').trim();
      return { text: text.substring(0, 100000), headers: foundHeaders.slice(0, 20) };
    }

    /**
     * Parse PDF file - Basic text extraction
     * NOTE: Full PDF parsing requires external libraries. This implementation
     * extracts visible text using PDF text operators but may miss complex layouts.
     * For production use with complex PDFs, consider using a PDF parsing service.
     */
    function parsePDF(buffer: ArrayBuffer): { text: string; headers: string[] } {
      const bytes = new Uint8Array(buffer);
      const foundHeaders: string[] = [];
      const extractedTexts: string[] = [];
      
      // Convert to string for pattern matching
      const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      
      // Method 1: Extract text from PDF text objects (BT...ET blocks)
      const textObjectMatches = rawText.matchAll(/BT\s*([\s\S]*?)\s*ET/g);
      for (const match of textObjectMatches) {
        const block = match[1];
        
        // Extract from Tj operator (show text)
        const tjMatches = block.matchAll(/\(([^)]*)\)\s*Tj/g);
        for (const tjMatch of tjMatches) {
          const text = tjMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\t/g, ' ')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')');
          if (text.trim()) extractedTexts.push(text);
        }
        
        // Extract from TJ operator (show text array)
        const tjArrayMatches = block.matchAll(/\[(.*?)\]\s*TJ/g);
        for (const tjArrayMatch of tjArrayMatches) {
          const items = tjArrayMatch[1].matchAll(/\(([^)]*)\)/g);
          for (const item of items) {
            if (item[1].trim()) extractedTexts.push(item[1]);
          }
        }
      }
      
      let text = '';
      if (extractedTexts.length > 0) {
        text = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();
      } else {
        // Fallback: Extract readable ASCII sequences
        text = rawText
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Detect potential headers (short capitalized lines)
      const lines = text.split(/[.\n]/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 3 && trimmed.length < 100) {
          if (trimmed === trimmed.toUpperCase() || /^[A-Z][a-z]/.test(trimmed)) {
            if (!foundHeaders.includes(trimmed)) {
              foundHeaders.push(trimmed);
            }
          }
        }
      }
      
      return { text: text.substring(0, 100000), headers: foundHeaders.slice(0, 20) };
    }

    // Handle different source types
    if (source_type === 'url' && url) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 Newsletter-Wizard/1.0' }
        });
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/pdf')) {
          const buffer = await response.arrayBuffer();
          const parsed = parsePDF(buffer);
          extractedContent = parsed.text;
          headers = parsed.headers;
          title = headers[0] || url;
        } else {
          const html = await response.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          title = titleMatch ? titleMatch[1].trim() : url;
          
          // Extract headers from HTML
          const hMatches = html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
          for (const match of hMatches) {
            headers.push(match[1].trim());
          }
          
          extractedContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 50000);
        }
      } catch (e) {
        throw new Error(`Failed to fetch URL: ${e.message}`);
      }
    } else if (source_type === 'manual' && content) {
      extractedContent = content;
      title = content.substring(0, 50);
    } else if (source_type === 'document' && file_path) {
      const fileResponse = await fetch(`${supabaseUrl}/storage/v1/object/public/documents/${file_path}`, {
        headers: { 'Authorization': `Bearer ${serviceRoleKey}` }
      });
      
      if (!fileResponse.ok) {
        throw new Error('Failed to download document');
      }

      const contentType = fileResponse.headers.get('content-type') || '';
      const buffer = await fileResponse.arrayBuffer();
      const lowerPath = file_path.toLowerCase();
      
      if (contentType.includes('pdf') || lowerPath.endsWith('.pdf')) {
        const parsed = parsePDF(buffer);
        extractedContent = parsed.text;
        headers = parsed.headers;
      } else if (contentType.includes('word') || lowerPath.endsWith('.docx')) {
        const parsed = await parseDOCX(buffer);
        extractedContent = parsed.text;
        headers = parsed.headers;
      } else if (contentType.includes('text/plain') || lowerPath.endsWith('.txt')) {
        extractedContent = new TextDecoder().decode(new Uint8Array(buffer));
      } else {
        // Generic fallback
        const bytes = new Uint8Array(buffer);
        extractedContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
          .replace(/[^\x20-\x7E\n]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      title = file_path.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Document';
    } else {
      throw new Error('Invalid source type or missing required data');
    }

    // Chunk the content with header context
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: { content: string; index: number; header_context?: string }[] = [];
    
    let currentHeader = '';
    for (let i = 0; i < extractedContent.length; i += (chunkSize - overlap)) {
      const chunk = extractedContent.substring(i, i + chunkSize);
      
      // Check if this chunk contains a header
      for (const h of headers) {
        if (chunk.includes(h)) {
          currentHeader = h;
          break;
        }
      }
      
      if (chunk.trim().length > 50) {
        chunks.push({ 
          content: chunk.trim(), 
          index: chunks.length,
          header_context: currentHeader || undefined
        });
      }
    }

    // Get source's tenant_id
    const sourceRes = await fetch(`${supabaseUrl}/rest/v1/knowledge_sources?id=eq.${source_id}&select=tenant_id`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });
    const sourceData = await sourceRes.json();
    const tenant_id = sourceData[0]?.tenant_id;

    if (!tenant_id) {
      throw new Error('Source not found');
    }

    // Get OpenAI API key from tenant settings
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/tenant_settings?tenant_id=eq.${tenant_id}&select=openai_api_key`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });
    const settingsData = await settingsRes.json();
    const openaiKey = settingsData[0]?.openai_api_key || Deno.env.get('OPENAI_API_KEY');

    // Delete existing chunks for this source
    await fetch(`${supabaseUrl}/rest/v1/source_chunks?source_id=eq.${source_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    });

    // Generate embeddings if API key available
    let embeddings: number[][] = [];
    let embeddingModel = null;
    
    if (openaiKey && chunks.length > 0) {
      try {
        const batchSize = 20;
        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: batch.map(c => c.header_context ? `${c.header_context}: ${c.content}` : c.content),
            }),
          });

          if (embeddingRes.ok) {
            const embData = await embeddingRes.json();
            embeddings.push(...embData.data.map((d: { embedding: number[] }) => d.embedding));
            embeddingModel = 'text-embedding-3-small';
          } else {
            console.error('Embedding API error:', await embeddingRes.text());
            break;
          }
        }
      } catch (e) {
        console.error('Failed to generate embeddings:', e);
      }
    }

    // Insert chunks with embeddings
    const chunkRecords = chunks.map((chunk, idx) => ({
      source_id,
      tenant_id,
      chunk_index: chunk.index,
      content: chunk.header_context ? `[${chunk.header_context}] ${chunk.content}` : chunk.content,
      token_count: Math.ceil(chunk.content.length / 4),
      embedding: embeddings[idx] ? JSON.stringify(embeddings[idx]) : null,
      embedding_model: embeddingModel,
    }));

    if (chunkRecords.length > 0) {
      await fetch(`${supabaseUrl}/rest/v1/source_chunks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(chunkRecords),
      });
    }

    // Update source with results
    const totalTokens = chunkRecords.reduce((sum, c) => sum + c.token_count, 0);
    await fetch(`${supabaseUrl}/rest/v1/knowledge_sources?id=eq.${source_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ready',
        title: title || 'Untitled',
        chunk_count: chunks.length,
        token_count: totalTokens,
      }),
    });

    return new Response(JSON.stringify({ 
      success: true, 
      chunks: chunks.length,
      tokens: totalTokens,
      embeddings_generated: embeddings.length > 0,
      headers_found: headers.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Process source error:', error);

    try {
      const { source_id } = await req.clone().json();
      if (source_id) {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        await fetch(`${supabaseUrl}/rest/v1/knowledge_sources?id=eq.${source_id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'error', error_message: error.message }),
        });
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return new Response(JSON.stringify({
      error: { code: 'PROCESS_SOURCE_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
