import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getOwnedProduct } from "./owns-product.ts";

interface QueryHandler {
  (filters: { col: string; val: string }[]): {
    data: unknown;
    error: Error | null;
  };
}

function makeClient(handler: QueryHandler) {
  const calls: { filters: { col: string; val: string }[] }[] = [];
  const mock = {
    from: () => ({
      select: () => {
        const filters: { col: string; val: string }[] = [];
        // deno-lint-ignore no-explicit-any
        const builder: any = {
          eq: (col: string, val: string) => {
            filters.push({ col, val });
            return builder;
          },
          // deno-lint-ignore require-await
          maybeSingle: async () => {
            calls.push({ filters: [...filters] });
            return handler(filters);
          },
        };
        return builder;
      },
    }),
  };
  return { client: mock as unknown as SupabaseClient, calls };
}

describe("getOwnedProduct — regression for Bug 4 (admin-invite cross-tenant)", () => {
  it("returns the product when admin owns it", async () => {
    const { client } = makeClient((filters) => {
      const idF = filters.find((f) => f.col === "id");
      const adminF = filters.find((f) => f.col === "admin_id");
      if (idF?.val === "p1" && adminF?.val === "admin-A") {
        return { data: { id: "p1" }, error: null };
      }
      return { data: null, error: null };
    });
    const product = await getOwnedProduct(client, "admin-A", "p1");
    assertEquals(product, { id: "p1" });
  });

  it("returns null when admin does NOT own the product (cross-tenant attempt)", async () => {
    const { client } = makeClient((filters) => {
      const adminF = filters.find((f) => f.col === "admin_id");
      // Simulates RLS-style filter: admin-A is not the owner; row not returned
      if (adminF?.val === "admin-A") {
        return { data: null, error: null };
      }
      // Without admin_id filter, the unfiltered query would have returned the product
      return { data: { id: "p1-secret" }, error: null };
    });
    const product = await getOwnedProduct(client, "admin-A", "p1");
    assertEquals(product, null);
  });

  it("filters by BOTH id AND admin_id (defense in depth)", async () => {
    const { client, calls } = makeClient(() => ({ data: null, error: null }));
    await getOwnedProduct(client, "admin-A", "p1");
    assertEquals(calls.length, 1);
    const cols = calls[0].filters.map((f) => f.col).sort();
    assertEquals(cols, ["admin_id", "id"]);
  });

  it("propagates DB errors", async () => {
    const { client } = makeClient(() => ({
      data: null,
      error: new Error("connection refused"),
    }));
    await assertRejects(
      () => getOwnedProduct(client, "admin-A", "p1"),
      Error,
      "connection refused",
    );
  });
});
