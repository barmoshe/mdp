# Changelog

All notable changes to this project are documented here. The format follows
Keep a Changelog, and the project aims to follow Semantic Versioning.

## [Unreleased]

### Added
- Five more themes, bringing the curated set to eleven: `ocean` (a clean true
  blue), `forest` (a deep natural green), `terracotta` (an earthy burnt clay),
  `coral` (a warm coral red), and `plum` (a deep berry). The set is now ordered
  as a spectrum. Every accent is WCAG-AA verified in light and dark.
- An AA-conformance test (`npm test`, `scripts/check-contrast.mjs`) that compiles
  the real token CSS for every theme and asserts the accent-text and accent-fill
  contrast guarantees, so a future theme cannot regress accessibility.
- A visual theme picker in the playground: the theme control is now a swatch
  strip (a colored chip per palette), and the themes doc shows a swatch gallery.
  Both read their colors from a new `THEME_SWATCHES` export on the engine, so the
  swatches never drift from the real accents.
- A hub and live playground at https://barmoshe.github.io/mdp/, deployed to
  GitHub Pages. It lives in `site/` (a Vite + React app) and bundles the real
  engine from `packages/core`, so the playground compiles with the same code the
  CLI and the plugins run: edit a source, switch the form, pick a theme, and the
  page, slides, and flyer compile in the browser. The site also carries the full
  documentation (getting started, the format, blocks, forms, themes, the CLI,
  plugins, and architecture). The engine stays dependency-free; only the site has
  a build. A `pages` workflow deploys it on every push to `main`.
- A Codex plugin, so the same "show this as a deck" flow works inside Codex. It
  is a self-contained plugin in `codex/` (the dependency-free engine is vendored
  in, refreshed with `npm run sync:codex`) exposing an `mdp` skill that
  auto-triggers on "show this", "make a deck", "present this", and similar. Add
  the marketplace with `codex marketplace add barmoshe/mdp`, then enable MDP from
  the Codex app. Kept in its own folder so Codex and Claude each see a single
  `mdp` component.

## [0.2.0]

### Added
- A color and theme system. The `theme` frontmatter field is now wired to a
  curated set the author selects by name (never raw colors): `studio` (the
  default, an indigo accent), `teal`, `amber`, `violet`, `rose`, and `mono` (the
  strict black-and-white look, preserved as an opt-in). An unknown theme falls
  back to `studio`.
- A semantic accent token set (`--mdp-accent`, `--mdp-accent-contrast`,
  `--mdp-accent-text`, `--mdp-accent-surface`, `--mdp-accent-border`), a two-shade
  system tuned to pass WCAG AA in light and dark. The accent appears only in
  meaning-spots: links, the compare button (now a filled accent button), the
  recommendation callout, stat figures, the active slide dot, and flow arrows.

### Changed
- Warmed the neutral ramp (a warm off-white background and near-black ink instead
  of pure `#fff` / `#000`) so the default reads designed, not stark.

### Added
- A Claude Code plugin (this repo is the marketplace): a self-contained `/mdp`
  command that auto-triggers on "show this", "make a deck", "present this", and
  similar. Install with `/plugin marketplace add barmoshe/mdp` then
  `/plugin install mdp@mdp`. Claude authors MDP, compiles it, and opens the
  result to show or present it.
- The CLI gained `--open [artifact]` (show or present in the browser, cross
  platform), `--out <dir>`, and `--only <artifact>`.
- The slides deck gained a fullscreen toggle (F key and a button), a print-to-PDF
  stylesheet (Cmd or Ctrl + P gives one slide per page), space-bar advance, and a
  keyboard hint.

## [0.0.0]

Initial public release. The spike that proves the core claim.

### Added
- A dependency-free Node ESM engine: one `.mdp` source compiles to three artifacts.
- Artifacts: `page` (a scrolling document), `slides` (a click-through deck), and
  `flyer` (a single composed surface).
- Blocks: `mdp:stats`, `mdp:compare`, `mdp:flow`, and `:::callout` (with note,
  tip, cost, recommendation, and warning variants).
- Line roles: `{.lead}` and `{.cite}`.
- Right-to-left support via the `lang` and `dir` frontmatter fields.
- A single locked "studio" theme. The author writes meaning only; the engine
  owns all design.
- Deterministic output: two builds of the same source are byte-identical.
