# Changelog

All notable changes to this project are documented here. The format follows
Keep a Changelog, and the project aims to follow Semantic Versioning.

## [Unreleased]

## [0.1.0]

### Added
- A Claude Code plugin (this repo is the marketplace): a `/mdp` command and an
  `mdp` skill that auto-triggers on "show this", "make a deck", "present this",
  and similar. Install with `/plugin marketplace add barmoshe/mdp` then
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
