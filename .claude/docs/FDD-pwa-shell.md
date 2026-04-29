# FDD-006 — PWA Shell

**Projecto:** APP XPRO  
**Versão:** 1.0  
**Estado:** Aprovado  
**Data:** 2026-04-28  
**Autor:** André dos Reis  

---

## 1. Contexto

A v1.0 actual já tem uma implementação parcial de PWA. `vite-plugin-pwa@1.2.0` está instalado, `vite.config.ts` configura o plugin com `registerType: "autoUpdate"`, manifest completo (8 tamanhos de ícone, theme color, display standalone) e os ícones PNG estão em `/public/`. `index.html` inclui meta tags para iOS (`apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `theme-color`).

Apesar disto, o Risco 6 do HLD ("PWA prometido mas não implementado funcionalmente") permanece aberto porque cinco peças críticas estão em falta:

1. **Caching de chamadas Supabase** — a configuração actual de `runtimeCaching` cobre apenas Google Fonts; HLD §284 prescreve "network-first para chamadas Supabase".
2. **Estratégia de update** — `autoUpdate` troca o Service Worker silenciosamente; em sessões longas de vídeo, o aluno pode ter cache stale sem nunca saber. Não há mecanismo de prompt.
3. **Offline fallback** — sem página dedicada nem deteção em runtime de ausência de rede.
4. **Prompt de instalação** — evento `beforeinstallprompt` não é capturado; aluno tem de usar menu do browser para instalar.
5. **Validação Lighthouse** — score nunca foi medido; HLD pede `>= 90` como critério de go-live.

Este FDD define a evolução da configuração PWA actual para uma instalação completa que feche o Risco 6, validada por Lighthouse antes do primeiro utilizador real.

**Estado actual vs estado alvo:**

| Aspecto | Estado actual | Estado alvo (este FDD) |
|---|---|---|
| Plugin Vite | `vite-plugin-pwa@1.2.0` configurado | Mantém-se |
| Manifest | Completo (nome, ícones, theme, display) | Mantém-se sem alterações |
| Ícones | 8 tamanhos em `/public/` | Mantém-se |
| Meta tags iOS | Presentes em `index.html` | Mantém-se |
| `registerType` | `"autoUpdate"` (silencioso) | `"prompt"` com toast "Nova versão disponível" |
| `runtimeCaching` Supabase | Ausente | Tabela em §3.2 |
| Offline fallback | Ausente | `/public/offline.html` precached + hook React `useOnline` |
| Install prompt | Ausente | Hook `useInstallPrompt` + banner no dashboard após 3 visitas |
| iOS splash screens dedicadas | Ausente | Aceita splash automático iOS (v1.x considera dedicadas) |
| Lighthouse PWA score | Nunca validado | `>= 90` como critério de aceitação no PR final |
| Sentry no SW | Não aplicável | SW errors propagam para Sentry frontend (ADR-009) |

---

## 2. Objectivos

- Trocar `registerType` para `"prompt"` e expor toast com botão "Recarregar" sempre que um novo Service Worker estiver disponível.
- Adicionar `runtimeCaching` específico para o domínio Supabase com estratégias por tipo de endpoint (REST GET, mutations, Auth, Storage, Edge Functions).
- Criar página estática `/public/offline.html` precached, e hook React `useOnline` para banner in-app quando a rede cai.
- Capturar o evento `beforeinstallprompt` num hook `useInstallPrompt`; mostrar banner discreto no dashboard após 3 visitas (com cooldown em caso de dispensa).
- Validar Lighthouse PWA score `>= 90` em Android e iOS antes de fechar o PR final.
- Garantir que erros do Service Worker são reportados ao Sentry (alinha com ADR-009 que activa Sentry no frontend desde v1.0).

Fora do âmbito deste FDD:
- Cache offline de PDFs do Storage privado (HLD §285: ficheiros grandes precisariam de gestão explícita de quota). Vídeos não entram nesta lista por serem YouTube embeds servidos pela própria YouTube; o Service Worker nunca os intercepta.
- Splash screens iOS dedicadas (`apple-touch-startup-image`) para os 12+ tamanhos de iPhone e iPad — alvo v1.x.
- Background Sync para mutations offline (alvo v2.0 quando justificado por casos reais).
- Push Notifications via Web Push API (alvo v2.0).
- Periodic Background Sync (alvo v2.0).

---

## 3. Decisões Arquitecturais

### 3.1 Estratégia de update: prompt explícito

`registerType: "prompt"` em `vite.config.ts`. O hook `useRegisterSW` de `virtual:pwa-register/react` expõe `needRefresh`, `offlineReady` e `updateServiceWorker`. Um componente `PwaUpdater` montado uma vez no root da app dispara um toast persistente quando `needRefresh` fica `true`:

> "Nova versão disponível. Recarrega para usar a versão mais recente." `[Recarregar]`

**Justificação:** A plataforma tem sessões longas (vídeos de 30+ minutos). `autoUpdate` silencioso pode trocar o SW a meio de aula, levando a cache stale ou comportamento inconsistente entre tabs abertas. Toast persistente deixa o aluno escolher o momento.

### 3.2 Runtime caching de Supabase

Cinco regras adicionais em `workbox.runtimeCaching`, complementando as duas existentes para Google Fonts:

| Recurso | URL pattern | Estratégia | maxAge / maxEntries | Justificação |
|---|---|---|---|---|
| PostgREST GET | `*.supabase.co/rest/v1/*` (method GET) | NetworkFirst | 5 min / 50 entries | HLD §284 "network-first"; cache curto cobre offline breve |
| PostgREST mutations | `*.supabase.co/rest/v1/*` (POST/PATCH/DELETE) | NetworkOnly | n/a | Mutations nunca cacheadas |
| Supabase Auth | `*.supabase.co/auth/v1/*` | NetworkOnly | n/a | Auth nunca cacheado |
| Storage signed URLs | `*.supabase.co/storage/v1/object/sign/*` | NetworkOnly | n/a | Signed URL já tem TTL próprio (ADR-006) |
| Edge Functions | `*.supabase.co/functions/v1/*` | NetworkOnly | n/a | Geração e mutations |

**Justificação:** PDFs do Storage privado são deliberadamente excluídos (HLD §285) por implicarem gestão de quota não justificada em v1.0. Vídeos são YouTube embeds: o Service Worker não intercepta o domínio `youtube.com` nem `youtube-nocookie.com`, pelo que ficam fora do cache automaticamente. PWA serve para instalabilidade e shell rápida; o conteúdo continua a vir da rede.

### 3.3 Offline fallback em duas camadas

**Camada 1 — Página estática `/public/offline.html`:** página HTML mínima com branding (theme color, ícone, título "APP XPRO"), mensagem "Sem conexão. Algumas funcionalidades podem não estar disponíveis. Tenta novamente quando estiveres online.", e tentativa de reload automático ao detectar `online` event.

Adicionada a `includeAssets` para entrar no precache. `navigateFallback: 'index.html'` (default SPA) cobre o caso normal; `offline.html` é o fallback defensivo se `index.html` ele próprio não estiver cacheado (primeira visita offline).

**Camada 2 — Hook React `useOnline`:** detecta `navigator.onLine` e reage aos eventos `online`/`offline`. Componente `OfflineBanner` montado no layout principal mostra banner discreto no topo: "Sem conexão. A trabalhar com dados em cache." quando offline.

**Justificação:** Camada 1 cobre o pior caso (browser não consegue navegar); camada 2 cobre o caso comum (app carregada, perda de rede durante sessão). Custo total baixo, percepção de qualidade alta.

### 3.4 Banner de instalação client-driven

Hook `useInstallPrompt` que:
1. Captura `beforeinstallprompt` (Android, Chrome, Edge) e armazena o evento `deferredPrompt`.
2. Mantém contador de visitas em `localStorage` (`app_visit_count`); incrementa no mount do App.
3. Após 3 visitas E `deferredPrompt` capturado E não dispensado nos últimos 30 dias, sinaliza `shouldShow = true`.
4. Em iOS (sem `beforeinstallprompt`), sinaliza `shouldShow = true` após 3 visitas com `isIOS = true`; banner mostra instruções manuais ("Toca em Compartilhar e depois Adicionar à Tela Inicial").
5. Detecta instalação activa via `display-mode: standalone` ou `navigator.standalone === true`; suprime banner se já instalado.

Cooldown após dispensa armazenado em `localStorage` (`install_banner_dismissed_at`).

**Justificação:** Risk 6 cita "experiência app-like" como proposta de valor; install prompt activo aumenta adopção sem ser intrusivo (3 visitas implica engajamento). Cooldown evita transformar banner em padrão de fadiga.

### 3.5 iOS splash screens

Aceitar splash automático do iOS 13+ em v1.0. iOS gera splash a partir do ícone de homescreen + theme color sem necessidade de `apple-touch-startup-image` dedicadas.

**Justificação:** Gerar 12+ tamanhos dedicados (iPhone 13/14/15/Pro Max + iPad) tem custo desproporcional para v1.0 e não bloqueia Lighthouse PWA score. Caso feedback negativo concreto apareça, fica como melhoria v1.x.

### 3.6 Critério de aceitação Lighthouse

PR final do FDD-006 só fecha quando Lighthouse PWA score `>= 90` em:
- Chrome DevTools Lighthouse PWA audit (Android emulado)
- Safari Web Inspector + manual install em iPhone real (validação visual)

Score abaixo de 90 bloqueia merge. Auditoria documentada no PR description com print screen do Lighthouse.

**Justificação:** HLD Risk 6 mitigação 2 prescreve este critério. Sem validação objectiva, "PWA implementado" continua a ser aspiracional.

### 3.7 Sentry e Service Worker

Sentry no frontend (ADR-009) é configurado antes ou em paralelo ao PR de PWA. SW errors propagam via `onRegisterError` no `useRegisterSW`. Sentry capta erros de rede do SW automaticamente desde que o SDK esteja activo no main bundle (`main.tsx` antes do `<App />`).

**Justificação:** SW pode mascarar erros de rede ao retornar resposta de cache. Logging explícito em `onRegisterError` evita falhas silenciosas de registo.

---

## 4. Fluxo end-to-end

```
┌──────────────────────────────────────────────────────────────────┐
│ Aluno visita https://app.appxpro.com pela primeira vez           │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
   ┌────────────────────────────────────────────────────┐
   │ index.html carrega; main.tsx monta <App>           │
   │ <App> renderiza <PwaUpdater> no root               │
   │ useRegisterSW regista /sw.js                       │
   │ Workbox precache: index.html, JS, CSS, ícones,     │
   │   offline.html, manifest                           │
   └─────────────────────────┬──────────────────────────┘
                             │
                             ▼
   ┌────────────────────────────────────────────────────┐
   │ Aluno usa app normalmente:                         │
   │ - GET PostgREST: NetworkFirst (cache 5 min)        │
   │ - Mutation: NetworkOnly                            │
   │ - Storage signed URL: NetworkOnly                  │
   │ - Auth: NetworkOnly                                │
   │ - Edge Function: NetworkOnly                       │
   │ - Fonts Google: CacheFirst (já existente)          │
   └─────────────────────────┬──────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌──────────────────────┐     ┌────────────────────────┐
   │ Rede cai             │     │ Deploy de nova versão  │
   │ useOnline detecta    │     │ SW novo no servidor    │
   │ <OfflineBanner>      │     │ Workbox detecta no     │
   │   visível            │     │   próximo registo      │
   │                      │     │ needRefresh = true     │
   │ Navegação:           │     │ <PwaUpdater> mostra    │
   │ - rotas SPA OK       │     │   toast persistente    │
   │   (index.html cache) │     │   "Nova versão"        │
   │ - chamadas REST      │     │                        │
   │   falham com erro    │     │ Aluno clica Recarregar │
   │   tratado pelo hook  │     │ updateServiceWorker()  │
   │                      │     │   activa novo SW e     │
   │ Se index.html não    │     │   reload da página     │
   │ cached: offline.html │     │                        │
   └──────────────────────┘     └────────────────────────┘
                                         │
                                         ▼
   ┌────────────────────────────────────────────────────┐
   │ Aluno volta múltiplas vezes (>= 3 visitas):        │
   │ useInstallPrompt sinaliza shouldShow=true          │
   │ <InstallBanner> aparece no dashboard:              │
   │ - Android: botão "Instalar" → deferredPrompt       │
   │     → user.choice                                  │
   │ - iOS: instruções "Compartilhar → Adicionar à     │
   │     Tela Inicial"                                  │
   │ Aluno dispensa: cooldown 30 dias via localStorage  │
   └────────────────────────────────────────────────────┘
```

---

## 5. Implementação

### 5.1 `vite.config.ts` actualizado

```typescript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"
import { componentTagger } from "lovable-tagger"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "apple-touch-icon.png",
        "robots.txt",
        "offline.html",
      ],
      manifest: {
        name: "APP XPRO",
        short_name: "APP XPRO",
        description: "Plataforma de cursos online",
        theme_color: "#6366f1",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icon-72x72.png", sizes: "72x72", type: "image/png" },
          { src: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
          { src: "/icon-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
          { src: "/icon-152x152.png", sizes: "152x152", type: "image/png" },
          { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icon-384x384.png", sizes: "384x384", type: "image/png" },
          { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/sw\.js$/],
        runtimeCaching: [
          // Google Fonts (já existente)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase REST (GET) — NetworkFirst com cache curto
          {
            urlPattern: ({ url, request }) =>
              url.hostname.endsWith(".supabase.co") &&
              url.pathname.startsWith("/rest/v1/") &&
              request.method === "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-rest-get",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [200] },
            },
          },
          // Supabase REST (mutations) — NetworkOnly
          {
            urlPattern: ({ url, request }) =>
              url.hostname.endsWith(".supabase.co") &&
              url.pathname.startsWith("/rest/v1/") &&
              request.method !== "GET",
            handler: "NetworkOnly",
          },
          // Supabase Auth — NetworkOnly
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith(".supabase.co") &&
              url.pathname.startsWith("/auth/v1/"),
            handler: "NetworkOnly",
          },
          // Supabase Storage signed URLs — NetworkOnly
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith(".supabase.co") &&
              url.pathname.startsWith("/storage/v1/object/sign/"),
            handler: "NetworkOnly",
          },
          // Supabase Edge Functions — NetworkOnly
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith(".supabase.co") &&
              url.pathname.startsWith("/functions/v1/"),
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}))
```

> PDFs do Storage privado são entregues via signed URL com hostname diferente (CDN do Supabase Storage). Não estão no `runtimeCaching` deliberadamente; HLD §285 confirma exclusão. Vídeos (YouTube embeds em iframe) não passam pelo Service Worker — o iframe carrega num contexto isolado servido pela YouTube.

### 5.2 Tipos do plugin

Adicionar referências em `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />
```

### 5.3 `/public/offline.html`

```html
<!doctype html>
<html lang="pt-PT">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#6366f1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <title>APP XPRO — Sem conexão</title>
    <style>
      body {
        margin: 0;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        background: #ffffff;
        color: #1f2937;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        text-align: center;
      }
      .card { max-width: 380px; }
      img { width: 96px; height: 96px; }
      h1 { font-size: 1.5rem; margin: 1.5rem 0 0.5rem; color: #6366f1; }
      p { color: #4b5563; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="card">
      <img src="/icon-192x192.png" alt="APP XPRO" />
      <h1>Sem conexão</h1>
      <p>
        Algumas funcionalidades podem não estar disponíveis enquanto estiveres
        offline. Vamos voltar automaticamente quando a ligação for restaurada.
      </p>
    </div>
    <script>
      window.addEventListener("online", () => window.location.reload())
    </script>
  </body>
</html>
```

### 5.4 Hook `useRegisterSW` e componente `PwaUpdater`

```typescript
// src/components/PwaUpdater.tsx
import { useEffect } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      console.log("[SW] registered", swUrl)
    },
    onRegisterError(error) {
      console.warn("[SW] registration error", error)
    },
  })

  useEffect(() => {
    if (!needRefresh) return

    toast({
      title: "Nova versão disponível",
      description: "Recarrega para usar a versão mais recente.",
      duration: Infinity,
      action: (
        <Button
          size="sm"
          onClick={() => updateServiceWorker(true)}
        >
          Recarregar
        </Button>
      ),
      onOpenChange: (open) => {
        if (!open) setNeedRefresh(false)
      },
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
```

Montagem em `src/App.tsx` (uma vez no root):

```tsx
import { PwaUpdater } from "@/components/PwaUpdater"

function App() {
  return (
    <>
      <PwaUpdater />
      {/* resto do tree */}
    </>
  )
}
```

### 5.5 Hook `useOnline` e componente `OfflineBanner`

```typescript
// src/hooks/useOnline.ts
import { useEffect, useState } from "react"

