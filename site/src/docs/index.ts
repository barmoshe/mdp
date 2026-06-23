// The documentation registry. Each page is an MDP-adjacent Markdown file,
// imported raw and rendered with marked. Kept as plain Markdown so the docs read
// the same on GitHub and on the site.
import gettingStarted from "./getting-started.md?raw";
import format from "./format.md?raw";
import blocks from "./blocks.md?raw";
import forms from "./forms.md?raw";
import themes from "./themes.md?raw";
import cli from "./cli.md?raw";
import plugins from "./plugins.md?raw";
import architecture from "./architecture.md?raw";
import mcp from "./mcp.md?raw";
import examplesDoc from "./examples.md?raw";
import extensions from "./extensions.md?raw";

export type DocPage = {
  id: string;
  title: string;
  group: string;
  blurb: string;
  content: string;
};

export const DOC_GROUPS = ["Guide", "Tools", "Internals"];

export const DOCS: DocPage[] = [
  { id: "getting-started", title: "Getting started", group: "Guide", blurb: "Install, compile, and open your first source.", content: gettingStarted },
  { id: "format", title: "The format", group: "Guide", blurb: "Frontmatter, body, and line roles.", content: format },
  { id: "blocks", title: "Blocks", group: "Guide", blurb: "Stats, compare, flow, callout, quotes, RTL.", content: blocks },
  { id: "forms", title: "Forms", group: "Guide", blurb: "Page, slides, flyer, the document forms (report, one-pager, memo, letter), the interactive forms (scroll, accordion, tabs, stepper), and the mapping table.", content: forms },
  { id: "themes", title: "Themes & design", group: "Guide", blurb: "The theme set and the design lock.", content: themes },
  { id: "examples", title: "Examples & templates", group: "Guide", blurb: "Example probes and fill-in templates.", content: examplesDoc },
  { id: "extensions", title: "Build an extension", group: "Guide", blurb: "Blocks and artifacts: the full wiring, plus live examples.", content: extensions },
  { id: "cli", title: "CLI reference", group: "Tools", blurb: "build.mjs flags and determinism.", content: cli },
  { id: "plugins", title: "Plugins", group: "Tools", blurb: "Claude Code and Codex.", content: plugins },
  { id: "mcp", title: "MCP server", group: "Tools", blurb: "Compile MDP from any MCP host.", content: mcp },
  { id: "architecture", title: "Architecture", group: "Internals", blurb: "The pipeline, the IR, and extending it.", content: architecture },
];

export function findDoc(id: string): DocPage {
  return DOCS.find((d) => d.id === id) ?? DOCS[0];
}
