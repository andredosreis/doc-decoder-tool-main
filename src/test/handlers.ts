import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"

/**
 * MSW handlers base para Supabase REST + Auth + Storage.
 *
 * Cada teste pode override via `server.use(...)` no `beforeEach` ou inline.
 * O setup global em `setup.ts` regista `server.listen` antes de todos os testes
 * e `server.resetHandlers` depois de cada um.
 *
 * Convenção: handlers default retornam respostas vazias e bem formadas para
 * que o cliente Supabase JS não falhe; testes que precisam de dados especificam
 * via `server.use(http.get(URL, () => HttpResponse.json(data)))`.
 */

const SUPABASE_URL =
  (typeof process !== "undefined" && process.env.VITE_SUPABASE_URL) ||
  "https://test.supabase.co"

export const handlers = [
  // PostgREST: SELECT default returns empty array
  http.get(`${SUPABASE_URL}/rest/v1/*`, () => HttpResponse.json([])),

  // PostgREST: INSERT/UPDATE/UPSERT default returns empty array (Prefer: return=representation)
  http.post(`${SUPABASE_URL}/rest/v1/*`, () => HttpResponse.json([])),
  http.patch(`${SUPABASE_URL}/rest/v1/*`, () => HttpResponse.json([])),
  http.delete(`${SUPABASE_URL}/rest/v1/*`, () => new HttpResponse(null, { status: 204 })),

  // Auth: signup/signin default returns null user/session (forces tests to override)
  http.post(`${SUPABASE_URL}/auth/v1/token*`, () =>
    HttpResponse.json({ user: null, session: null }),
  ),
  http.post(`${SUPABASE_URL}/auth/v1/signup*`, () =>
    HttpResponse.json({ user: null, session: null }),
  ),
  http.post(`${SUPABASE_URL}/auth/v1/recover*`, () =>
    HttpResponse.json({}),
  ),
  http.post(`${SUPABASE_URL}/auth/v1/logout*`, () =>
    HttpResponse.json({}),
  ),
  http.get(`${SUPABASE_URL}/auth/v1/user*`, () =>
    HttpResponse.json({ user: null }),
  ),

  // Storage: signed URL default
  http.post(`${SUPABASE_URL}/storage/v1/object/sign/*`, () =>
    HttpResponse.json({ signedURL: "/dummy/signed-url" }),
  ),

  // Edge Functions: invoke default returns 200 with empty body
  http.post(`${SUPABASE_URL}/functions/v1/*`, () => HttpResponse.json({})),
]

export const server = setupServer(...handlers)
