// mdp-artifact-resume: an MDP artifact extension. A resume / CV output type.
//
// An artifact is a SOLVER over the whole IR { meta, blocks }: it owns the layout
// and returns a complete, standalone HTML document. Unlike a block, it consumes
// the public parse() output directly, so it is used as renderResume(parse(source)).
//
// This is a different thing from the `resume` fill-in TEMPLATE that ships with
// mdp-compiler: that template is a page-form .mdp SOURCE you edit; this is a new
// output FORM that lays any source out as a resume. Same IR, new solver.
//
// IR shape (from mdp-compiler's parse()):
//   { meta: { title, theme, lang, dir, ... }, blocks: [ { type, ... }, ... ] }
// Read: the title block is the name, the lead is the tagline, a stats block is a
// row of quick facts, headings open sections, lists and paragraphs fill them.
// Unknown blocks are dropped, the same graceful degradation the core renderers use.

import { inline, escapeHtml } from "./_inline.mjs";
import { baseStyle } from "./_tokens.mjs";

// Layout CSS for this artifact. Tokens only (var(--mdp-*)); logical properties so
// it flips under dir="rtl"; no literal colors.
export const RESUME_STYLE = `.mdp-resume {
  max-width: var(--mdp-measure, 42rem);
  margin: var(--mdp-space-8) auto;
  padding-inline: var(--mdp-space-6);
}
.mdp-resume-name {
  margin: 0;
  font-size: var(--mdp-text-title);
  font-weight: var(--mdp-weight-medium);
  line-height: var(--mdp-leading-tight);
  letter-spacing: -0.02em;
  color: var(--mdp-ink);
}
.mdp-resume-tagline {
  margin: var(--mdp-space-2) 0 var(--mdp-space-6);
  font-size: var(--mdp-text-lead);
  line-height: var(--mdp-leading-body);
  color: var(--mdp-ink-soft);
}
.mdp-resume-section {
  margin: var(--mdp-space-7) 0 var(--mdp-space-3);
  padding-bottom: var(--mdp-space-2);
  border-bottom: 1px solid var(--mdp-border);
  font-size: var(--mdp-text-h2);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
}
.mdp-resume p {
  margin: 0 0 var(--mdp-space-4);
  font-size: var(--mdp-text-body);
  line-height: var(--mdp-leading-body);
  color: var(--mdp-ink);
}
.mdp-resume ul,
.mdp-resume ol {
  margin: 0 0 var(--mdp-space-4);
  padding-inline-start: var(--mdp-space-5);
  color: var(--mdp-ink);
}
.mdp-resume li { margin-block: var(--mdp-space-1); }
.mdp-resume-facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mdp-space-2) var(--mdp-space-5);
  margin: 0 0 var(--mdp-space-5);
  padding: 0;
  list-style: none;
}
.mdp-resume-fact { font-size: var(--mdp-text-small); color: var(--mdp-ink-soft); }
.mdp-resume-fact b { font-weight: var(--mdp-weight-medium); color: var(--mdp-ink); }`;

// Resolve the document title: explicit meta.title, else the first title block,
// else a stable fallback. Mirrors mdp-compiler's deriveTitle.
function deriveTitle(ir) {
  const meta = (ir && ir.meta) || {};
  if (typeof meta.title === "string" && meta.title) return meta.title;
  const t = (ir.blocks || []).find((b) => b.type === "title");
  return t ? t.text : "Resume";
}

// Render one block into the resume flow. Unknown types degrade to "".
function renderBlock(block) {
  switch (block.type) {
    case "title":
      return `<h1 class="mdp-resume-name">${inline(block.text)}</h1>`;
    case "lead":
      return `<p class="mdp-resume-tagline">${inline(block.text)}</p>`;
    case "heading":
      return `<h2 class="mdp-resume-section">${inline(block.text)}</h2>`;
    case "paragraph":
      return `<p>${inline(block.text)}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = (block.items || []).map((it) => `<li>${inline(it)}</li>`).join("\n");
      return `<${tag}>\n${items}\n</${tag}>`;
    }
    case "stats": {
      const facts = (block.items || [])
        .map((s) => `<li class="mdp-resume-fact"><b>${inline(s.label)}</b> ${inline(s.value)}</li>`)
        .join("\n");
      return `<ul class="mdp-resume-facts">\n${facts}\n</ul>`;
    }
    case "quote":
      return `<blockquote>${inline(block.text)}</blockquote>`;
    default:
      return "";
  }
}

// Render the whole IR to a complete HTML document string. Pure + deterministic:
// no clocks, no randomness, stable iteration order.
export function renderResume(ir) {
  const meta = (ir && ir.meta) || {};
  const theme = typeof meta.theme === "string" ? meta.theme : "studio";
  const lang = typeof meta.lang === "string" ? meta.lang : "en";
  const dir = typeof meta.dir === "string" ? meta.dir : "ltr";
  const title = deriveTitle(ir);

  const body = ((ir && ir.blocks) || []).map(renderBlock).filter(Boolean).join("\n");

  return (
    `<!doctype html>\n` +
    `<html lang="${escapeHtml(lang)}" dir="${escapeHtml(dir)}">\n` +
    `<head>\n<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
    `<title>${escapeHtml(title)}</title>\n` +
    `<style>\n${baseStyle(theme)}\n${RESUME_STYLE}\n</style>\n</head>\n` +
    `<body>\n<main class="mdp-resume">\n${body}\n</main>\n</body>\n</html>\n`
  );
}
