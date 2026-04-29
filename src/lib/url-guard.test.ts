import { describe, expect, it } from "vitest"
import {
  hasBlockedScheme,
  isSafeNavigationUrl,
  isSafePdfUrl,
  isSafeVideoUrl,
} from "./url-guard"

describe("url-guard — Tier 2 (sanitização/XSS, Tier 2)", () => {
  describe("hasBlockedScheme", () => {
    it("(1) javascript: → true (blocked)", () => {
      expect(hasBlockedScheme("javascript:alert(1)")).toBe(true)
    })

    it("(2) data: → true (blocked)", () => {
      expect(hasBlockedScheme("data:text/html,<script>alert(1)</script>")).toBe(
        true,
      )
    })

    it("(3) vbscript: → true (blocked)", () => {
      expect(hasBlockedScheme("vbscript:MsgBox(1)")).toBe(true)
    })

    it("(4) https: → false (allowed)", () => {
      expect(hasBlockedScheme("https://example.com")).toBe(false)
    })

    it("(5) JAVASCRIPT: upper-case → true (case-insensitive block)", () => {
      expect(hasBlockedScheme("JAVASCRIPT:alert(1)")).toBe(true)
    })
  })

  describe("isSafeVideoUrl", () => {
    it("(6) valid YouTube embed → true", () => {
      expect(
        isSafeVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"),
      ).toBe(true)
    })

    it("(7) javascript: video URL → false", () => {
      expect(isSafeVideoUrl("javascript:alert(1)")).toBe(false)
    })

    it("(8) arbitrary https URL (non-YouTube) → false", () => {
      expect(isSafeVideoUrl("https://attacker.com/video.mp4")).toBe(false)
    })

    it("(9) null → false", () => {
      expect(isSafeVideoUrl(null)).toBe(false)
    })
  })

  describe("isSafeNavigationUrl (action_url open-redirect guard)", () => {
    it("(10) relative path → true", () => {
      expect(isSafeNavigationUrl("/student/product/123")).toBe(true)
    })

    it("(11) javascript: → false", () => {
      expect(isSafeNavigationUrl("javascript:void(0)")).toBe(false)
    })

    it("(12) absolute https → true", () => {
      expect(isSafeNavigationUrl("https://appxpro.online/student")).toBe(true)
    })

    it("(13) data: URL → false", () => {
      expect(isSafeNavigationUrl("data:text/html,<b>evil</b>")).toBe(false)
    })
  })

  describe("isSafePdfUrl", () => {
    it("(14) https signed URL → true", () => {
      expect(
        isSafePdfUrl(
          "https://storage.supabase.co/object/sign/module-content/file.pdf?token=xxx",
        ),
      ).toBe(true)
    })

    it("(15) javascript: → false", () => {
      expect(isSafePdfUrl("javascript:void(0)")).toBe(false)
    })

    it("(16) null → false", () => {
      expect(isSafePdfUrl(null)).toBe(false)
    })
  })
})
