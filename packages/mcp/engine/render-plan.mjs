// render-plan.mjs: the `plan` artifact: an implementation plan, phase by phase.
//
// Purpose-built for the plans AI agents write: a goal, ordered phases, and the
// work inside each. The `{.lead}` standfirst is the goal; each `---`-delimited
// section is a phase (its leading `##` heading names it); the phase body renders
// the full block vocabulary, so an `mdp:tasks` checklist, a `:::callout warning`
// (a risk), a `:::callout recommendation` (a verification or rollback note), a
// table of files, or a flow all sit naturally inside a phase.
//
// Built on native <details>/<summary>: every phase is open by default and the
// whole plan reads as a clean stacked document with no JS at all. A small
// enhancement layer (the .mdp-js class) turns each task box into a toggle and
// drives a live progress meter that counts done tasks. State is ephemeral (it
// resets on reload) and the script is pure: it only toggles classes and reads
// counts from the DOM, never a clock or random source. The design lock holds:
// task status reads through the one accent + the ink ramp + a glyph only.

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

const PLAN_STYLE = `.mdp-plan {
  max-width: 46rem;
  margin: 0 auto;
  padding: var(--mdp-space-9) var(--mdp-space-5);
}

.mdp-plan-masthead { margin-bottom: var(--mdp-space-6); }
.mdp-plan-masthead .mdp-eyebrow { margin-bottom: var(--mdp-space-4); }
.mdp-plan-masthead .mdp-title {
  font-size: var(--mdp-text-title);
  margin-bottom: var(--mdp-space-5);
}
.mdp-plan-masthead .mdp-lead { font-size: var(--mdp-text-lead); }

/* The progress meter is a JS affordance: hidden until the script runs, so a
   no-JS reader never sees an empty, stuck track. */
.mdp-plan-summary { display: none; margin-bottom: var(--mdp-space-7); }
.mdp-js .mdp-plan-summary { display: block; }
.mdp-plan-progress {
  height: 3px;
  background: var(--mdp-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--mdp-space-3);
}
.mdp-plan-progress-bar {
  display: block;
  height: 100%;
  width: 0%;
  background: var(--mdp-accent);
  transition: width 220ms ease;
}
.mdp-plan-counter {
  margin: 0;
  font-size: var(--mdp-text-small);
  color: var(--mdp-ink-faint);
  font-variant-numeric: tabular-nums;
}

.mdp-plan-phases { border-top: 1px solid var(--mdp-border); }
.mdp-phase { border-bottom: 1px solid var(--mdp-border); }

.mdp-phase-summary {
  display: flex;
  align-items: center;
  gap: var(--mdp-space-3);
  padding: var(--mdp-space-4) 0;
  cursor: pointer;
  font-weight: var(--mdp-weight-medium);
  font-size: 1.125rem;
  list-style: none;
}
.mdp-phase-summary::-webkit-details-marker { display: none; }
.mdp-phase-summary:focus-visible {
  outline: 2px solid var(--mdp-accent-border);
  outline-offset: 2px;
  border-radius: 4px;
}
.mdp-phase-num {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  border: 1px solid var(--mdp-border);
  color: var(--mdp-ink-faint);
  font-size: var(--mdp-text-small);
  font-variant-numeric: tabular-nums;
}
.mdp-phase-label { flex: 1; }
.mdp-phase-meta {
  flex: none;
  color: var(--mdp-ink-faint);
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-normal);
  font-variant-numeric: tabular-nums;
}

.mdp-phase-body {
  padding-block: 0 var(--mdp-space-6);
  padding-inline: calc(1.6rem + var(--mdp-space-3)) 0;
}
.mdp-phase-body > * + * { margin-top: var(--mdp-space-4); }

/* The task box becomes an operable toggle only when JS upgrades it. */
.mdp-js .mdp-plan .mdp-task-box { cursor: pointer; }
.mdp-plan .mdp-task-box:focus-visible {
  outline: 2px solid var(--mdp-accent-border);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .mdp-plan-progress-bar { transition: none; }
}

${CONTENT_BLOCK_STYLE}`;

