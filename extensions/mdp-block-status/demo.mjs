// demo.mjs: render a sample of this block into a standalone HTML file you can
// open in a browser. Self-contained: it inlines a minimal slice of the MDP token
// system (including the accent tone tokens) so the block's var(--mdp-*) references
// resolve without installing mdp-compiler. In a real document the host engine
// supplies the full design system; this is a preview only.

import { mkdirSync, writeFileSync } from "node:fs";
import { renderStatus, STATUS_STYLE } from "./src/index.mjs";

const sample = {
  type: "status",
  items: [
    { label: "Shipped", tone: "solid" },
    { label: "In review", tone: "accent" },
    { label: "Planned", tone: "default" },
  ],
};

// A minimal token slice. The only literal colors in this package live here, in
// the preview harness, never in the block itself.
const MIN_TOKENS = `:root {
  --mdp-bg: #fdfcfb;
  --mdp-surface: #f4f3f0;
  --mdp-ink: #1c1b19;
  --mdp-ink-soft: #56544f;
  --mdp-border: rgba(28, 27, 25, 0.12);
  --mdp-accent: #5b54d6;
  --mdp-accent-contrast: #ffffff;
  --mdp-accent-text: #4b44c0;
  --mdp-accent-surface: #ecebfb;
  --mdp-accent-border: #c9c5f3;
  --mdp-space-1: 0.25rem;
  --mdp-space-2: 0.5rem;
  --mdp-space-3: 0.75rem;
  --mdp-text-small: 0.9rem;
  --mdp-weight-medium: 500;
  --mdp-leading-tight: 1.2;
}
body {
  margin: 3rem;
  background: var(--mdp-bg);
  color: var(--mdp-ink);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}`;

const html =
  `<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n` +
  `<title>mdp-block-status preview</title>\n` +
  `<style>\n${MIN_TOKENS}\n${STATUS_STYLE}\n</style>\n</head>\n` +
  `<body>\n${renderStatus(sample)}\n</body>\n</html>\n`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/preview.html", html);
console.log("Wrote dist/preview.html");
