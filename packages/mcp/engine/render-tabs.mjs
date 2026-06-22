// render-tabs.mjs: the `tabs` artifact: a tabbed explorer.
//
// Each `---`-delimited section becomes one tab panel; the leading `##` heading
// is the tab label. Lateral, non-linear navigation across the same IR. Follows
// the WAI-ARIA tabs pattern: a role=tablist of role=tab buttons controlling
// role=tabpanel regions, roving tabindex, Arrow/Home/End keys, and a URL-hash
// deep link to a named tab. With JS off, every panel is visible and stacked
// (each keeps its heading), so the document stays fully readable.

import { inline, escapeHtml } from "./inline.mjs";
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
  slugify,
} from "./content-blocks.mjs";

const TABS_STYLE = `.mdp-tabs {
  max-width: 52rem;
  margin: 0 auto;
  padding: var(--mdp-space-9) var(--mdp-space-5);
}

.mdp-tabs-masthead { margin-bottom: var(--mdp-space-7); }
.mdp-tabs-masthead .mdp-eyebrow { margin-bottom: var(--mdp-space-4); }
.mdp-tabs-masthead .mdp-title {
  font-size: var(--mdp-text-title);
  margin-bottom: var(--mdp-space-5);
}
.mdp-tabs-masthead .mdp-lead { font-size: var(--mdp-text-lead); }

.mdp-tablist {
  display: flex;
  gap: var(--mdp-space-2);
  border-bottom: 1px solid var(--mdp-border);
  margin-bottom: var(--mdp-space-6);
  overflow-x: auto;
  scrollbar-width: thin;
}
.mdp-tab {
  font-family: inherit;
  font-size: 1rem;
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-ink-soft);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: var(--mdp-space-3) var(--mdp-space-4);
  cursor: pointer;
  white-space: nowrap;
  line-height: 1.2;
  transition: color 120ms ease, border-color 120ms ease;
}
.mdp-tab:hover { color: var(--mdp-ink); }
.mdp-tab[aria-selected="true"] {
  color: var(--mdp-ink);
  border-bottom-color: var(--mdp-accent);
}
.mdp-tab:focus-visible {
  outline: 2px solid var(--mdp-accent-border);
  outline-offset: 2px;
  border-radius: 4px;
}

.mdp-tabpanel > * + * { margin-top: var(--mdp-space-4); }
/* No-JS: panels stack with breathing room. JS shows one at a time. */
.mdp-tabpanel + .mdp-tabpanel { margin-top: var(--mdp-space-8); }
.mdp-js .mdp-tabpanel + .mdp-tabpanel { margin-top: 0; }
.mdp-tabpanel[hidden] { display: none; }

@media (prefers-reduced-motion: reduce) {
  .mdp-tab { transition: none; }
}

${CONTENT_BLOCK_STYLE}`;

// The tab controller: roving tabindex, automatic activation on arrow keys, and
// a URL-hash deep link. Pure (no clocks, no randomness); panel ids are derived
// from the tab index, hashes from the heading text.
const TABS_SCRIPT = `(function () {
  var root = document.querySelector('.mdp-tabs');
  if (!root) return;
  document.documentElement.classList.add('mdp-js');
  var tablist = root.querySelector('[role="tablist"]');
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]'));
  if (!tabs.length) return;
  var current = 0;

  function activate(i, focus, updateHash) {
    i = Math.max(0, Math.min(tabs.length - 1, i));
    for (var j = 0; j < tabs.length; j++) {
      var on = j === i;
      tabs[j].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[j].tabIndex = on ? 0 : -1;
      if (panels[j]) panels[j].hidden = !on;
    }
    current = i;
    if (focus) tabs[i].focus();
    if (updateHash && window.history && window.history.replaceState) {
      var hash = tabs[i].getAttribute('data-hash');
      if (hash) window.history.replaceState(null, '', '#' + hash);
    }
  }

  for (var k = 0; k < tabs.length; k++) {
    (function (n) {
      tabs[n].addEventListener('click', function () { activate(n, false, true); });
    })(k);
  }

  tablist.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { activate((current + 1) % tabs.length, true, true); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { activate((current - 1 + tabs.length) % tabs.length, true, true); e.preventDefault(); }
    else if (e.key === 'Home') { activate(0, true, true); e.preventDefault(); }
    else if (e.key === 'End') { activate(tabs.length - 1, true, true); e.preventDefault(); }
  });

  var start = 0;
  if (window.location.hash) {
    var want = window.location.hash.slice(1);
    for (var m = 0; m < tabs.length; m++) {
      if (tabs[m].getAttribute('data-hash') === want) { start = m; break; }
    }
  }
  activate(start, false, false);
})();`;

export function renderTabs(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);
  const mastheadTitle = title || docTitle;

  const masthead =
    `<header class="mdp-tabs-masthead">\n` +
    renderLogo(deriveLogo(ir), mastheadTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(mastheadTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  // Deterministic, collision-free deep-link hashes from each tab label.
  const used = Object.create(null);
  const uniqueHash = (label, i) => {
    const base = slugify(label) || `section-${i + 1}`;
    let hash = base;
    let n = 2;
    while (used[hash]) hash = `${base}-${n++}`;
    used[hash] = true;
    return hash;
  };

  const tabBtns = [];
  const panels = [];
  rest.forEach((section, i) => {
    const { label } = sectionParts(section, `Tab ${i + 1}`);
    const hash = uniqueHash(label, i);
    const selected = i === 0;
    tabBtns.push(
      `<button class="mdp-tab" role="tab" type="button" id="mdp-tab-${i}" ` +
        `aria-controls="mdp-panel-${i}" aria-selected="${selected}" ` +
        `tabindex="${selected ? 0 : -1}" data-hash="${escapeHtml(hash)}">${inline(
          label
        )}</button>`
    );
    panels.push(
      `<section class="mdp-tabpanel" role="tabpanel" id="mdp-panel-${i}" ` +
        `aria-labelledby="mdp-tab-${i}" tabindex="0">\n` +
        `${renderContentBlocks(section.blocks)}\n</section>`
    );
  });

  const tablist =
    `<div class="mdp-tablist" role="tablist" aria-label="Sections">\n` +
    `${tabBtns.join("\n")}\n</div>`;

  const body =
    `<main class="mdp-tabs">\n${masthead}\n${tablist}\n${panels.join("\n")}\n</main>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: TABS_STYLE,
    body,
    script: TABS_SCRIPT,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
