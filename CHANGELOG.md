# Changelog

All notable changes to this project are documented here. The format follows
Keep a Changelog, and the project aims to follow Semantic Versioning.

## [Unreleased]

### Added
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
