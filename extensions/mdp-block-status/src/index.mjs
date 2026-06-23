// mdp-block-status: an MDP block extension that renders a row of inline status
// pills, e.g. "Shipped", "In review", "Planned".
//
// Shape mirrors mdp-compiler's own block modules (see flow.mjs): export a STYLE
// string and a render<Name>(block) that returns an HTML string. This module is
// RENDER-ONLY; turning a fenced `mdp:status` directive into the IR node below
// happens in the host engine (see README, "Use it in a document"). Every author
// string flows through inline(), so it is escaped and link schemes are defanged.
//
// IR node this renderer expects:
//   { type: "status", items: [ { label: string, tone?: "default"|"accent"|"solid" } ] }
//
// The design lock has one restrained accent and no free color, so the tones are
// emphasis levels built from the engine's own tokens, not arbitrary hues:
//   default  a calm neutral pill (surface + border)
//   accent   the soft accent treatment (accent-surface + accent-border + accent-text)
//   solid    the accent fill, with on-fill text (accent-contrast)

import { inline } from "./_inline.mjs";

// The closed tone set. An unknown or missing tone clamps to "default", so a
// `tone` value can never inject a class or smuggle markup into the class list.
const TONES = new Set(["default", "accent", "solid"]);

// The block's stylesheet, injected once by each host renderer that emits this
// block. Tokens only (var(--mdp-*)); logical properties so it flips under
// dir="rtl"; literal radii/sizes are fine, literal colors are not.
export const STATUS_STYLE = `.mdp-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mdp-space-2);
  margin: 0;
}

.mdp-status-pill {
  display: inline-flex;
  align-items: center;
  background: var(--mdp-surface);
  border: 1px solid var(--mdp-border);
  border-radius: 999px;
  padding-block: var(--mdp-space-1);
  padding-inline: var(--mdp-space-3);
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  line-height: var(--mdp-leading-tight);
  color: var(--mdp-ink-soft);
}

.mdp-status-pill--accent {
  background: var(--mdp-accent-surface);
  border-color: var(--mdp-accent-border);
  color: var(--mdp-accent-text);
}

.mdp-status-pill--solid {
  background: var(--mdp-accent);
  border-color: var(--mdp-accent);
  color: var(--mdp-accent-contrast);
}`;

// Render one status block: a row of pills. Pure and deterministic (no clocks, no
// randomness, stable order), so two renders of the same node are byte-identical.
export function renderStatus(block) {
  const items = (block && block.items) || [];
  const pills = items
    .map((it) => {
      const tone = it && TONES.has(it.tone) ? it.tone : "default";
      const cls =
        tone === "default" ? "mdp-status-pill" : `mdp-status-pill mdp-status-pill--${tone}`;
      const label = it && it.label != null ? it.label : "";
      return `<span class="${cls}">${inline(label)}</span>`;
    })
    .join("\n");
  return `<div class="mdp-status">\n${pills}\n</div>`;
}
