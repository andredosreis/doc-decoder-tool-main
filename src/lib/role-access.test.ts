import { describe, expect, it } from "vitest"
import { decideRoleAccess } from "./role-access"

describe("decideRoleAccess — Tier 1 regression (ProtectedRoute decision logic)", () => {
  it("(1) ALLOW when userRole matches requiredRole exactly", () => {
    expect(decideRoleAccess("admin", "admin")).toEqual({ type: "ALLOW" })
    expect(decideRoleAccess("user", "user")).toEqual({ type: "ALLOW" })
  })

  it("(2) REDIRECT_DASHBOARD: admin accessing student route → /admin/dashboard", () => {
    // Cross-role: admin tenta visitar /student/* — deve cair de volta no
    // dashboard apropriado ao seu role real, não ver tela em branco
    expect(decideRoleAccess("admin", "user")).toEqual({
      type: "REDIRECT_DASHBOARD",
      target: "/admin/dashboard",
    })
  })

  it("(3) REDIRECT_DASHBOARD: student accessing admin route → /student", () => {
    // Cross-role inverso: aluno tenta visitar /admin/* — redireccionar
    // para sua área. Esta é a defesa contra deep-links em URL admin.
    expect(decideRoleAccess("user", "admin")).toEqual({
      type: "REDIRECT_DASHBOARD",
      target: "/student",
    })
  })

  it("(4) REDIRECT_LOGIN: user with NO role accessing admin route → /auth/admin-login", () => {
    // Caso comum: linha em user_roles ausente (trigger handle_new_user
    // falhou silenciosamente) ou RLS bloqueou a SELECT. Sem role
    // definida, o utilizador é tratado como não-autenticado para a rota.
    // CRÍTICO: NÃO pode dar fall-through para ALLOW (essa seria a regressão
    // mais perigosa — utilizador sem role acederia a /admin/* sem barreira).
    expect(decideRoleAccess(null, "admin")).toEqual({
      type: "REDIRECT_LOGIN",
      target: "/auth/admin-login",
    })
    expect(decideRoleAccess(undefined, "admin")).toEqual({
      type: "REDIRECT_LOGIN",
      target: "/auth/admin-login",
    })
  })

  it("(5) REDIRECT_LOGIN: user with NO role accessing student route → /auth/student-login", () => {
    // Mesmo caso, lado student. O destino do login deve corresponder à
    // persona da rota original (não ao default), para que após login o
    // utilizador retorne ao caminho que tentou.
    expect(decideRoleAccess(null, "user")).toEqual({
      type: "REDIRECT_LOGIN",
      target: "/auth/student-login",
    })
    expect(decideRoleAccess(undefined, "user")).toEqual({
      type: "REDIRECT_LOGIN",
      target: "/auth/student-login",
    })
  })
})
