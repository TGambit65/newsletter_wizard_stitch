// Deno test for reactivate-account edge function
// Run with: deno test --allow-env --allow-net

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://yaijwaencohqshkahuhb.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/reactivate-account`;

Deno.test("reactivate-account - OPTIONS returns CORS headers", async () => {
  const response = await fetch(FUNCTION_URL, { method: "OPTIONS" });

  assertEquals(response.status, 200);
  assertExists(response.headers.get("access-control-allow-origin"));

  await response.body?.cancel();
});

Deno.test("reactivate-account - requires authorization header", async () => {
  const response = await fetch(FUNCTION_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({}),
  });

  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.error, "Unauthorized");
});

Deno.test("reactivate-account - rejects invalid auth token", async () => {
  const response = await fetch(FUNCTION_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Bearer not-a-real-token",
    },
    body: JSON.stringify({}),
  });

  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.error, "Unauthorized");
});
