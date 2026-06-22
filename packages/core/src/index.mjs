// index.mjs: the public entry point for mdp-compiler.
//
// Exports the parser and a single compile(source, artifact) that turns an MDP
// source string into a standalone HTML document for the chosen artifact. This
// is the surface the CLI, an MCP server, or the playground all call.

import { parse } from "./parse.mjs";
import { renderPage } from "./render-page.mjs";
import { renderSlides } from "./render-slides.mjs";
import { renderFlyer } from "./render-flyer.mjs";
import { renderReport } from "./render-report.mjs";
import { renderOnepager } from "./render-onepager.mjs";
import { renderMemo } from "./render-memo.mjs";
import { renderLetter } from "./render-letter.mjs";

export { parse } from "./parse.mjs";
export { inline, escapeHtml } from "./inline.mjs";
export { baseStyle, themeTokens, BASE, THEMES, DEFAULT_THEME, THEME_SWATCHES } from "./tokens.mjs";
// Color math + the WCAG AA oracle + brand-accent derivation. The oracle
// (contrast/TEXT_MIN/FILL_MIN) is the single source of truth shared by the
// render-time derivation and the build-time check-contrast gate.
export {
  deriveAccent,
  deriveAccent2,
  contrast,
  relativeLuminance,
  hexToOklch,
  oklchToHex,
  TEXT_MIN,
  FILL_MIN,
} from "./color.mjs";
// The versioned JSON Schema for the parsed IR (frontmatter + the closed block
// set). Generated into spec/schema.json; enforced by scripts/check-schema.mjs.
export { SCHEMA, SCHEMA_VERSION } from "./schema.mjs";

// The artifact renderers, keyed by name. Adding a new artifact is one entry
// here plus a render-<name>.mjs module (see AGENTS.md).
export const RENDERERS = {
  page: renderPage,
  slides: renderSlides,
  flyer: renderFlyer,
  report: renderReport,
  onepager: renderOnepager,
  memo: renderMemo,
  letter: renderLetter,
};

// The list of artifacts this engine can compile.
export const ARTIFACTS = Object.keys(RENDERERS);

// Compile an MDP source string into the HTML for one artifact.
//   source  : the raw .mdp text
//   artifact: one of ARTIFACTS ("page" | "slides" | "flyer" | "report" |
//             "onepager" | "memo" | "letter")
// Returns the complete HTML document as a string.
export function compile(source, artifact = "page") {
  const render = RENDERERS[artifact];
  if (!render) {
    throw new Error(
      `Unknown artifact "${artifact}". Known artifacts: ${ARTIFACTS.join(", ")}.`
    );
  }
  const ir = parse(source);
  return render(ir);
}
