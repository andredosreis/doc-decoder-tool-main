import { describe, expect, it } from "vitest"
import {
  buildNotificationChannelName,
  extractUserIdFromChannel,
  isUserScopedChannel,
} from "./notification-channel"

describe("notification-channel — Tier 2 (race conditions, useNotifications)", () => {
  it("(1) buildNotificationChannelName produces user-scoped name", () => {
    const name = buildNotificationChannelName("user-uuid-123")
    expect(name).toBe("notifications:user-uuid-123")
  })

  it("(2) buildNotificationChannelName throws for empty userId", () => {
    expect(() => buildNotificationChannelName("")).toThrow()
  })

  it("(3) two different users produce different channel names (no sharing)", () => {
    const a = buildNotificationChannelName("user-A")
    const b = buildNotificationChannelName("user-B")
    expect(a).not.toBe(b)
  })

  it("(4) isUserScopedChannel validates ownership", () => {
    const name = buildNotificationChannelName("user-A")
    expect(isUserScopedChannel(name, "user-A")).toBe(true)
    expect(isUserScopedChannel(name, "user-B")).toBe(false)
  })

  it("(5) extractUserIdFromChannel round-trips correctly", () => {
    const userId = "user-uuid-456"
    const channelName = buildNotificationChannelName(userId)
    expect(extractUserIdFromChannel(channelName)).toBe(userId)
  })

  it("(6) extractUserIdFromChannel returns null for unscoped channel names", () => {
    // Documents the bug: useNotifications used a non-scoped name like
    // 'notifications' without userId — this channel can't be attributed to a user
    expect(extractUserIdFromChannel("notifications")).toBeNull()
    expect(extractUserIdFromChannel("other-channel")).toBeNull()
  })
})
