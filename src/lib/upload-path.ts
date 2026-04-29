/**
 * Sanitização de caminhos para upload de ficheiros em Storage (Tier 2).
 *
 * Previne:
 *   - Directory traversal (../ , null bytes, barras)
 *   - Extensões não permitidas
 *   - Colisão por timestamp em milissegundos (usa crypto.randomUUID)
 *     Race condition documentada: uploadFile em ProductForm/ModuleForm usa
 *     `Date.now()` como parte do path — dois uploads no mesmo ms colidem.
 *
 * Bug conhecido (não corrigido aqui): o ProductForm/ModuleForm usa
 * `file.name.split('.').pop()` sem sanitizar `../` no nome completo.
 */

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
]);

const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["pdf"]);

export class UploadPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadPathError";
  }
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/\0/g, "")
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "");
}

export function extractExtension(fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  const dot = sanitized.lastIndexOf(".");
  if (dot < 0) return "";
  return sanitized.slice(dot + 1).toLowerCase();
}

export function validateImageExtension(fileName: string): void {
  const ext = extractExtension(fileName);
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new UploadPathError(
      `Extensão não permitida: ".${ext}". Permitidas: ${[...ALLOWED_IMAGE_EXTENSIONS].join(", ")}`,
    );
  }
}

export function validateDocumentExtension(fileName: string): void {
  const ext = extractExtension(fileName);
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    throw new UploadPathError(
      `Apenas PDF é permitido (.${ext} não suportado)`,
    );
  }
}

export function buildStoragePath(prefix: string, fileName: string): string {
  const ext = extractExtension(fileName);
  // randomUUID eliminates Date.now() millisecond collision race
  const unique = crypto.randomUUID();
  return `${prefix}/${unique}.${ext}`;
}
