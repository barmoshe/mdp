// render-flyer.mjs: the `flyer` artifact: one composed surface (a poster).
//
// Not a scroll, not slides: a single centred card (~520px) the eye takes in at
// a glance. Composition, following the SPEC table:
//   title + {.lead}  -> flyer header (eyebrow + big title + lead)
//   ## sections      -> surface sections; two adjacent short text sections
//                       compose side by side as TWO COLUMNS
//   mdp:stats        -> a figure BAND on the surface background
//   blockquote+cite  -> a serif quote block
//   final section    -> a footer band
//
// The solver classifies each non-masthead section and arranges them: it pairs
// consecutive "short text" sections into a two-column row, drops the stats into
// a band, sets the quote as its own block, and puts the trailing section in a
// footer band.

import { inline } from "./inline.mjs";
import {
  htmlDocument,
  deriveTitle,
  deriveEyebrow,
  deriveLangDir,
  deriveTheme,
  deriveBrandAccent,
  deriveBrandAccent2,
  splitSections,
  extractMasthead,
  deriveLogo,
  renderLogo,
} from "./shared.mjs";
import { renderCompare, COMPARE_STYLE } from "./compare.mjs";
import { renderFlow, FLOW_STYLE } from "./flow.mjs";
import { renderCallout, CALLOUT_STYLE } from "./callout.mjs";

const FLYER_STYLE = `.mdp-flyer-stage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--mdp-space-7) var(--mdp-space-5);
}

.mdp-flyer {
  width: 100%;
  max-width: 32.5rem;
  border: 1px solid var(--mdp-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--mdp-bg);
}

.mdp-flyer-header { padding: var(--mdp-space-7) var(--mdp-space-6) var(--mdp-space-6); }
.mdp-flyer-header .mdp-eyebrow { margin-bottom: var(--mdp-space-4); }
.mdp-flyer-header .mdp-title {
  font-size: 2rem;
  margin-bottom: var(--mdp-space-4);
}
.mdp-flyer-header .mdp-lead { font-size: var(--mdp-text-lead); }
.mdp-flyer-header .mdp-logo { height: 2.25rem; max-width: 13rem; }

.mdp-flyer-body { padding: 0 var(--mdp-space-6); }
.mdp-flyer-body > * + * { margin-top: var(--mdp-space-6); }

/* Two-column composition for adjacent short sections. */
.mdp-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mdp-space-6);
}
@media (max-width: 28rem) {
  .mdp-cols { grid-template-columns: 1fr; gap: var(--mdp-space-5); }
}
.mdp-col .mdp-h2 { font-size: var(--mdp-text-body); margin-bottom: var(--mdp-space-3); }
.mdp-col .mdp-list { font-size: var(--mdp-text-small); padding-inline-start: 1.1em; }
.mdp-col .mdp-list li + li { margin-top: var(--mdp-space-1); }
.mdp-col .mdp-p { font-size: var(--mdp-text-small); }

/* A single full-width section in the body. */
.mdp-flyer-section .mdp-h2 { font-size: var(--mdp-text-body); margin-bottom: var(--mdp-space-3); }
.mdp-flyer-section .mdp-list { font-size: var(--mdp-text-small); }
.mdp-flyer-section .mdp-p { font-size: var(--mdp-text-small); }

/* Stats band: sits on the surface colour, figures in a row. */
.mdp-flyer-band {
  margin: var(--mdp-space-6) 0;
  padding: var(--mdp-space-5) var(--mdp-space-6);
  background: var(--mdp-surface);
  border-top: 1px solid var(--mdp-border);
  border-bottom: 1px solid var(--mdp-border);
}
.mdp-flyer-band .mdp-figures { gap: var(--mdp-space-5); justify-content: space-between; }
.mdp-flyer-band .mdp-figure-value { font-size: 1.5rem; color: var(--mdp-accent-text); }

/* Quote block. */
.mdp-flyer-quote { padding: 0 var(--mdp-space-6); }
.mdp-flyer-quote .mdp-quote-text { font-size: 1.25rem; }

/* Footer band: the trailing section, on the surface colour. */
.mdp-flyer-footer {
  margin-top: var(--mdp-space-6);
  padding: var(--mdp-space-6);
  background: var(--mdp-surface);
  border-top: 1px solid var(--mdp-border);
}
.mdp-flyer-footer .mdp-h2 { font-size: var(--mdp-text-body); margin-bottom: var(--mdp-space-3); }
.mdp-flyer-footer .mdp-p { font-size: var(--mdp-text-small); }
.mdp-flyer-footer .mdp-list { font-size: var(--mdp-text-small); }

${COMPARE_STYLE}

/* On the flyer surface the compare cards sit tighter to fit the card width. */
.mdp-flyer .mdp-compare { gap: var(--mdp-space-4); }
.mdp-flyer .mdp-compare-card { padding: var(--mdp-space-4); }
.mdp-flyer .mdp-compare-name { font-size: var(--mdp-text-body); }

${FLOW_STYLE}

/* On the flyer surface the flow chips sit tighter. */
.mdp-flyer .mdp-flow { gap: var(--mdp-space-2); }
.mdp-flyer .mdp-flow-step { font-size: var(--mdp-text-small); }

${CALLOUT_STYLE}

/* On the flyer surface the callout sits tighter and reads at small body size. */
.mdp-flyer .mdp-callout { padding: var(--mdp-space-4); }
.mdp-flyer .mdp-callout-p { font-size: var(--mdp-text-small); }`;

