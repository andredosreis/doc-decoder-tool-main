import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { setAdminRole } from "./admin-role.ts";

interface UpdateResult {
  data: Array<{ user_id: string }> | null;
  error: Error | null;
}

function makeClient(updateResults: UpdateResult[]) {
  let callCount = 0;
  const mock = {
    from: () => ({
      update: () => ({
        eq: () => ({
          // deno-lint-ignore require-await
          select: async () => {
            const r = updateResults[callCount] ?? { data: [], error: null };
            callCount++;
            return r;
          },
        }),
      }),
    }),
  };
  return {
    client: mock as unknown as SupabaseClient,
    callCount: () => callCount,
  };
}

describe("setAdminRole — regression for Bug 1 (process-payment role swallow)", () => {
  it("succeeds when first attempt updates 1 row", async () => {
    const { client, callCount } = makeClient([
      { data: [{ user_id: "u1" }], error: null },
    ]);
    await setAdminRole(client, "u1", { retryDelayMs: 0 });
    assertEquals(callCount(), 1);
  });

  it("retries once after 0 rows (trigger race) and succeeds on second attempt", async () => {
    const { client, callCount } = makeClient([
      { data: [], error: null },
      { data: [{ user_id: "u1" }], error: null },
    ]);
    await setAdminRole(client, "u1", { retryDelayMs: 0 });
    assertEquals(callCount(), 2);
  });

  it("throws when both attempts return 0 rows", async () => {
    const { client, callCount } = makeClient([
      { data: [], error: null },
      { data: [], error: null },
    ]);
    await assertRejects(
      () => setAdminRole(client, "u1", { retryDelayMs: 0 }),
      Error,
      "user_roles row not found after retry",
    );
    assertEquals(callCount(), 2);
  });

  it("throws on first-attempt DB error without retry", async () => {
    const { client, callCount } = makeClient([
      { data: null, error: new Error("Postgres connection refused") },
    ]);
    await assertRejects(
      () => setAdminRole(client, "u1", { retryDelayMs: 0 }),
      Error,
      "Postgres connection refused",
    );
    assertEquals(callCount(), 1);
  });

  it("throws on retry-attempt DB error", async () => {
    const { client, callCount } = makeClient([
      { data: [], error: null },
      { data: null, error: new Error("Postgres lock contention") },
    ]);
    await assertRejects(
      () => setAdminRole(client, "u1", { retryDelayMs: 0 }),
      Error,
      "Postgres lock contention",
    );
    assertEquals(callCount(), 2);
  });
});
