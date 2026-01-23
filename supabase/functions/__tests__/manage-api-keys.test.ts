// Deno test for manage-api-keys edge function
// Run with: deno test --allow-env --allow-net

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yaijwaencohqshkahuhb.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/manage-api-keys`;

Deno.test("manage-api-keys - OPTIONS returns CORS headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });
  
  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));
  assertExists(response.headers.get("x-content-type-options"));
  
  await response.body?.cancel();
});

Deno.test("manage-api-keys - requires authorization", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list" }),
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.error, "Unauthorized");
});

Deno.test("manage-api-keys - rejects invalid auth token", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid-token",
    },
    body: JSON.stringify({ action: "list" }),
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.error, "Unauthorized");
});
