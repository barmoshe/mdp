// render-page.mjs: the `page` artifact: a calm scrolling reading document.
//
// Maps each block per the SPEC table:
//   title + {.lead}  -> masthead + standfirst (serif lead)
//   ## heading       -> section heading in flow
//   ---              -> hairline divider with generous spacing
//   list             -> inline list
//   mdp:stats        -> bordered table
//   blockquote+cite  -> left-bordered serif pull quote
//
// A single centred reading column, ~640px. Hierarchy from type and whitespace.

import { inline } from "./inline.mjs";
import {
  htmlDocument,
  deriveTitle,
  deriveEyebrow,
  deriveLangDir,
  deriveTheme,
  splitSections,
  extractMasthead,
  deriveLogo,
  renderLogo,
} from "./shared.mjs";
import { renderCompare, COMPARE_STYLE } from "./compare.mjs";
import { renderFlow, FLOW_STYLE } from "./flow.mjs";
import { renderCallout, CALLOUT_STYLE } from "./callout.mjs";

const PAGE_STYLE = `.mdp-page {
  max-width: 40rem;
  margin: 0 auto;
  padding: var(--mdp-space-9) var(--mdp-space-5);
}

.mdp-page-masthead { margin-bottom: var(--mdp-space-7); }
.mdp-page-masthead .mdp-eyebrow { margin-bottom: var(--mdp-space-4); }
.mdp-page-masthead .mdp-title {
  font-size: var(--mdp-text-title);
  margin-bottom: var(--mdp-space-5);
}
.mdp-page-masthead .mdp-lead { font-size: var(--mdp-text-lead); }

/* A section is a heading + its content, stacked with rhythm. */
.mdp-section { margin: 0; }
.mdp-section + .mdp-section { margin-top: var(--mdp-space-7); }
.mdp-section .mdp-h2 { margin-bottom: var(--mdp-space-4); }
.mdp-section > * + * { margin-top: var(--mdp-space-4); }

.mdp-page .mdp-figure-value { font-size: var(--mdp-text-h2); color: var(--mdp-accent-text); }

/* Hairline divider: thin rule, generous space on both sides. */
.mdp-page .mdp-hr { margin: var(--mdp-space-8) 0; }

.mdp-page .mdp-quote-text { font-size: var(--mdp-text-lead); }

${COMPARE_STYLE}

${FLOW_STYLE}

${CALLOUT_STYLE}`;

// Render one content block (everything except title/lead, handled in masthead).
function renderBlock(block) {
  switch (block.type) {
    case "heading":
      return `<h2 class="mdp-h2">${inline(block.text)}</h2>`;

    case "lead":
      return `<p class="mdp-lead">${inline(block.text)}</p>`;

    case "paragraph":
      return `<p class="mdp-p">${inline(block.text)}</p>`;

    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .map((it) => `<li>${inline(it)}</li>`)
        .join("\n");
      return `<${tag} class="mdp-list">\n${items}\n</${tag}>`;
    }

    case "stats": {
      const rows = block.items
        .map(
          (s) =>
            `<tr><th class="mdp-stat-label" scope="row">${inline(
              s.label
            )}</th><td class="mdp-stat-value">${inline(s.value)}</td></tr>`
        )
        .join("\n");
      return `<table class="mdp-stats-table">\n<tbody>\n${rows}\n</tbody>\n</table>`;
    }

    case "quote": {
      const cite = block.cite
        ? `\n<figcaption class="mdp-quote-cite">${inline(block.cite)}</figcaption>`
        : "";
      return `<figure class="mdp-quote">\n<blockquote class="mdp-quote-text">${inline(
        block.text
      )}</blockquote>${cite}\n</figure>`;
    }

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

// Render a section: its blocks in flow.
function renderSection(section) {
  const inner = section.blocks
    .map(renderBlock)
    .filter(Boolean)
    .join("\n");
  return `<section class="mdp-section">\n${inner}\n</section>`;
}

export function renderPage(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);

  const mastheadTitle = title || docTitle;
  const masthead =
    `<header class="mdp-page-masthead">\n` +
    renderLogo(deriveLogo(ir), mastheadTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(mastheadTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  // Sections joined by a hairline divider (the page reading of `---`).
  const sectionHtml = rest
    .map(renderSection)
    .join(`\n<hr class="mdp-hr">\n`);

  const body = `<main class="mdp-page">\n${masthead}\n${sectionHtml}\n</main>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({ title: docTitle, style: PAGE_STYLE, body, lang, dir, theme: deriveTheme(ir) });
}