// Render one flyer block in flow. Handles every body block type, so a block that
// shares a section with another (e.g. a stats band beside a callout) or a
// mid-document {.lead} is never silently dropped.
function renderFlyerBlock(block) {
  switch (block.type) {
    case "heading":
      return `<h2 class="mdp-h2">${inline(block.text)}</h2>`;
    case "lead":
      return `<p class="mdp-lead">${inline(block.text)}</p>`;
    case "paragraph":
      return `<p class="mdp-p">${inline(block.text)}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((it) => `<li>${inline(it)}</li>`).join("\n");
      return `<${tag} class="mdp-list">\n${items}\n</${tag}>`;
    }
    case "stats":
      return renderStatsBand(block);
    case "quote":
      return renderQuoteBlock(block);
    case "compare":
      return renderCompare(block);
    case "flow":
      return renderFlow(block);
    case "callout":
      return renderCallout(block);
    default:
      return "";
  }
}

// Render a section's blocks in flow.
function renderSectionInner(section) {
  return section.blocks.map(renderFlyerBlock).filter(Boolean).join("\n");
}

// Render a stats section as a figure band.
function renderStatsBand(statsBlock) {
  const figs = statsBlock.items
    .map(
      (s) =>
        `<div class="mdp-figure"><span class="mdp-figure-value">${inline(
          s.value
        )}</span><span class="mdp-figure-label">${inline(
          s.label
        )}</span></div>`
    )
    .join("\n");
  return `<div class="mdp-flyer-band">\n<div class="mdp-figures">\n${figs}\n</div>\n</div>`;
}

// Render a quote section as a serif quote block.
function renderQuoteBlock(quoteBlock) {
  const cite = quoteBlock.cite
    ? `\n<figcaption class="mdp-quote-cite">${inline(quoteBlock.cite)}</figcaption>`
    : "";
  return (
    `<div class="mdp-flyer-quote">\n` +
    `<figure class="mdp-quote">\n` +
    `<blockquote class="mdp-quote-text">${inline(quoteBlock.text)}</blockquote>${cite}\n` +
    `</figure>\n</div>`
  );
}

// Classify a section for flyer composition.
//   'compare': contains a compare block; always its own full-width element and
//               excluded from the two-column text pairing (it lays its own
//               options out side by side already)
//   'callout': contains a callout box; its own full-width element (a box does
//               not belong squeezed into a half-width column)
//   'stats'  : its only meaningful block is a stats block
//   'quote'  : its only meaningful block is a quote block
//   'flow'   : contains a flow row; its own full-width element so the chips
//               have room to sit on one line before wrapping
//   'text'   : a heading + list/paragraph (a short composable section)
function classify(section) {
  const types = section.blocks.map((b) => b.type);
  if (types.includes("compare")) return "compare";
  if (types.includes("callout")) return "callout";
  if (types.includes("stats")) return "stats";
  if (types.includes("quote")) return "quote";
  if (types.includes("flow")) return "flow";
  return "text";
}

export function renderFlyer(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);

  // Header.
  const header =
    `<header class="mdp-flyer-header">\n` +
    renderLogo(deriveLogo(ir), title || docTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(title || docTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  // Walk the sections and compose. The trailing text section becomes the footer
  // band; consecutive text sections (other than the last) pair into columns.
  const kinds = rest.map(classify);
  let footerIndex = -1;
  for (let i = rest.length - 1; i >= 0; i--) {
    if (kinds[i] === "text") {
      footerIndex = i;
      break;
    }
  }

  const pieces = [];
  let i = 0;
  while (i < rest.length) {
    if (i === footerIndex) {
      i++;
      continue; // handled as the footer, below
    }
    const kind = kinds[i];

    if (kind === "compare") {
      // A compare section is its own full-width element; it is never paired
      // with an adjacent section (it already lays its options out side by side).
      pieces.push(
        `<div class="mdp-flyer-section">\n${renderSectionInner(rest[i])}\n</div>`
      );
      i++;
      continue;
    }
    if (kind === "callout" || kind === "flow") {
      // A callout box or a flow row is its own full-width element, never paired
      // into the two-column composition. Any heading in the section rides along.
      pieces.push(
        `<div class="mdp-flyer-section">\n${renderSectionInner(rest[i])}\n</div>`
      );
      i++;
      continue;
    }
    if (kind === "stats") {
      pieces.push(renderStatsBand(rest[i].blocks.find((b) => b.type === "stats")));
      i++;
      continue;
    }
    if (kind === "quote") {
      pieces.push(renderQuoteBlock(rest[i].blocks.find((b) => b.type === "quote")));
      i++;
      continue;
    }

    // Text section. Pair with the next text section (if it is not the footer)
    // into two columns; otherwise render full width.
    const nextIsPairableText =
      i + 1 < rest.length &&
      kinds[i + 1] === "text" &&
      i + 1 !== footerIndex;
    if (nextIsPairableText) {
      const a = renderSectionInner(rest[i]);
      const b = renderSectionInner(rest[i + 1]);
      pieces.push(
        `<div class="mdp-cols">\n` +
          `<div class="mdp-col">\n${a}\n</div>\n` +
          `<div class="mdp-col">\n${b}\n</div>\n` +
          `</div>`
      );
      i += 2;
    } else {
      pieces.push(
        `<div class="mdp-flyer-section">\n${renderSectionInner(rest[i])}\n</div>`
      );
      i++;
    }
  }

  // Footer band.
  let footer = "";
  if (footerIndex >= 0) {
    footer =
      `<footer class="mdp-flyer-footer">\n${renderSectionInner(
        rest[footerIndex]
      )}\n</footer>`;
  }

  const body =
    `<div class="mdp-flyer-stage">\n` +
    `<article class="mdp-flyer">\n` +
    `${header}\n` +
    `<div class="mdp-flyer-body">\n${pieces.join("\n")}\n</div>\n` +
    `${footer}\n` +
    `</article>\n` +
    `</div>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: FLYER_STYLE,
    body,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
  });
}
