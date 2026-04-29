import { defineConfig } from "vitest/config"
import path from "path"

// Nota: o plugin `@vitejs/plugin-react-swc` é apenas necessário para o dev server
// (HMR + Fast Refresh). Vitest transpila TSX via esbuild built-in e funciona sem ele.
// Manter o plugin aqui causa erros de binding nativo (`swc.<arch>.node`) que não
// afectam o test runner.

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    // supabase/** contém testes Deno (jsr: imports, Deno.* APIs); rodam via
    // `npm run test:functions` (deno task), não via vitest.
    exclude: [
      "node_modules",
      "dist",
      "e2e/**",
      "supabase/**",
      ".idea",
      ".git",
      ".cache",
    ],
    globals: false,
    css: false,
  },
})
