// shared.mjs: helpers common to every artifact renderer.
//
// Keeps the three solvers (page, slides, flyer) free of duplicated plumbing:
// the HTML document scaffold, title/eyebrow derivation, and grouping the flat
// block list into sections split on `break` nodes.

import { escapeHtml, safeImgUrl } from "./inline.mjs";
import { baseStyle, THEMES, DEFAULT_THEME } from "./tokens.mjs";
import { deriveAccent, deriveAccent2 } from "./color.mjs";

// Languages that default to a right-to-left script when no explicit dir is set.
const RTL_LANGS = new Set(["he", "ar", "fa", "ur", "yi"]);

// Resolve the named theme from the frontmatter. `meta.theme` if it names a known
// theme, else the default. Unknown names fall back, never throw, so a typo still
// renders something designed.
export function deriveTheme(ir) {
  const meta = (ir && ir.meta) || {};
  const name = typeof meta.theme === "string" ? meta.theme.trim() : "";
  return THEMES.includes(name) ? name : DEFAULT_THEME;
}

// A bare 6-digit hex like #7DB74B. The frontmatter scanner does NOT strip quotes
// and coerces all-digit values to Number, so the leading `#` is mandatory: a
// quoted "#7db74b", a non-`#` value, or a numeric coercion all fail this guard
// and fall through to the named theme.
const HEX6 = /^#[0-9a-fA-F]{6}$/;

// Resolve a custom primary accent from `brand-accent`: validate the hex, then ask
// the engine to derive a full AA-gated accent set. Returns the {light,dark} set
// or null (bad hex, or a color that cannot be made accessible) so the caller
// falls back to the named theme.
export function deriveBrandAccent(ir) {
  const raw = (ir && ir.meta && ir.meta["brand-accent"]) || "";
  if (typeof raw !== "string" || !HEX6.test(raw.trim())) return null;
  return deriveAccent(raw.trim());
}

// The optional secondary accent from `brand-accent-2`, same validation. Only
// applied when a primary brand accent is also present (it has no meaning on its
// own), and it falls back to the primary if the color cannot be made accessible.
export function deriveBrandAccent2(ir) {
  const raw = (ir && ir.meta && ir.meta["brand-accent-2"]) || "";
  if (typeof raw !== "string" || !HEX6.test(raw.trim())) return null;
  return deriveAccent2(raw.trim());
}

// Resolve the document language and writing direction from the frontmatter.
//   lang: meta.lang, else "en"
//   dir : meta.dir if explicitly set (it wins), else "rtl" for an RTL language
//          (matched on the primary subtag, so "ar-EG" still counts), else "ltr".
export function deriveLangDir(ir) {
  const meta = (ir && ir.meta) || {};
  const lang = meta.lang && typeof meta.lang === "string" ? meta.lang : "en";
  let dir;
  if (meta.dir && typeof meta.dir === "string" && meta.dir.trim()) {
    dir = meta.dir.trim();
  } else {
    const primary = lang.toLowerCase().split("-")[0];
    dir = RTL_LANGS.has(primary) ? "rtl" : "ltr";
  }
  return { lang, dir };
}

// Wrap body markup in a complete, standalone HTML document with the shared
// stylesheet plus any artifact-specific CSS and an optional inline script.
export function htmlDocument({
  title,
  style = "",
  body = "",
  script = "",
  lang = "en",
  dir = "ltr",
  theme = "studio",
  accent = null,
  accent2 = null,
}) {
  const head =
    `<!doctype html>\n` +
    `<html lang="${escapeHtml(lang)}" dir="${escapeHtml(dir)}">\n` +
    `<head>\n` +
    `<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">\n` +
    `<meta name="generator" content="MDP">\n` +
    `<title>${escapeHtml(title)}</title>\n` +
    `<style>\n${baseStyle(theme, accent, accent2 && accent ? accent2 : null)}\n${style}\n</style>\n` +
    `</head>\n`;
  const scriptTag = script ? `<script>\n${script}\n</script>\n` : "";
  return `${head}<body>\n${body}\n${scriptTag}</body>\n</html>\n`;
}

// Derive the document title: explicit frontmatter title, else the first title
// block, else a generic fallback.
export function deriveTitle(ir) {
  if (ir.meta && typeof ir.meta.title === "string" && ir.meta.title) {
    return ir.meta.title;
  }
  const titleBlock = ir.blocks.find((b) => b.type === "title");
  if (titleBlock) return titleBlock.text;
  return "Untitled";
}

// The small eyebrow label shown above the masthead. Driven by the optional
// `kicker` frontmatter field, falling back to a stable, content-free default.
export function deriveEyebrow(ir) {
  const meta = (ir && ir.meta) || {};
  if (typeof meta.kicker === "string" && meta.kicker.trim()) {
    return meta.kicker;
  }
  return "Brief";
}

// Resolve the brand logo from the frontmatter `brand-logo:` field. Returns
// { src } with an already-escaped, scheme-validated src, or null when the field
// is absent, non-string, or fails validation (the masthead then renders with no
// logo). The author supplies only the asset reference; the engine owns size and
// position (see the .mdp-logo rule). Pure: no I/O, the asset bytes never enter
// the compiler, so output stays byte-identical.
export function deriveLogo(ir) {
  const meta = (ir && ir.meta) || {};
  const value = meta["brand-logo"];
  if (typeof value !== "string" || !value.trim()) return null;
  const src = safeImgUrl(value);
  return src ? { src } : null;
}

// Render the masthead logo line, or "" when there is no logo. Prepended as the
// first child of each form's masthead. `title` is the plain, pre-inline title,
// escaped for alt text.
export function renderLogo(logo, title) {
  if (!logo) return "";
  const alt = escapeHtml(`${title || ""} logo`.trim());
  return `<img class="mdp-logo" src="${logo.src}" alt="${alt}">\n`;
}

// Group the flat blocks into sections split on `break` nodes. Returns an array
// of sections, each a { blocks: [...] } with the break nodes removed. Empty
// sections (e.g. consecutive breaks) are dropped.
export function splitSections(blocks) {
  const sections = [];
  let current = [];
  for (const block of blocks) {
    if (block.type === "break") {
      if (current.length) sections.push({ blocks: current });
      current = [];
    } else {
      current.push(block);
    }
  }
  if (current.length) sections.push({ blocks: current });
  return sections;
}

// Pull the leading masthead (title + lead) out of the first section so a
// renderer can compose it specially. Returns { title, lead, rest } where rest
// is the sections array with the masthead blocks removed from the first
// section (and that section dropped if it becomes empty).
export function extractMasthead(sections) {
  let title = null;
  let lead = null;
  const rest = sections.map((s) => ({ blocks: s.blocks.slice() }));
  if (rest.length) {
    const first = rest[0];
    const remaining = [];
    for (const block of first.blocks) {
      if (block.type === "title" && title === null) {
        title = block.text;
      } else if (block.type === "lead" && lead === null) {
        lead = block.text;
      } else {
        remaining.push(block);
      }
    }
    first.blocks = remaining;
  }
  const trimmed = rest.filter((s) => s.blocks.length > 0);
  return { title, lead, rest: trimmed };
}

// A section's heading text, if its first block is a heading. Used to detect the
// short adjacent sections that compose into columns on page/flyer.
export function sectionHeading(section) {
  const first = section.blocks[0];
  return first && first.type === "heading" ? first.text : null;
}
