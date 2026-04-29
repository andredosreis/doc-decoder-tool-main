/**
 * Regras de validação do formulário de alteração de senha (Settings.tsx).
 *
 * Extraído do handler handlePasswordChange para ser testável sem React.
 * A lógica inline no componente deverá delegar aqui após refactor.
 *
 * Bug documentado: não verifica current === new (permite trocar para a mesma
 * senha sem aviso). Este comportamento está documentado no teste (5).
 */

export type PasswordValidationError =
  | "PASSWORDS_DO_NOT_MATCH"
  | "PASSWORD_TOO_SHORT";

export interface PasswordFormInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export function validatePasswordForm(
  form: PasswordFormInput,
): PasswordValidationError | null {
  if (form.new_password !== form.confirm_password) {
    return "PASSWORDS_DO_NOT_MATCH";
  }
  if (form.new_password.length < 6) {
    return "PASSWORD_TOO_SHORT";
  }
  return null;
}
