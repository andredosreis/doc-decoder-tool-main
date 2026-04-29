import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Helper para localizar ou criar o utilizador alvo de um convite de admin.
 *
 * Padrão actual em `admin-invite-student`: lookup por e-mail (lowercased)
 * em `profiles`; se existir, devolve o ID; senão, cria via Admin Auth API
 * com `email_confirm: true` (não depende do SMTP do Supabase). Retorna
 * `{ userId, isNew }` para que o caller decida se envia recovery link
 * (sempre envia em v1.0) e se precisa fazer ajustes de role.
 *
 * Os testes Tier 1 cobrem os branches críticos:
 *   - existing profile → no createUser call (idempotência)
 *   - new email → createUser com payload correcto
 *   - lookup / createUser errors propagam como throw
 *   - e-mail lowercased no lookup (case-insensitive)
 */

export interface FindOrCreateResult {
  userId: string;
  isNew: boolean;
}

export async function findOrCreateInvitedUser(
  client: SupabaseClient,
  email: string,
  fullName: string,
): Promise<FindOrCreateResult> {
  const { data: existingProfile, error: lookupError } = await client
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existingProfile) {
    return { userId: existingProfile.id, isNew: false };
  }

  const { data: createdUser, error: createError } = await client.auth.admin
    .createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? "" },
    });

  if (createError) {
    throw new Error(`Erro ao criar usuário: ${createError.message}`);
  }
  if (!createdUser?.user) {
    throw new Error("Failed to create user");
  }

  return { userId: createdUser.user.id, isNew: true };
}
