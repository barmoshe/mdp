// index.mjs: the public entry point for @mdp/core.
//
// Exports the parser and a single compile(source, artifact) that turns an MDP
// source string into a standalone HTML document for the chosen artifact. This
// is the surface the CLI, an MCP server, or the playground all call.

import { parse } from "./parse.mjs";
import { renderPage } from "./render-page.mjs";
import { renderSlides } from "./render-slides.mjs";
import { renderFlyer } from "./render-flyer.mjs";

export { parse } from "./parse.mjs";
export { inline, escapeHtml } from "./inline.mjs";
export { baseStyle, themeTokens, BASE, THEMES, DEFAULT_THEME, THEME_SWATCHES } from "./tokens.mjs";
// The versioned JSON Schema for the parsed IR (frontmatter + the closed block
// set). Generated into spec/schema.json; enforced by scripts/check-schema.mjs.
export { SCHEMA, SCHEMA_VERSION } from "./schema.mjs";

// The artifact renderers, keyed by name. Adding a new artifact is one entry
// here plus a render-<name>.mjs module (see AGENTS.md).
export const RENDERERS = {
  page: renderPage,
  slides: renderSlides,
  flyer: renderFlyer,
};

// The list of artifacts this engine can compile.
export const ARTIFACTS = Object.keys(RENDERERS);

// Compile an MDP source string into the HTML for one artifact.
//   source  : the raw .mdp text
//   artifact: one of ARTIFACTS ("page" | "slides" | "flyer")
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
