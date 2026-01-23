// Deno integration test for validate-api-key function
// Run with: deno test --allow-env --allow-net api-key-validation.test.ts

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yaijwaencohqshkahuhb.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/validate-api-key`;

Deno.test("validate-api-key: OPTIONS returns CORS headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
  assertExists(response.headers.get("access-control-allow-headers"));
  
  await response.body?.cancel();
});

Deno.test("validate-api-key: returns 401 when no API key provided", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.valid, false);
  assertStringIncludes(data.error.toLowerCase(), "api key");
});

Deno.test("validate-api-key: accepts X-API-Key header", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "nw_test_invalid_key_12345",
    },
  });
  
  // Should get 401 for invalid key, but request should be processed
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.valid, false);
});

Deno.test("validate-api-key: includes security headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.headers.get("x-content-type-options"), "nosniff");
  assertEquals(response.headers.get("x-frame-options"), "DENY");
  assertEquals(response.headers.get("x-xss-protection"), "1; mode=block");
  
  await response.body?.cancel();
});

Deno.test("validate-api-key: response contains expected fields for invalid key", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "nw_fake_key_for_testing",
    },
  });
  
  const data = await response.json();
  
  // Should have valid field set to false
  assertEquals(typeof data.valid, "boolean");
  assertEquals(data.valid, false);
  
  // Should have error message
  assertExists(data.error);
  assertEquals(typeof data.error, "string");
});

Deno.test("validate-api-key: handles malformed JSON gracefully", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "nw_test_key",
    },
    body: "not valid json",
  });
  
  // Should still process and return a valid response
  const status = response.status;
  // Either 401 (no key) or 500 (internal error) but not a crash
  assertEquals(status >= 400 && status < 600, true);
  
  await response.body?.cancel();
});
