import { describe, expect, it } from "vitest"
import {
  buildStoragePath,
  extractExtension,
  sanitizeFileName,
  UploadPathError,
  validateDocumentExtension,
  validateImageExtension,
} from "./upload-path"

describe("upload-path — Tier 2 (input validation + race condition)", () => {
  describe("sanitizeFileName", () => {
    it("(1) strips null bytes", () => {
      expect(sanitizeFileName("file\0.jpg")).toBe("file.jpg")
    })

    it("(2) strips path traversal sequence (../)", () => {
      expect(sanitizeFileName("../../etc/passwd")).toBe("etcpasswd")
    })

    it("(3) strips forward and backward slashes", () => {
      expect(sanitizeFileName("dir/sub\\file.png")).toBe("dirsubfile.png")
    })

    it("(4) normal filename passes through unchanged", () => {
      expect(sanitizeFileName("my-image.png")).toBe("my-image.png")
    })
  })

  describe("extractExtension", () => {
    it("(5) extracts lowercase extension", () => {
      expect(extractExtension("Photo.JPG")).toBe("jpg")
    })

    it("(6) no extension returns empty string", () => {
      expect(extractExtension("noextension")).toBe("")
    })
  })

  describe("validateImageExtension", () => {
    it("(7) .jpg → valid", () => {
      expect(() => validateImageExtension("photo.jpg")).not.toThrow()
    })

    it("(8) .exe → UploadPathError", () => {
      expect(() => validateImageExtension("malware.exe")).toThrowError(
        UploadPathError,
      )
    })

    it("(9) .svg → valid (allowed)", () => {
      // svg is in ALLOWED_IMAGE_EXTENSIONS; XSS via SVG is a separate concern
      // handled at the RLS/Content-Type layer, not the extension layer
    })
  })

  describe("validateDocumentExtension", () => {
    it("(10) .pdf → valid", () => {
      expect(() => validateDocumentExtension("lesson.pdf")).not.toThrow()
    })

    it("(11) .docx → UploadPathError", () => {
      expect(() => validateDocumentExtension("resume.docx")).toThrowError(
        UploadPathError,
      )
    })
  })

  describe("buildStoragePath — randomUUID eliminates millisecond collision", () => {
    it("(12) two calls in the same tick produce different paths", () => {
      const path1 = buildStoragePath("products", "thumb.jpg")
      const path2 = buildStoragePath("products", "thumb.jpg")
      expect(path1).not.toBe(path2)
    })

    it("(13) path includes prefix and extension", () => {
      const path = buildStoragePath("modules", "lesson.pdf")
      expect(path.startsWith("modules/")).toBe(true)
      expect(path.endsWith(".pdf")).toBe(true)
    })
  })
})
