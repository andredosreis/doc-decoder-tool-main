import { describe, it } from "jsr:@std/testing@^1.0.0/bdd";
import { assert, assertStringIncludes } from "jsr:@std/assert@^1.0.0";

const SCHEMA_PATH = new URL("../../../EXECUTAR_NO_SUPABASE.sql", import.meta.url);
const MIGRATIONS_DIR = new URL("../../migrations/", import.meta.url);

describe("RLS WITH CHECK — regression for Bug 5", () => {
  let sql = "";

  it("loads canonical schema", async () => {
    sql = await Deno.readTextFile(SCHEMA_PATH);
    assert(sql.length > 0, "EXECUTAR_NO_SUPABASE.sql must be non-empty");
  });

  it("policy 'Admins can manage own products' has explicit WITH CHECK", () => {
    const m = sql.match(
      /CREATE POLICY "Admins can manage own products"[\s\S]*?;/,
    );
    assert(m, "policy not found in canonical schema");
    assertStringIncludes(m[0], "WITH CHECK");
    assertStringIncludes(m[0], "auth.uid() = admin_id");
  });

  it("policy 'Admins can manage product modules' has explicit WITH CHECK", () => {
    const m = sql.match(
      /CREATE POLICY "Admins can manage product modules"[\s\S]*?;/,
    );
    assert(m, "policy not found in canonical schema");
    assertStringIncludes(m[0], "WITH CHECK");
  });

  it("policy 'Users can manage own progress' has explicit WITH CHECK", () => {
    const m = sql.match(
      /CREATE POLICY "Users can manage own progress"[\s\S]*?;/,
    );
    assert(m, "policy not found in canonical schema");
    assertStringIncludes(m[0], "WITH CHECK");
    assertStringIncludes(m[0], "auth.uid() = user_id");
  });

  it("upgrade migration exists for prod databases", async () => {
    let found = false;
    for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
      if (entry.name.includes("rls_explicit_with_check")) {
        found = true;
        break;
      }
    }
    assert(
      found,
      "Expected migration adding WITH CHECK to existing prod policies",
    );
  });
});
