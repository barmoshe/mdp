// pricing.mjs: the `pricing` block primitive, shared across every artifact.
//
// A `pricing` node is a set of priced tiers: a name, an optional badge, a price
// and period, a feature checklist, and one call to action. It is the priced
// sibling of `compare` (general option cards): the same card system, but it
// standardises price/period/features/CTA so a tier reads as a pricing tier
// everywhere. The markup and CSS are identical in every form (the design lock);
// each renderer only decides where the block sits. Pure CSS, no dependency.
//
// IR shape (from parse.mjs):
//   { type: 'pricing', tiers: [ { name, badge, price, period, cta, features: [] } ] }

import { inline } from "./inline.mjs";

// The shared pricing stylesheet. A responsive card grid (the same engine as
// compare). The "popular" badge and the CTA are the accent meaning-spots; the
// feature check marks use the accent text colour. Logical properties throughout.
export const PRICING_STYLE = `.mdp-pricing {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--mdp-space-5);
}
.mdp-pricing-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--mdp-bg);
  border: 1px solid var(--mdp-border);
  border-radius: 12px;
  padding: var(--mdp-space-5);
}
.mdp-pricing-head {
  display: flex;
  align-items: center;
  gap: var(--mdp-space-3);
  margin-bottom: var(--mdp-space-4);
}
.mdp-pricing-name {
  font-family: var(--mdp-font-sans);
  font-weight: var(--mdp-weight-medium);
  font-size: 1.25rem;
  line-height: var(--mdp-leading-tight);
  letter-spacing: -0.01em;
  color: var(--mdp-ink);
  margin: 0;
}
.mdp-pricing-badge {
  margin-inline-start: auto;
  flex: none;
  font-size: var(--mdp-text-eyebrow);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-accent-contrast);
  background: var(--mdp-accent);
  border-radius: 999px;
  padding: var(--mdp-space-1) var(--mdp-space-3);
  line-height: 1.4;
  white-space: nowrap;
}
.mdp-pricing-price {
  display: flex;
  align-items: baseline;
  gap: var(--mdp-space-2);
  margin: 0 0 var(--mdp-space-4);
}
.mdp-pricing-amount {
  font-size: var(--mdp-text-title);
  font-weight: var(--mdp-weight-medium);
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--mdp-ink);
  font-variant-numeric: tabular-nums;
}
.mdp-pricing-period { font-size: var(--mdp-text-small); color: var(--mdp-ink-soft); }
.mdp-pricing-features {
  list-style: none;
  margin: 0 0 var(--mdp-space-5);
  padding: 0;
  color: var(--mdp-ink-soft);
  font-size: var(--mdp-text-small);
}
.mdp-pricing-features li {
  position: relative;
  padding-inline-start: 1.5em;
}
.mdp-pricing-features li + li { margin-top: var(--mdp-space-2); }
.mdp-pricing-features li::before {
  content: "✓";
  position: absolute;
  inset-inline-start: 0;
  color: var(--mdp-accent-text);
  font-weight: var(--mdp-weight-medium);
}
.mdp-pricing-cta {
  margin-top: auto;
  align-self: start;
  display: inline-flex;
  align-items: center;
  gap: var(--mdp-space-2);
  font-size: var(--mdp-text-small);
  font-weight: var(--mdp-weight-medium);
  color: var(--mdp-accent-contrast);
  background: var(--mdp-accent);
  border: 1px solid var(--mdp-accent);
  border-radius: 8px;
  padding: var(--mdp-space-2) var(--mdp-space-4);
  text-decoration: none;
  transition: opacity 120ms ease;
}
.mdp-pricing-cta:hover { opacity: 0.88; text-decoration: none; }`;

// Render the CTA as a button-styled link (the author writes `[text](url)`), or a
// styled span when the value is not a single link, so nothing is lost. Mirrors
// compare.mjs::renderCta.
function renderCta(raw) {
  const html = inline(String(raw).trim());
  const single = html.match(/^<a href="([^"]*)">([\s\S]*)<\/a>$/);
  if (single) return `<a class="mdp-pricing-cta" href="${single[1]}">${single[2]}</a>`;
  return `<span class="mdp-pricing-cta">${html}</span>`;
}

function renderTier(tier) {
  const badge = tier.badge ? `<span class="mdp-pricing-badge">${inline(tier.badge)}</span>` : "";
  const head =
    `<div class="mdp-pricing-head">\n` +
    `<h3 class="mdp-pricing-name">${inline(tier.name)}</h3>` +
    (badge ? `\n${badge}` : "") +
    `\n</div>`;
  const price = tier.price
    ? `<p class="mdp-pricing-price"><span class="mdp-pricing-amount">${inline(tier.price)}</span>` +
      (tier.period ? `<span class="mdp-pricing-period">${inline(tier.period)}</span>` : "") +
      `</p>`
    : "";
  const features =
    tier.features && tier.features.length
      ? `<ul class="mdp-pricing-features">\n` +
        tier.features.map((f) => `<li>${inline(f)}</li>`).join("\n") +
        `\n</ul>`
      : "";
  const cta = tier.cta ? renderCta(tier.cta) : "";
  return (
    `<div class="mdp-pricing-card">\n` +
    `${head}\n` +
    (price ? `${price}\n` : "") +
    (features ? `${features}\n` : "") +
    `${cta}\n` +
    `</div>`
  );
}

// Render a pricing block: the responsive tier-card grid.
export function renderPricing(block) {
  const cards = (block.tiers || []).map(renderTier).join("\n");
  return `<div class="mdp-pricing">\n${cards}\n</div>`;
}
