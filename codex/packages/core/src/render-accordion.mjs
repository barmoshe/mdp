// render-accordion.mjs: the `accordion` artifact: collapsible stacked sections.
//
// Each `---`-delimited section becomes one panel: its leading `##` heading is
// the toggle and the rest of the section is the collapsible body. Built on
// native <details>/<summary>, so it is fully accessible and keyboard-operable
// with no JS at all (the first panel open). A small enhancement layer adds
// Expand all / Collapse all. The reading form for dense reference and FAQs.

import { inline } from "./inline.mjs";
import {
  htmlDocument,
  deriveTitle,
  deriveEyebrow,
  deriveLangDir,
  deriveTheme,
  deriveBrandAccent,
  deriveBrandAccent2,
  deriveBrandFont,
  splitSections,
  extractMasthead,
  deriveLogo,
  renderLogo,
} from "./shared.mjs";
import {
  renderContentBlocks,
  CONTENT_BLOCK_STYLE,
  sectionParts,
} from "./content-blocks.mjs";

const ACCORDION_STYLE = `.mdp-accordion {
  max-width: 46rem;
  margin: 0 auto;
  padding: var(--mdp-space-9) var(--mdp-space-5);
}

.mdp-accordion-masthead { margin-bottom: var(--mdp-space-7); }
.mdp-accordion-masthead .mdp-eyebrow { margin-bottom: var(--mdp-space-4); }
.mdp-accordion-masthead .mdp-title {
  font-size: var(--mdp-text-title);
  margin-bottom: var(--mdp-space-5);
}
.mdp-accordion-masthead .mdp-lead { font-size: var(--mdp-text-lead); }

/* Expand/collapse controls: only meaningful with JS, so hidden until it runs. */
.mdp-acc-controls { display: none; gap: var(--mdp-space-3); margin-bottom: var(--mdp-space-5); }
.mdp-js .mdp-acc-controls { display: flex; }
.mdp-acc-btn {
  font-family: inherit;
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink);
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 6px;
  padding: var(--mdp-space-2) var(--mdp-space-4);
  cursor: pointer;
  line-height: 1;
}
.mdp-acc-btn:focus-visible { outline: 2px solid var(--mdp-accent-border); outline-offset: 2px; }

.mdp-acc-list { border-top: 1px solid var(--mdp-border); }
.mdp-acc-item { border-bottom: 1px solid var(--mdp-border); }

.mdp-acc-summary {
  display: flex;
  align-items: center;
  gap: var(--mdp-space-3);
  padding: var(--mdp-space-4) 0;
  cursor: pointer;
  font-weight: var(--mdp-weight-medium);
  font-size: 1.125rem;
  list-style: none;
}
.mdp-acc-summary::-webkit-details-marker { display: none; }
.mdp-acc-summary:focus-visible {
  outline: 2px solid var(--mdp-accent-border);
  outline-offset: 2px;
  border-radius: 4px;
}
.mdp-acc-chevron {
  flex: none;
  color: var(--mdp-accent-text);
  font-size: 1.25rem;
  line-height: 1;
  transition: transform 160ms ease;
}
.mdp-acc-item[open] .mdp-acc-chevron { transform: rotate(90deg); }
.mdp-acc-label { flex: 1; }

.mdp-acc-body { padding: 0 0 var(--mdp-space-5) calc(1.25rem + var(--mdp-space-3)); }
.mdp-acc-body > * + * { margin-top: var(--mdp-space-4); }

@media (prefers-reduced-motion: reduce) {
  .mdp-acc-chevron { transition: none; }
}

${CONTENT_BLOCK_STYLE}`;

// Enhancement only: native <details> already toggles and is keyboard-operable.
// This just wires the Expand all / Collapse all controls. Pure (no clocks).
const ACCORDION_SCRIPT = `(function () {
  var root = document.querySelector('.mdp-accordion');
  if (!root) return;
  document.documentElement.classList.add('mdp-js');
  var items = Array.prototype.slice.call(root.querySelectorAll('.mdp-acc-item'));
  function setAll(open) { for (var i = 0; i < items.length; i++) items[i].open = open; }
  var expand = root.querySelector('[data-mdp="expand"]');
  var collapse = root.querySelector('[data-mdp="collapse"]');
  if (expand) expand.addEventListener('click', function () { setAll(true); });
  if (collapse) collapse.addEventListener('click', function () { setAll(false); });
})();`;

export function renderAccordion(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);
  const mastheadTitle = title || docTitle;

  const masthead =
    `<header class="mdp-accordion-masthead">\n` +
    renderLogo(deriveLogo(ir), mastheadTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(mastheadTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  const items = rest
    .map((section, i) => {
      const { label, body } = sectionParts(section, `Section ${i + 1}`);
      const openAttr = i === 0 ? " open" : "";
      return (
        `<details class="mdp-acc-item"${openAttr}>\n` +
        `<summary class="mdp-acc-summary"><span class="mdp-acc-chevron" aria-hidden="true">›</span><span class="mdp-acc-label">${inline(
          label
        )}</span></summary>\n` +
        `<div class="mdp-acc-body">\n${renderContentBlocks(body)}\n</div>\n` +
        `</details>`
      );
    })
    .join("\n");

  const controls =
    `<div class="mdp-acc-controls">\n` +
    `<button class="mdp-acc-btn" type="button" data-mdp="expand">Expand all</button>\n` +
    `<button class="mdp-acc-btn" type="button" data-mdp="collapse">Collapse all</button>\n` +
    `</div>`;

  const body =
    `<main class="mdp-accordion">\n${masthead}\n${controls}\n` +
    `<div class="mdp-acc-list">\n${items}\n</div>\n</main>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: ACCORDION_STYLE,
    body,
    script: ACCORDION_SCRIPT,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