export function useOnline(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return online
}
```

```tsx
// src/components/OfflineBanner.tsx
import { useOnline } from "@/hooks/useOnline"
import { WifiOff } from "lucide-react"

export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      Sem conexão. A trabalhar com dados em cache.
    </div>
  )
}
```

Montar em `AdminLayout` e equivalente do aluno (layout principal renderiza acima do Outlet).

### 5.6 Hook `useInstallPrompt` e componente `InstallBanner`

```typescript
// src/hooks/useInstallPrompt.ts
import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const VISIT_KEY = "app_visit_count"
const VISIT_THRESHOLD = 3
const DISMISSED_KEY = "install_banner_dismissed_at"
const DISMISSAL_COOLDOWN_DAYS = 30

function isInStandalone(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  // Safari iOS
  return (window.navigator as { standalone?: boolean }).standalone === true
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isInStandalone())
  const [eligibleByVisits, setEligibleByVisits] = useState(false)

  const isIOS = detectIOS()

  useEffect(() => {
    if (isInstalled) return

    const visits =
      parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1
    localStorage.setItem(VISIT_KEY, String(visits))

    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    const cooldownMs = DISMISSAL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    const inCooldown = dismissedAt
      ? Date.now() - parseInt(dismissedAt, 10) < cooldownMs
      : false

    setEligibleByVisits(visits >= VISIT_THRESHOLD && !inCooldown)

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [isInstalled])

  const promptInstall = async (): Promise<"accepted" | "dismissed" | "ios"> => {
    if (!deferredPrompt) return isIOS ? "ios" : "dismissed"
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setEligibleByVisits(false)
  }

  return {
    shouldShow:
      eligibleByVisits && !isInstalled && (deferredPrompt !== null || isIOS),
    isIOS,
    isInstalled,
    promptInstall,
    dismiss,
  }
}
```

```tsx
// src/components/InstallBanner.tsx
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, X } from "lucide-react"

