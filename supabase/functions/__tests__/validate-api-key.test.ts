// Deno test for validate-api-key edge function
// Run with: deno test --allow-env --allow-net

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yaijwaencohqshkahuhb.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/validate-api-key`;

Deno.test("validate-api-key - OPTIONS returns CORS headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
  assertExists(response.headers.get("x-content-type-options"));
  
  await response.body?.cancel();
});

Deno.test("validate-api-key - requires API key", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.valid, false);
  assertExists(data.error);
});

Deno.test("validate-api-key - rejects invalid API key", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "nw_invalid_key_12345",
    },
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.valid, false);
});

Deno.test("validate-api-key - includes security headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.headers.get("x-content-type-options"), "nosniff");
  assertEquals(response.headers.get("x-frame-options"), "DENY");
  
  await response.body?.cancel();
});
