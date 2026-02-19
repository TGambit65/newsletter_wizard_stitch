// Deno test for preview-voice edge function
// Run with: deno test --allow-env --allow-net

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL") || "https://yaijwaencohqshkahuhb.supabase.co";
const FUNCTION_URL  = `${SUPABASE_URL}/functions/v1/preview-voice`;

Deno.test("preview-voice - OPTIONS returns CORS headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });

  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));

  await response.body?.cancel();
});

Deno.test("preview-voice - rejects missing required fields", async () => {
  const response = await fetch(FUNCTION_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({}),
  });

  assertEquals(response.status, 400);
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("preview-voice - rejects empty sample_text", async () => {
  const response = await fetch(FUNCTION_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      tenant_id:    "test-tenant",
      sample_text:  "   ",
      tone_markers: { archetype: "educator", formality: 50, humor: 30, technicality: 40, energy: 60 },
    }),
  });

  assertEquals(response.status, 400);
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("preview-voice - rejects missing tone_markers", async () => {
  const response = await fetch(FUNCTION_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      tenant_id:   "test-tenant",
      sample_text: "Hello world",
    }),
  });

  assertEquals(response.status, 400);
  const data = await response.json();
  assertExists(data.error);
});
