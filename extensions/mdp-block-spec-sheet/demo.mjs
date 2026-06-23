// demo.mjs: render a sample of this block into a standalone HTML file you can open
// in a browser. Self-contained: it inlines a minimal slice of the MDP token system
// so the block's var(--mdp-*) references resolve without installing mdp-compiler,
// and it uses the package's own parseSpecSheet to turn a fenced body into the IR
// node (the host does the same step in a real document). Preview only.

import { mkdirSync, writeFileSync } from "node:fs";
import { renderSpecSheet, parseSpecSheet, SPEC_SHEET_STYLE } from "./src/index.mjs";

const FENCE = `title: Tidewater 12
Display: 6.1 inch OLED
Weight: 184 g
Battery: 3200 mAh
Water resistance: IP68`;

// A minimal token slice. The only literal colors in this package live here, in the
// preview harness, never in the block itself.
const MIN_TOKENS = `:root {
  --mdp-bg: #fdfcfb;
  --mdp-surface: #f4f3f0;
  --mdp-ink: #1c1b19;
  --mdp-ink-soft: #56544f;
  --mdp-border: rgba(28, 27, 25, 0.12);
  --mdp-space-2: 0.5rem;
  --mdp-space-4: 1rem;
  --mdp-text-small: 0.9rem;
  --mdp-weight-medium: 500;
  --mdp-leading-tight: 1.3;
}
body {
  margin: 3rem;
  max-width: 28rem;
  background: var(--mdp-bg);
  color: var(--mdp-ink);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}`;

const html =
  `<!doctype html>\n<html lang="en" dir="ltr">\n<head>\n<meta charset="utf-8">\n` +
  `<title>mdp-block-spec-sheet preview</title>\n` +
  `<style>\n${MIN_TOKENS}\n${SPEC_SHEET_STYLE}\n</style>\n</head>\n` +
  `<body>\n${renderSpecSheet(parseSpecSheet(FENCE))}\n</body>\n</html>\n`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/preview.html", html);
console.log("Wrote dist/preview.html");
