/**
 * Query keys centralizadas para TanStack Query (Tier 2 — cache invalidation).
 *
 * Padrão hierárquico: o primeiro elemento é o domínio. Ao invalidar
 * ['products'] todos os filhos (['products', adminId]) também invalidam.
 *
 * Garantia de cache invalidation cross-domain: após criar uma compra o
 * caller deve invalidar ['purchases'] E ['students'] (a lista de alunos
 * agrega por compras aprovadas). Sem esta convenção centralizada, é fácil
 * esquecer uma das invalidações e ver dados stale no UI.
 */

export const queryKeys = {
  products: (adminId?: string) =>
    adminId ? (["products", adminId] as const) : (["products"] as const),

  modules: (productId?: string) =>
    productId
      ? (["modules", productId] as const)
      : (["modules"] as const),

  purchases: (userId?: string) =>
    userId
      ? (["purchases", userId] as const)
      : (["purchases"] as const),

  students: (adminId?: string) =>
    adminId
      ? (["students", adminId] as const)
      : (["students"] as const),

  notifications: (userId?: string) =>
    userId
      ? (["notifications", userId] as const)
      : (["notifications"] as const),

  settings: (userId?: string) =>
    userId
      ? (["settings", userId] as const)
      : (["settings"] as const),

  progress: (userId?: string, productId?: string) =>
    userId && productId
      ? (["progress", userId, productId] as const)
      : userId
      ? (["progress", userId] as const)
      : (["progress"] as const),
} as const
