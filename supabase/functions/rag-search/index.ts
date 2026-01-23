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
    const { tenant_id, query, limit = 10 } = await req.json();

    if (!tenant_id || !query) {
      throw new Error('tenant_id and query are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
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

    let queryEmbedding: number[] | null = null;

    // Generate query embedding if API key available
    if (openaiKey) {
      try {
        const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: query,
          }),
        });

        if (embeddingRes.ok) {
          const embData = await embeddingRes.json();
          queryEmbedding = embData.data[0].embedding;
        }
      } catch (e) {
        console.error('Failed to generate query embedding:', e);
      }
    }

    let results: Array<{
      chunk_id: string;
      source_id: string;
      source_title: string;
      content: string;
      similarity: number;
    }> = [];

    if (queryEmbedding) {
      // Vector similarity search using RPC
      const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_chunks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_embedding: queryEmbedding,
          match_tenant_id: tenant_id,
          match_count: limit,
        }),
      });

      if (rpcRes.ok) {
        const matches = await rpcRes.json();
        
        // Get source titles
        const sourceIds = [...new Set(matches.map((m: { source_id: string }) => m.source_id))];
        let sourceTitles: Record<string, string> = {};
        
        if (sourceIds.length > 0) {
          const sourcesResponse = await fetch(
            `${supabaseUrl}/rest/v1/knowledge_sources?id=in.(${sourceIds.join(',')})&select=id,title`,
            {
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
              },
            }
          );
          const sources = await sourcesResponse.json();
          sourceTitles = Object.fromEntries(sources.map((s: { id: string; title: string }) => [s.id, s.title]));
        }

        results = matches.map((m: { id: string; source_id: string; content: string; similarity: number }) => ({
          chunk_id: m.id,
          source_id: m.source_id,
          source_title: sourceTitles[m.source_id] || 'Unknown',
          content: m.content,
          similarity: m.similarity,
        }));
      }
    }

    // Fallback to keyword search if no vector results
    if (results.length === 0) {
      const queryWords = query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      
      const chunksResponse = await fetch(
        `${supabaseUrl}/rest/v1/source_chunks?tenant_id=eq.${tenant_id}&select=id,source_id,content,token_count`, 
        {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
          },
        }
      );

      const chunksData = await chunksResponse.json();
      const chunks = Array.isArray(chunksData) ? chunksData : [];

      if (chunks.length > 0) {
        const scoredChunks = chunks.map((chunk: { id: string; source_id: string; content: string }) => {
          const contentLower = chunk.content.toLowerCase();
          let score = 0;
          
          for (const word of queryWords) {
            const matches = contentLower.split(word).length - 1;
            score += matches;
          }
          
          return { ...chunk, similarity: score / (queryWords.length || 1) };
        });

        scoredChunks.sort((a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity);
        const topChunks = scoredChunks.slice(0, limit);

        const sourceIds = [...new Set(topChunks.map((c: { source_id: string }) => c.source_id))];
        let sourceTitles: Record<string, string> = {};
        
        if (sourceIds.length > 0) {
          const sourcesResponse = await fetch(
            `${supabaseUrl}/rest/v1/knowledge_sources?id=in.(${sourceIds.join(',')})&select=id,title`,
            {
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
              },
            }
          );
          const sources = await sourcesResponse.json();
          sourceTitles = Object.fromEntries(sources.map((s: { id: string; title: string }) => [s.id, s.title]));
        }

        results = topChunks
          .filter((c: { similarity: number }) => c.similarity > 0)
          .map((chunk: { id: string; source_id: string; content: string; similarity: number }) => ({
            chunk_id: chunk.id,
            source_id: chunk.source_id,
            source_title: sourceTitles[chunk.source_id] || 'Unknown',
            content: chunk.content,
            similarity: Math.min(chunk.similarity / 5, 1),
          }));
      }
    }

    return new Response(JSON.stringify({ results, vector_search: queryEmbedding !== null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAG search error:', error);

    return new Response(JSON.stringify({
      error: { code: 'RAG_SEARCH_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
