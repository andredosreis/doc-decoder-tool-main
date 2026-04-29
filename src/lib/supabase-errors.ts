/**
 * Helper para identificar erros do Supabase JS Client por código.
 *
 * Códigos relevantes em v1.0:
 * - '23505' → unique constraint violation (nome duplicado, etc.)
 * - '23503' → foreign key violation
 * - 'PGRST116' → zero rows quando se usa `.single()` em vez de `.maybeSingle()`
 * - '42501' → RLS policy violation (acesso não autorizado)
 *
 * Especificado em FDD-003 §7.2.
 */
export function isSupabaseError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === code
  )
}
