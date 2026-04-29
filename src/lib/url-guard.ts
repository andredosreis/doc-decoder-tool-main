/**
 * Guards para URLs em contextos de segurança (Tier 2 — sanitização/XSS).
 *
 * Previne:
 *   - javascript: e data: em iframe src (video_url), hrefs (pdf_url) e
 *     navigate() (action_url) — open-redirect + XSS via scheme injection
 *   - URLs de vídeo não-YouTube (política: apenas embeds do YouTube)
 *
 * Usado por:
 *   - ModuleView (video_url, pdf_url)
 *   - NotificationDropdown (action_url via navigate())
 */

const BLOCKED_SCHEMES = /^(javascript|data|vbscript):/i;

const YOUTUBE_EMBED =
  /^https:\/\/(www\.)?youtube\.com\/embed\/[\w-]+([\?&].*)?$/;

export function hasBlockedScheme(url: string): boolean {
  return BLOCKED_SCHEMES.test(url.trim());
}

export function isSafeVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return YOUTUBE_EMBED.test(url.trim());
}

export function isSafeNavigationUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (hasBlockedScheme(trimmed)) return false;
  return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed);
}

export function isSafePdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (hasBlockedScheme(trimmed)) return false;
  // Supabase Storage signed URLs are absolute https
  return /^https?:\/\//i.test(trimmed);
}
