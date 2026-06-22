# MDP examples

Each example is an engine **probe**: a small, throwaway `.mdp` source that isolates
one block, theme, form, fallback, or frontmatter slot, so CI and the site can
render it and prove the mechanic. Examples are read to learn; to start a real
document, copy `starter.mdp` or a file from [`../templates`](../templates).

Every example declares what it shows in a parser-inert `demonstrates:` frontmatter
key (a closed tag vocabulary). A new block or theme lands with an example, and CI
checks that the set covers every implemented feature and all 11 themes.

[`manifest.json`](manifest.json) routes which consumers (CI, the Codex plugin, the
MCP server, the site) each example feeds; it carries routing data only.

The table below is generated from the files by `npm run gen:docs`. Do not edit it
by hand.

<!-- examples:begin -->

| file | demonstrates | blocks | forms | theme |
|---|---|---|---|---|
| `accordion.mdp` | accordion, list, callout:tip, table | callout, list, table | accordion, page | studio |
| `block-callouts.mdp` | callout:note, callout:tip, callout:cost, callout:recommendation, callout:warning, lead | callout | page, slides, flyer | amber |
| `block-chart.mdp` | chart, lead | chart | page, slides, flyer | amber |
| `block-compare.mdp` | compare, flow, callout:cost, callout:recommendation, lead | callout, compare, flow | page, slides, flyer | studio |
| `block-diagram.mdp` | diagram, lead | diagram | page, slides, flyer | studio |
| `block-faq.mdp` | faq, lead | faq | page, slides, flyer | ocean |
| `block-flow.mdp` | flow, lead | flow | flyer, page, slides | ocean |
| `block-lists.mdp` | list, lead | list | page, slides, flyer | terracotta |
| `block-pricing.mdp` | pricing, lead | pricing | page, slides, flyer | violet |
| `block-quote.mdp` | quote, cite, lead | quote | slides, page, flyer | forest |
| `block-roles.mdp` | lead, cite | quote | page, slides, flyer | coral |
| `block-stats.mdp` | stats, lead, quote, cite, list | list, quote, stats | page, slides, flyer | teal |
| `block-table.mdp` | table, lead | table | page, slides, flyer, report | teal |
| `block-timeline.mdp` | timeline, lead | timeline | page, slides, flyer | forest |
| `brand-accent.mdp` | brand-accent, brand-accent-2, brand-font, stats, flow, lead | callout, flow, stats | page, slides, flyer | studio |
| `brand-logo.mdp` | brand-logo, flow, callout:note, lead | callout, flow | page, slides, flyer | studio |
| `form-flyer-heavy.mdp` | stats, quote, compare, list, lead | compare, list, quote, stats | flyer, page | violet |
| `form-slides-heavy.mdp` | quote, list, lead | list, quote | slides, page | mono |
| `letter.mdp` | letter, list | (prose) | letter, page | terracotta |
| `memo.mdp` | memo, list, callout:note | callout, list | memo, page | studio |
| `onepager.mdp` | onepager, stats, flow, list | flow, stats | onepager, flyer | forest |
| `release-notes.mdp` | stats, callout:tip, callout:warning, quote, cite, lead | callout, quote, stats | page, slides, flyer | amber |
| `report.mdp` | report, stats, quote, list, lead, callout:recommendation | callout, list, quote, stats | report, page | ocean |
| `rtl.mdp` | rtl, flow, stats, list, callout:recommendation, quote, cite, lead | callout, flow, list, quote, stats | page, slides, flyer | rose |
| `scroll.mdp` | scroll, stats, flow, quote, callout:note | callout, flow, quote, stats | scroll, page | ocean |
| `starter.mdp` | (none) | list, stats | page, slides, flyer | studio |
| `stepper.mdp` | stepper, list, flow, callout:recommendation | callout, flow, list | stepper, page | forest |
| `tabs.mdp` | tabs, compare, table, list | compare, list, table | tabs, page | teal |
| `theme-gallery.mdp` | stats, flow, callout:note, quote, cite, lead | callout, flow, quote, stats | page, slides, flyer | plum |

<!-- examples:end -->

## Adding an example

1. Add `examples/<probe>.mdp` with a `demonstrates: [...]` line. Tags are a bare
   block/mechanic name (`stats`, `compare`, `flow`, `quote`, `list`, `lead`,
   `cite`, `brand-logo`), `callout:<variant>`, `theme:<name>`, `form:<form>`, or
   `rtl`.
2. Add a row to `manifest.json` with `id`, `file`, `label`, `lead`, and `roles`
   (from `ci-build`, `ci-determinism`, `vendor-codex`, `vendor-mcp`, `site`).
3. Run `npm run check:examples` (drift + coverage), `npm run gen:docs` (the table
   above), and `npm run sync:mcp` (vendor it), then commit.
