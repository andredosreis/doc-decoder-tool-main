import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { findProductByPayload } from "./find-product-by-payload.ts";

interface QueryHandler {
  (filters: { col: string; val: string }[]): {
    data: unknown;
    error: Error | null;
  };
}

function makeClient(handler: QueryHandler) {
  const calls: { table: string; filters: { col: string; val: string }[] }[] = [];
  const mock = {
    from: (table: string) => ({
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
            calls.push({ table, filters: [...filters] });
            return handler(filters);
          },
        };
        return builder;
      },
    }),
  };
  return { client: mock as unknown as SupabaseClient, calls };
}

describe("findProductByPayload — regression for Bug 3 (.or() filter injection)", () => {
  it("throws when both identifiers are undefined", async () => {
    const { client } = makeClient(() => ({ data: null, error: null }));
    await assertRejects(
      () => findProductByPayload(client, {}),
      Error,
      "Missing product identifier",
    );
  });

  it("throws when both identifiers are empty/whitespace strings", async () => {
    const { client } = makeClient(() => ({ data: null, error: null }));
    await assertRejects(
      () =>
        findProductByPayload(client, {
          external_product_id: "",
          product_id: "  ",
        }),
      Error,
      "Missing product identifier",
    );
  });

  it("uses external_product_id with .eq() (no .or() interpolation)", async () => {
    const { client, calls } = makeClient((filters) => {
      const f = filters.find((x) => x.col === "external_product_id");
      return f?.val === "ext-123"
        ? { data: { id: "p1", admin_id: "a1" }, error: null }
        : { data: null, error: null };
    });
    const product = await findProductByPayload(client, {
      external_product_id: "ext-123",
    });
    assertEquals(product, { id: "p1", admin_id: "a1" });
    assertEquals(calls.length, 1);
    assertEquals(calls[0].filters[0].col, "external_product_id");
    assertEquals(calls[0].filters[0].val, "ext-123");
  });

  it("passes special PostgREST chars verbatim via .eq() (no filter injection)", async () => {
    // Exploit attempted previously: a value containing `,id.eq.evil` would
    // break the .or() filter and match unrelated rows. With .eq(), the driver
    // parametrizes the value and treats it as a literal string.
    const exploitValue = "id.eq.evil,foo,);DROP TABLE products;";
    const { client, calls } = makeClient((filters) => {
      const f = filters.find((x) => x.col === "external_product_id");
      return f?.val === exploitValue
        ? { data: { id: "p1", admin_id: "a1" }, error: null }
        : { data: null, error: null };
    });
    await findProductByPayload(client, { external_product_id: exploitValue });
    assertEquals(calls[0].filters[0].val, exploitValue);
    assertEquals(calls[0].filters.length, 1, "exactly one .eq() filter applied");
  });

  it("falls back to product_id when valid UUID and external_product_id is absent", async () => {
    const validUuid = "11111111-2222-3333-4444-555555555555";
    const { client, calls } = makeClient((filters) => {
      const f = filters.find((x) => x.col === "id");
      return f?.val === validUuid
        ? { data: { id: validUuid, admin_id: "a2" }, error: null }
        : { data: null, error: null };
    });
    const product = await findProductByPayload(client, {
      product_id: validUuid,
    });
    assertEquals(product?.id, validUuid);
    assertEquals(calls.length, 1);
    assertEquals(calls[0].filters[0].col, "id");
  });

  it("does NOT query products by id when product_id is not a valid UUID", async () => {
    const { client, calls } = makeClient((filters) => {
      if (
        filters.some(
          (f) => f.col === "external_product_id" && f.val === "fallback",
        )
      ) {
        return { data: null, error: null };
      }
      return { data: { id: "should-not-reach", admin_id: "x" }, error: null };
    });
    const product = await findProductByPayload(client, {
      external_product_id: "fallback",
      product_id: "not-a-uuid-id.eq.evil",
    });
    assertEquals(product, null);
    assertEquals(calls.length, 1, "only external_product_id query ran");
    assertEquals(calls[0].filters[0].col, "external_product_id");
  });

  it("returns null when no identifier matches", async () => {
    const { client } = makeClient(() => ({ data: null, error: null }));
    const product = await findProductByPayload(client, {
      external_product_id: "unknown",
    });
    assertEquals(product, null);
  });

  it("propagates DB errors from external_product_id query", async () => {
    const { client } = makeClient(() => ({
      data: null,
      error: new Error("Postgres timeout"),
    }));
    await assertRejects(
      () => findProductByPayload(client, { external_product_id: "ext-1" }),
      Error,
      "Postgres timeout",
    );
  });
});
