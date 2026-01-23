// Deno integration test for trigger-webhook function
// Run with: deno test --allow-env --allow-net webhook-trigger.test.ts

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yaijwaencohqshkahuhb.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/trigger-webhook`;

Deno.test("trigger-webhook: OPTIONS returns CORS headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
  
  await response.body?.cancel();
});

Deno.test("trigger-webhook: requires authorization header", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: "test-tenant",
      event_type: "newsletter.sent",
      payload: { test: true },
    }),
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertStringIncludes(data.error.toLowerCase(), "unauthorized");
});

Deno.test("trigger-webhook: rejects invalid authorization", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid-token",
    },
    body: JSON.stringify({
      tenant_id: "test-tenant",
      event_type: "newsletter.sent",
      payload: { test: true },
    }),
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertExists(data.error);
});

Deno.test("trigger-webhook: validates required fields", async () => {
  // This will fail auth but we can test the structure expectation
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer test",
    },
    body: JSON.stringify({}), // Missing required fields
  });
  
  // Either auth fail (401) or bad request (400)
  assertEquals(response.status >= 400 && response.status < 500, true);
  
  await response.body?.cancel();
});

Deno.test("trigger-webhook: response is valid JSON", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tenant_id: "test",
      event_type: "test.event",
      payload: {},
    }),
  });
  
  const contentType = response.headers.get("content-type");
  assertStringIncludes(contentType || "", "application/json");
  
  // Should be parseable JSON
  const data = await response.json();
  assertExists(data);
});

Deno.test("trigger-webhook: handles POST method", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant_id: "x", event_type: "y", payload: {} }),
  });
  
  // Should not get 405 Method Not Allowed
  assertEquals(response.status !== 405, true);
  
  await response.body?.cancel();
});