// The plan controller: upgrade each task box to a toggle button, and keep a live
// progress meter (overall and per phase) in sync with the checked tasks. Pure
// ES5, no clocks, no storage: toggling resets on reload. The base status a task
// returns to when un-done is its authored status (an authored "active" task
// toggles done <-> active; everything else toggles done <-> todo).
const PLAN_SCRIPT = `(function () {
  var root = document.querySelector('.mdp-plan');
  if (!root) return;
  document.documentElement.classList.add('mdp-js');

  var tasks = Array.prototype.slice.call(root.querySelectorAll('.mdp-task'));
  var phases = Array.prototype.slice.call(root.querySelectorAll('.mdp-phase'));
  var bar = root.querySelector('[data-mdp="bar"]');
  var counter = root.querySelector('[data-mdp="counter"]');
  var summary = root.querySelector('[data-mdp="summary"]');
  var total = tasks.length;

  function setStatus(li, status) {
    li.classList.remove('is-todo', 'is-done', 'is-active');
    li.classList.add('is-' + status);
    var box = li.querySelector('.mdp-task-box');
    var word = li.querySelector('.mdp-task-status');
    var glyph = status === 'done' ? '\\u2713' : status === 'active' ? '\\u25B8' : '';
    var label = status === 'done' ? 'Done' : status === 'active' ? 'In progress' : 'To do';
    if (box) {
      box.textContent = glyph;
      box.setAttribute('aria-pressed', status === 'done' ? 'true' : 'false');
    }
    if (word) word.textContent = label + ': ';
  }

  function update() {
    var done = root.querySelectorAll('.mdp-task.is-done').length;
    if (bar) bar.style.width = (total ? (done / total * 100) : 0) + '%';
    if (counter) counter.textContent = done + ' of ' + total + ' done';
    for (var p = 0; p < phases.length; p++) {
      var pt = phases[p].querySelectorAll('.mdp-task').length;
      var pd = phases[p].querySelectorAll('.mdp-task.is-done').length;
      var meta = phases[p].querySelector('[data-mdp="phasemeta"]');
      if (meta) meta.textContent = pt ? (pd + '/' + pt) : '';
    }
  }

  if (!total && summary) summary.style.display = 'none';

  tasks.forEach(function (li) {
    var box = li.querySelector('.mdp-task-box');
    if (!box) return;
    var base = li.classList.contains('is-active') ? 'active' : 'todo';
    box.removeAttribute('aria-hidden');
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-pressed', li.classList.contains('is-done') ? 'true' : 'false');
    box.setAttribute('aria-label', 'Toggle task done');
    function toggle() {
      setStatus(li, li.classList.contains('is-done') ? base : 'done');
      update();
    }
    box.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggle();
      }
    });
  });

  update();
})();`;

export function renderPlan(ir) {
  const docTitle = deriveTitle(ir);
  const sections = splitSections(ir.blocks);
  const { title, lead, rest } = extractMasthead(sections);
  const mastheadTitle = title || docTitle;

  const masthead =
    `<header class="mdp-plan-masthead">\n` +
    renderLogo(deriveLogo(ir), mastheadTitle) +
    `<p class="mdp-eyebrow">${inline(deriveEyebrow(ir))}</p>\n` +
    `<h1 class="mdp-title">${inline(mastheadTitle)}</h1>\n` +
    (lead ? `<p class="mdp-lead">${inline(lead)}</p>\n` : "") +
    `</header>`;

  const summary =
    `<div class="mdp-plan-summary" data-mdp="summary">\n` +
    `<div class="mdp-plan-progress" aria-hidden="true">` +
    `<span class="mdp-plan-progress-bar" data-mdp="bar"></span></div>\n` +
    `<p class="mdp-plan-counter" data-mdp="counter" aria-live="polite"></p>\n` +
    `</div>`;

  const phases = rest
    .map((section, i) => {
      const { label, body } = sectionParts(section, `Phase ${i + 1}`);
      return (
        `<details class="mdp-phase" open>\n` +
        `<summary class="mdp-phase-summary">` +
        `<span class="mdp-phase-num" aria-hidden="true">${i + 1}</span>` +
        `<span class="mdp-phase-label">${inline(label)}</span>` +
        `<span class="mdp-phase-meta" data-mdp="phasemeta"></span>` +
        `</summary>\n` +
        `<div class="mdp-phase-body">\n${renderContentBlocks(body)}\n</div>\n` +
        `</details>`
      );
    })
    .join("\n");

  const body =
    `<main class="mdp-plan">\n${masthead}\n${summary}\n` +
    `<div class="mdp-plan-phases">\n${phases}\n</div>\n</main>`;

  const { lang, dir } = deriveLangDir(ir);
  return htmlDocument({
    title: docTitle,
    style: PLAN_STYLE,
    body,
    script: PLAN_SCRIPT,
    lang,
    dir,
    theme: deriveTheme(ir),
    accent: deriveBrandAccent(ir),
    accent2: deriveBrandAccent2(ir),
    font: deriveBrandFont(ir),
  });
}