export function InstallBanner() {
  const { shouldShow, isIOS, promptInstall, dismiss } = useInstallPrompt()
  if (!shouldShow) return null

  return (
    <Card className="p-4 mb-4 bg-indigo-50 border-indigo-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Download className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="font-medium text-indigo-900">
              Instala APP XPRO no teu dispositivo
            </p>
            <p className="text-sm text-indigo-800 mt-1">
              {isIOS
                ? "Toca em Compartilhar e depois Adicionar à Tela Inicial."
                : "Acesso rápido a partir do ecrã inicial, sem abrir o browser."}
            </p>
            {!isIOS && (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => promptInstall()}
              >
                Instalar
              </Button>
            )}
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dispensar">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
```

Montar em `student/Dashboard.tsx` no topo da lista de produtos.

### 5.7 Integração com Sentry (ADR-009)

Sentry SDK do frontend já capta erros de rede de fetch. SW errors específicos são logados pelo `onRegisterError` em `useRegisterSW`. Para garantir que SW exceptions chegam ao Sentry, importar e inicializar o SDK **antes** do `<App />` em `src/main.tsx`:

```typescript
// src/main.tsx (excerto relevante)
import * as Sentry from "@sentry/react"
import App from "./App"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})

createRoot(document.getElementById("root")!).render(<App />)
```

> Sentry é pré-condição do FDD-006 mas a configuração canónica vive no FDD/ADR de observabilidade. Este FDD apenas garante que SW errors são captados via `onRegisterError`.

---

## 6. Tratamento de erros

| Cenário | Comportamento |
|---|---|
| `useRegisterSW.onRegisterError` dispara | `console.warn` + reportado a Sentry; app continua a funcionar sem SW; sem cache offline neste sessão |
| Cache de PostgREST GET retorna stale após 5 min | NetworkFirst tenta a rede; cache é fallback se rede demorar > 4 s ou falhar |
| Mutation enquanto offline | NetworkOnly falha; `useMutation` propaga erro; toast destrutivo via QueryClient global (FDD-003 §7.1) |
| Storage signed URL expira durante sessão offline | NetworkOnly falha; UI mostra "Não foi possível carregar o conteúdo. Verifica a conexão." |
| `beforeinstallprompt` nunca dispara (browser não suporta) | `useInstallPrompt.shouldShow` apenas `true` em iOS; em outros browsers `deferredPrompt` permanece null e banner não aparece |
| Aluno dispensa banner de install | `localStorage.install_banner_dismissed_at` set para `Date.now()`; banner suprimido por 30 dias |
| Service Worker novo detectado mas user nunca clica "Recarregar" | Toast permanece visível (`duration: Infinity`); pode ser fechado manualmente; fica registado para próxima sessão via `needRefresh = true` na próxima navegação |
| Storage cheio (Quota Exceeded em IndexedDB do SW) | Workbox limpa entries mais antigas via `expiration.maxEntries`; logs warning |
| Aluno em iPad em modo split-screen com `display-mode: browser` | `isInStandalone()` retorna false; banner aparece normalmente; instalação funciona via "Adicionar à Tela Inicial" |

---

## 7. Restrições e Regras

1. PDFs do Storage privado nunca são cacheados pelo Service Worker (HLD §285). Vídeos YouTube embed estão fora do âmbito do Service Worker por correrem em iframe servido pela YouTube.
2. Mutations Supabase (POST/PATCH/DELETE) são sempre `NetworkOnly`.
3. Auth e Edge Functions são sempre `NetworkOnly`.
4. Signed URLs do Storage não são cacheadas (TTL nativo já cumpre função).
5. `registerType: "prompt"` é obrigatório; `autoUpdate` está banido em produção.
6. Toast de update tem `duration: Infinity`; só desaparece por acção do utilizador (clique em Recarregar ou fechar).
7. Banner de instalação respeita cooldown de 30 dias após dispensa; nunca aparece em modo standalone.
8. `Sentry.init` corre antes do `<App />` em `main.tsx`; SW errors propagam via `onRegisterError`.
9. Lighthouse PWA score `>= 90` é critério bloqueante de merge no PR final.

---

## 8. Riscos

| ID | Risco | Probabilidade | Impacto | Mitigação | Plano de contingência |
|---|---|---|---|---|---|
| W1 | PWA shell promete experiência app-like mas Lighthouse falha critério não óbvio (ex: contrast ratio, language attr) | Média na primeira validação | Alto (bloqueia go-live) | Auditoria Lighthouse antes do PR final; checklist visual no PR description | Resolver pontos individualmente; se um critério for fora do escopo do FDD, escalar para FDD-007 ou ADR de aceitação documentada |
| W2 | Cache de PostgREST GET 5 min mostra dados stale ao aluno em sessão activa | Baixa | Baixo | NetworkFirst tenta sempre a rede primeiro com timeout 4 s; cache é fallback. TanStack Query (`staleTime` por domínio per FDD-003 §6.2) já gere actualização independente | Reduzir `maxAgeSeconds` para 60 s se feedback de stale aparecer |
| W3 | Aluno em sessão de vídeo de 60 min recebe toast de update e dispensa; sessão seguinte ainda apresenta o toast antigo | Média | Baixo | `needRefresh` é re-avaliado a cada registo de SW; se versão nova continua disponível, toast volta. Aceitável (lembrança natural) | Se a frequência incomodar, adicionar cooldown de 1 h por dispensa via localStorage |
| W4 | Banner de install rejeitado mas reaparece após 30 dias para aluno que decidiu não instalar | Baixa | Baixo | Cooldown de 30 dias é razoável; alunos engajados que rejeitam podem ter mudado de ideia | Adicionar opção "Nunca mostrar" no banner que persiste indefinidamente |
| W5 | iOS sem `beforeinstallprompt` cria UX divergente (instruções manuais vs botão nativo) | Alta (limitação do iOS) | Baixo | Banner em iOS mostra instruções claras com ícone do botão Compartilhar; texto adaptado | Não aplicável (limitação plataforma) |
| W6 | Service Worker cacheado em produção fica inconsistente com nova versão do backend (breaking change na API Supabase) | Baixa | Médio | Cache de PostgREST é curto (5 min); chamadas Supabase têm versão URL `/v1/`; Edge Functions usam sufixo `-v2` em breaking changes (ADR-010) | Forçar `updateServiceWorker(true)` programático ou bump de `start_url` para invalidar cache |
| W7 | Aluno em modo "private browsing" no Safari não persiste localStorage; `useInstallPrompt` re-pergunta a cada visita | Média | Baixo | Ponto de irritação aceitável; private browsing implica utilizador advertido | Detectar storage indisponível e suprimir banner se localStorage não funcionar |
| W8 | Storage do Service Worker excede quota (50 entries × 5 KB = ~250 KB; mais shell ~ 2 MB) | Baixa | Baixo | Workbox limpa entries antigas via `maxEntries`; quota típica de 50 MB+ por origem | Reduzir `maxEntries` para 20 em mobile; logs Sentry em `quota_exceeded` |
| W9 | Sentry não inicializado captura erros do SW | Baixa | Médio (debugging cego) | `Sentry.init` antes do `<App />` em `main.tsx`; logs explícitos em `onRegisterError` | Fallback: logs em `console.warn` continuam disponíveis em DevTools |

---

## 9. Plano de Migração

### 9.1 Pré-condições

- ✅ `vite-plugin-pwa@1.2.0` instalado
- ✅ Manifest e ícones presentes em `/public/`
- ⏳ Sentry SDK frontend configurado (ADR-009; pode ser PR paralelo)

### 9.2 Sequência de PRs

**PR 1 — Configuração base** *(sem novo código de UI)*
- `vite.config.ts`: trocar `registerType` para `"prompt"`; adicionar `runtimeCaching` para Supabase; adicionar `offline.html` em `includeAssets`; adicionar `navigateFallback`
- `/public/offline.html`: página estática branded
- `src/vite-env.d.ts`: referências de tipos
- Validação: build limpa; SW gerado em `/dist/sw.js`; Lighthouse manifest score 100

**PR 2 — Update prompt**
- `src/components/PwaUpdater.tsx`
- Montagem em `src/App.tsx`
- Validação: deploy em staging com versão A; deploy de versão B; toast aparece em sessão activa; clique em Recarregar activa SW novo

**PR 3 — Banner de offline**
- `src/hooks/useOnline.ts`
- `src/components/OfflineBanner.tsx`
- Montagem em `AdminLayout` e layout do aluno
- Validação: simular offline em DevTools Network; banner visível em < 1 s

**PR 4 — Banner de instalação**
- `src/hooks/useInstallPrompt.ts`
- `src/components/InstallBanner.tsx`
- Montagem em `student/Dashboard.tsx`
- Validação: incrementar `app_visit_count` para 3 manualmente em localStorage; banner aparece; clique Instalar abre prompt nativo

**PR 5 — Validação Lighthouse e fecho do Risco 6**
- Auditoria Lighthouse PWA em Chrome DevTools (Android emulado)
- Validação manual em iPhone real (Safari): Add to Home Screen funciona; ícone com nome correcto; splash automático
- PR description inclui screenshot do Lighthouse score (>= 90 em PWA)
- Score abaixo de 90 bloqueia merge; corrigir cada item explicitamente

### 9.3 Validação

Cobertura manual antes do merge final:
- Chrome DevTools Lighthouse PWA audit em emulado mobile: score >= 90
- Manifest válido (Application tab no DevTools)
- Service Worker registado e activo (Application tab)
- Cache Storage contém: precache de shell, `google-fonts-cache`, `gstatic-fonts-cache`, `supabase-rest-get`
- Modo offline (DevTools → Network → Offline): app carrega; OfflineBanner aparece; rotas SPA navegáveis (cache de index.html); chamadas REST falham com erro tratado
- Deploy de duas versões consecutivas em staging: toast de update aparece; clique em Recarregar activa nova versão
- Banner de instalação em Android Chrome após simular 3 visitas: prompt nativo abre; aceitar instala; ícone aparece no launcher
- iPhone real Safari: meta tags correctas; "Adicionar à Tela Inicial" instala; abre em standalone; splash automático visível
- Aluno A não vê dados de aluno B em qualquer cache (cache key inclui `Authorization` por padrão Workbox; validar via DevTools)

### 9.4 Critério de aceitação

Lighthouse PWA score `>= 90` em Chrome DevTools (Android emulado) é critério bloqueante de merge do PR 5. Score abaixo de 90 obriga a:
1. Identificar items falhantes
2. Corrigir ou documentar excepção justificada
3. Re-auditar até score `>= 90`

---

## 10. Próximos Passos

1. Confirmar Sentry SDK configurado (ADR-009) antes de iniciar PR 1
2. Implementar PR 1 (configuração base + offline.html); validar SW gerado
3. Implementar PR 2 (update prompt); validar com 2 deploys consecutivos
4. Implementar PR 3 (offline banner); validar com DevTools offline
5. Implementar PR 4 (install banner); validar fluxo Android e iOS
6. Implementar PR 5 (validação Lighthouse); fechar Risco 6 do HLD
7. Após merge: documentar em CLAUDE.md o ciclo de update (autoUpdate banido; prompt obrigatório)
8. v1.x: avaliar splash screens iOS dedicadas se feedback negativo aparecer

---

*FDD gerado após confirmação das decisões D1 (`registerType: "prompt"` + toast), D2 (tabela de runtime caching Supabase), D3 (offline.html estática + useOnline), D4 (`useInstallPrompt` + banner após 3 visitas com cooldown 30 dias), D5 (splash iOS automático em v1.0) e D6 (Lighthouse PWA score >= 90 como critério de aceitação) com o user. Todas as decisões foram tomadas de forma colaborativa antes da redacção.*
