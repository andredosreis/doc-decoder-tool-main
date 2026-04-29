import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Helper para promover um utilizador a admin via cliente service-role.
 *
 * Histórico (Bug 1 do TEST-GAP-ANALYSIS):
 * Anteriormente o erro da UPDATE era apenas logado e a função devolvia
 * sucesso, deixando customers que tinham pago com role 'user'. Esta versão:
 *  - Faz a UPDATE com cliente service-role (bypass RLS).
 *  - Trata o caso de 0 linhas afectadas (race com trigger handle_new_user)
 *    com retry após `retryDelayMs` (default 1000 ms; injectável para testes).
 *  - Throw em qualquer falha terminal — caller decide como apresentar.
 *
 * Long-term, ADR-004 substitui isto por `promote_to_admin SECURITY DEFINER`
 * (function SQL) e este helper passa a ser um wrapper de `rpc("promote_to_admin")`.
 */
export const ROLE_UPDATE_RETRY_DELAY_MS = 1000;

export interface SetAdminRoleOptions {
  retryDelayMs?: number;
}

export async function setAdminRole(
  supabaseAdmin: SupabaseClient,
  userId: string,
  options: SetAdminRoleOptions = {},
): Promise<void> {
  const retryDelayMs = options.retryDelayMs ?? ROLE_UPDATE_RETRY_DELAY_MS;

  const tryUpdate = async () => {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", userId)
      .select("user_id");
    if (error) throw error;
    return data?.length ?? 0;
  };

  let rowsUpdated = await tryUpdate();
  if (rowsUpdated === 0) {
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    rowsUpdated = await tryUpdate();
  }

  if (rowsUpdated === 0) {
    throw new Error(
      `Failed to set admin role for ${userId}: user_roles row not found after retry`,
    );
  }
}
