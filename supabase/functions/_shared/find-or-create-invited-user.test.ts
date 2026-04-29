import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { findOrCreateInvitedUser } from "./find-or-create-invited-user.ts";

interface ProfileLookupResult {
  data: { id: string } | null;
  error: Error | null;
}

interface CreateUserResult {
  data: { user: { id: string } } | null;
  error: Error | null;
}

interface MockHandlers {
  profileLookup?: (email: string) => ProfileLookupResult;
  // deno-lint-ignore no-explicit-any
  createUser?: (input: any) => CreateUserResult;
}

function makeClient(handlers: MockHandlers = {}) {
  // deno-lint-ignore no-explicit-any
  const calls: { type: string; args: any[] }[] = [];

  const mock = {
    from: () => ({
      select: () => ({
        eq: (_col: string, val: string) => ({
          // deno-lint-ignore require-await
          maybeSingle: async () => {
            calls.push({ type: "profile.lookup", args: [val] });
            return (
              handlers.profileLookup?.(val) ?? { data: null, error: null }
            );
          },
        }),
      }),
    }),
    auth: {
      admin: {
        // deno-lint-ignore no-explicit-any require-await
        createUser: async (input: any) => {
          calls.push({ type: "createUser", args: [input] });
          return (
            handlers.createUser?.(input) ?? {
              data: { user: { id: "auto-created-user-id" } },
              error: null,
            }
          );
        },
      },
    },
  };
  return { client: mock as unknown as SupabaseClient, calls };
}

describe("findOrCreateInvitedUser — Tier 1 regression (admin-invite-student)", () => {
  it("(1) returns existing profile and does NOT call createUser (idempotency)", async () => {
    const { client, calls } = makeClient({
      profileLookup: () => ({ data: { id: "existing-user-id" }, error: null }),
    });
    const result = await findOrCreateInvitedUser(
      client,
      "existing@example.com",
      "Existing User",
    );
    assertEquals(result, { userId: "existing-user-id", isNew: false });
    // Only the profile lookup ran; createUser must NOT have been invoked.
    assertEquals(calls.length, 1);
    assertEquals(calls[0].type, "profile.lookup");
  });

  it("(2) creates user via auth.admin.createUser when no existing profile and returns isNew=true", async () => {
    const { client, calls } = makeClient({
      profileLookup: () => ({ data: null, error: null }),
      createUser: () => ({
        data: { user: { id: "newly-created-user-id" } },
        error: null,
      }),
    });
    const result = await findOrCreateInvitedUser(
      client,
      "new@example.com",
      "New User",
    );
    assertEquals(result, { userId: "newly-created-user-id", isNew: true });
    assertEquals(calls.length, 2);
    assertEquals(calls[1].type, "createUser");
    // Critical payload fields:
    const createUserPayload = calls[1].args[0];
    assertEquals(createUserPayload.email, "new@example.com");
    assertEquals(createUserPayload.email_confirm, true);
    assertEquals(createUserPayload.user_metadata.full_name, "New User");
  });

  it("(3) propagates createUser error with helpful message", async () => {
    const { client } = makeClient({
      profileLookup: () => ({ data: null, error: null }),
      createUser: () => ({
        data: null,
        error: new Error("auth.users email_unique constraint violation"),
      }),
    });
    await assertRejects(
      () => findOrCreateInvitedUser(client, "x@y.com", ""),
      Error,
      "Erro ao criar usuário",
    );
  });

  it("(4) profile lookup query uses lowercased email (admin types mixed case)", async () => {
    const { client, calls } = makeClient({
      profileLookup: () => ({ data: null, error: null }),
    });
    await findOrCreateInvitedUser(client, "MixedCase@EXAMPLE.com", "X");
    assertEquals(calls[0].type, "profile.lookup");
    assertEquals(calls[0].args[0], "mixedcase@example.com");
  });

  it("(5) propagates profile lookup error without calling createUser", async () => {
    const { client, calls } = makeClient({
      profileLookup: () => ({
        data: null,
        error: new Error("connection refused"),
      }),
    });
    await assertRejects(
      () => findOrCreateInvitedUser(client, "x@y.com", ""),
      Error,
      "connection refused",
    );
    // Must short-circuit; createUser must NOT have been invoked when lookup
    // fails (avoids creating duplicate users on transient DB errors).
    assertEquals(calls.length, 1);
    assertEquals(calls[0].type, "profile.lookup");
  });
});
