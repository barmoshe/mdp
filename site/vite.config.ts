import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// The hub runs the real MDP engine in the browser. The whole point of the
// playground is that it is not a reimplementation: it imports `@mdp/core`
// straight from `../packages/core/src`, the same code the CLI and the plugins
// run, and bundles it client-side. The engine is pure ESM with zero
// dependencies, so it bundles cleanly and stays the single source of truth.
const enginePath = fileURLToPath(
  new URL("../packages/core/src/index.mjs", import.meta.url)
);

export default defineConfig({
  // Project Pages site lives at https://barmoshe.github.io/mdp/, so every asset
  // is served under /mdp/. Vite rewrites asset URLs to match.
  base: "/mdp/",
  plugins: [react()],
  resolve: {
    alias: {
      "@mdp/core": enginePath,
    },
  },
  server: {
    // The engine source lives above the site root; allow Vite's dev server to
    // read it through the alias.
    fs: { allow: [".."] },
  },
  build: {
    target: "es2022",
    outDir: "dist",
  },
});
