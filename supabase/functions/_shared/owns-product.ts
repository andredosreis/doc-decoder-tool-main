import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Helper de validação de ownership de produto.
 *
 * Histórico (Bug 4 do TEST-GAP-ANALYSIS):
 * Em `admin-invite-student` o `product_id` vinha do request body sem validação;
 * a função usa service-role logo a RLS de `products` não bloqueia. Admin A
 * podia conceder acesso a produto de admin B passando o UUID dele.
 *
 * Esta função é o gate. Retorna o produto se `adminId` for o owner; caso
 * contrário retorna null. Caller decide se traduz null em 403 ou outra coisa.
 *
 * Nota: usa cliente que normalmente é service-role (logo bypassa RLS); por isso
 * o filtro `admin_id = adminId` é mandatório para fazer o trabalho de isolamento.
 */
export async function getOwnedProduct(
  client: SupabaseClient,
  adminId: string,
  productId: string,
): Promise<{ id: string } | null> {
  const { data, error } = await client
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("admin_id", adminId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
