/**
 * Validação e normalização de email para `admin-invite-student`.
 *
 * Garante que o email:
 *   - não é vazio ou whitespace-only
 *   - contém @
 *   - é normalizado para lowercase (consistente com o lookup em `profiles`
 *     que usa `.eq('email', email.toLowerCase())`)
 *
 * Comportamento crítico (Tier 2 tests):
 *   - email vazio ou whitespace-only → InviteEmailValidationError
 *   - email sem '@' → InviteEmailValidationError
 *   - email mixed-case → lowercased na saída
 *   - email já lowercase → inalterado
 */

export class InviteEmailValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteEmailValidationError";
  }
}

export function validateAndNormalizeInviteEmail(email: unknown): string {
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new InviteEmailValidationError("Email é obrigatório");
  }

  const trimmed = email.trim();

  if (!trimmed.includes("@")) {
    throw new InviteEmailValidationError("Email inválido: deve conter @");
  }

  return trimmed.toLowerCase();
}
