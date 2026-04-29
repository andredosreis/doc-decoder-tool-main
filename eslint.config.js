import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      // `supabase/` é Deno (URL imports, `jsr:`, APIs `Deno.*`); tem linter
      // próprio via `deno lint`.
      "supabase/**",
      // `e2e/` corre no runner do Playwright.
      "e2e/**",
      // Vite PWA gera bundles workbox em dev — não código humano.
      "dev-dist/**",
      // Auto-generated; CLAUDE.md proíbe edição manual.
      "src/components/ui/**",
      "src/integrations/supabase/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // O projecto tolera `any` em vários sítios (ex: `catch (error: any)`,
      // `tsconfig.json` tem `"noImplicitAny": false`). Mantemos como warning
      // para que PRs vejam o aviso no diff sem bloquear CI em código legado.
      "@typescript-eslint/no-explicit-any": "warn",
      // Permite `try { ... } catch { /* intencional */ }` — pattern comum
      // para "best-effort" parsing onde o caller já tem fallback.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
