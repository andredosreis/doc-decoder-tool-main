/**
 * Pure decision logic para o componente `ProtectedRoute` (em `useAuth.tsx`).
 *
 * Dado o role actual do utilizador (consultado em `user_roles`) e o role
 * exigido pela rota, decide a acção:
 *   - ALLOW: renderizar children
 *   - REDIRECT_DASHBOARD: utilizador autenticado mas com role diferente da
 *     exigida → enviar para o dashboard apropriado ao role real
 *     (cross-role redirect; evita aluno ver `/admin/*` em branco)
 *   - REDIRECT_LOGIN: utilizador sem role (linha em `user_roles` ausente,
 *     RLS bloqueou a query, ou erro de rede) → enviar para o login
 *     apropriado ao role exigido pela rota
 *
 * Esta função é puramente síncrona e não chama nenhuma API; é o "cérebro"
 * do componente, separado da side-effect de `navigate()`.
 *
 * Testes Tier 1 cobrem todos os branches críticos.
 */

export type Role = "admin" | "user";
export type RoleOrUnknown = Role | null | undefined;

export type RoleAccessAction =
  | { type: "ALLOW" }
  | {
    type: "REDIRECT_DASHBOARD";
    target: "/admin/dashboard" | "/student";
  }
  | {
    type: "REDIRECT_LOGIN";
    target: "/auth/admin-login" | "/auth/student-login";
  };

export function decideRoleAccess(
  userRole: RoleOrUnknown,
  requiredRole: Role,
): RoleAccessAction {
  if (userRole === requiredRole) {
    return { type: "ALLOW" };
  }

  // Cross-role: utilizador autenticado mas a aceder rota errada
  if (userRole === "admin") {
    return { type: "REDIRECT_DASHBOARD", target: "/admin/dashboard" };
  }
  if (userRole === "user") {
    return { type: "REDIRECT_DASHBOARD", target: "/student" };
  }

  // Sem role: redirect para o login apropriado à rota original
  return {
    type: "REDIRECT_LOGIN",
    target: requiredRole === "user" ? "/auth/student-login" : "/auth/admin-login",
  };
}
