import { describe, expect, it } from "vitest"
import { queryKeys } from "./query-keys"

describe("queryKeys — Tier 2 (cache invalidation, TanStack Query)", () => {
  it("(1) products() without arg returns domain-only key (broad invalidation)", () => {
    expect(queryKeys.products()).toEqual(["products"])
  })

  it("(2) products(adminId) returns scoped key (narrow invalidation)", () => {
    const key = queryKeys.products("admin-uuid")
    expect(key).toEqual(["products", "admin-uuid"])
  })

  it("(3) different admins produce different keys — no cross-tenant cache sharing", () => {
    const a = queryKeys.products("admin-A")
    const b = queryKeys.products("admin-B")
    expect(a).not.toEqual(b)
  })

  it("(4) modules key is scoped by productId for consistent invalidation after edit", () => {
    expect(queryKeys.modules("product-123")).toEqual(["modules", "product-123"])
    expect(queryKeys.modules()).toEqual(["modules"])
  })

  it("(5) progress key supports both user-only and user+product scoping", () => {
    expect(queryKeys.progress("u1")).toEqual(["progress", "u1"])
    expect(queryKeys.progress("u1", "p1")).toEqual(["progress", "u1", "p1"])
    expect(queryKeys.progress()).toEqual(["progress"])
  })

  it("(6) all domain keys are distinct — no accidental cross-domain invalidation", () => {
    const domains = [
      queryKeys.products()[0],
      queryKeys.modules()[0],
      queryKeys.purchases()[0],
      queryKeys.students()[0],
      queryKeys.notifications()[0],
      queryKeys.settings()[0],
      queryKeys.progress()[0],
    ]
    const unique = new Set(domains)
    expect(unique.size).toBe(domains.length)
  })
})
