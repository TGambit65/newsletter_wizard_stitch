// Deno test for log-audit edge function
// Run with: deno test --allow-env --allow-net

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yaijwaencohqshkahuhb.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/log-audit`;

Deno.test("log-audit - OPTIONS returns CORS headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
  assertExists(response.headers.get("x-content-type-options"));
  
  await response.body?.cancel();
});

Deno.test("log-audit - requires authorization", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "test",
      resource_type: "test",
      tenant_id: "test-tenant",
    }),
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.error, "Unauthorized");
});

Deno.test("log-audit - includes security headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.headers.get("x-content-type-options"), "nosniff");
  assertEquals(response.headers.get("x-frame-options"), "DENY");
  assertEquals(response.headers.get("x-xss-protection"), "1; mode=block");
  
  await response.body?.cancel();
});
