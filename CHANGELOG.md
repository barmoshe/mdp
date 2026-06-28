# Changelog

All notable changes to this project are documented here. The format follows
Keep a Changelog, and the project aims to follow Semantic Versioning.

## [Unreleased]

## [0.6.0] - 2026-06-28

### Fixed
- **Plan preview renders before approval.** The auto-render hook is now
  `PreToolUse` on `ExitPlanMode`, not `PostToolUse`. `PostToolUse` resolves only
  after you approve a plan, so the preview appeared only post-approval and, via
  `--latest`, could render the previous plan mid-iteration. The preview now pops up
  as the plan is presented and refreshes on every revision.

### Added
- **`preview-plan.mjs --hook`.** A first-class hook mode: it reads the
  `ExitPlanMode` tool-call JSON on stdin and renders that exact plan
  (`tool_input.plan`), so no shell wrapper is needed to wire the `PreToolUse` hook.
  It falls back to the newest saved plan when the payload carries none, and always
  exits 0 so it can never block `ExitPlanMode`. The repo's own `.claude/settings.json`
  and the README now use `PreToolUse` + `--hook`.

### Changed
- **Plan preview works as an installed plugin.** `/mdp-preview-plan` now invokes the
  converter via `${CLAUDE_PLUGIN_ROOT}` (with a repo-root fallback) instead of a
  CWD-relative path, so it works for `/mdp` plugin users in any project, not just
  inside this repo.

## [0.5.0] - 2026-06-24

### Added
- **Plan form.** A fifth interactive form, `plan`, renders an implementation plan
  as collapsible phases (each `---` section a `<details>`), the `{.lead}` standfirst
  as the goal, and `mdp:tasks` checklists driving a live progress meter. It reads
  the block set exactly as `page` does.
- **`mdp:tasks` block.** A status-aware checklist directive: `- [x]` done, `- [~]`
  in progress, `- [ ]` to-do. It renders in every artifact and feeds the `plan`
  form's progress meter.
- **Plan-mode preview.** A `/mdp-preview-plan` command and a project `PostToolUse`
  hook on `ExitPlanMode` render a Claude Code plan as the `plan` form via
  `scripts/preview-plan.mjs`, which wraps the plan in MDP frontmatter, lifts
  `- [ ]` / `- [x]` / `- [~]` runs into `mdp:tasks` blocks, and splits a phase per
  `##`. The conversion is deterministic and read-only; it never edits the plan.
- **Extension examples + a live showcase.** Three curated, zero-dependency,
  deterministic reference packages under `extensions/`: `mdp-block-status`
  (`mdp:status` pills), `mdp-block-spec-sheet` (`mdp:spec-sheet`), and
  `mdp-artifact-resume` (a `resume` output type), each with its own tests and an
  offline demo. A new `scripts/check-extensions.mjs` (wired into `npm test` and CI)
  gates them on tests, demo, determinism, and drift from the vendored engine. The
  site gains an Extensions showcase that runs the real modules in `srcDoc` iframes,
  plus a "Build an extension" docs page.

### Fixed
- The extension scaffolder now documents `content-blocks.mjs` wiring, so a
  scaffolded block renders inside the interactive forms, not only the static
  artifacts (scaffolder template README, CONTRIBUTING, architecture doc).

## [0.4.0] - 2026-06-23

### Added
- **Send to Slack.** A new `mdp_send_slack` MCP tool (in `mdp-mcp`) compiles a
  source and uploads the self-contained HTML artifact to a Slack channel as a
  file, via Slack's external-upload flow (`files.getUploadURLExternal` → upload
  the bytes → `files.completeUploadExternal`). Auth is a bot token in
  `SLACK_BOT_TOKEN` (scope `files:write`); the channel is the `channel` argument
  or `MDP_SLACK_CHANNEL`. Works for any single form. Slack shows the `.html` as a
  downloadable file rather than rendering it inline; opening it shows the full
  design, interactive forms included. Expected failures (no token, no channel,
  Slack API errors) degrade to `{ ok: false, error }`. Zero new dependencies
  (built-in `fetch`).

## [0.3.1] - 2026-06-23

### Fixed
- The `mdp:diagram` tree layout renders node names instead of their bare ids.

### Changed
- The theme accent and secondary color read more boldly: accent-text link
  underlines thicken to 2px, inline `code` sits on an accent-tinted chip, the
  title masthead rule grows from a 3px hairline to a 4px bar, and list markers
  take the secondary accent. These stay meaning-spot accents, so the design
  lock is unchanged.

## [0.3.0] - 2026-06-22

### Added
- Interactive forms. Four artifacts that compile the same source into client-side
  experiences: `scroll` (a scroll-driven narrative with reveal-on-enter, a
  reading-progress bar, and a dot rail), `accordion` (collapsible stacked sections
  on native `<details>`, with Expand all / Collapse all), `tabs` (a tabbed explorer
  with arrow-key navigation and a deep-linkable URL hash), and `stepper` (a guided
  walkthrough with a progress bar and Back / Next). Each is opt-in via `forms:`,
  degrades to readable HTML with no JavaScript, respects `prefers-reduced-motion`,
  and keeps WCAG-AA contrast and keyboard navigation. The four share one
  content-flow block renderer (`content-blocks.mjs`); new examples and fill-in
  templates ship for each.
- Timeline, FAQ, and pricing blocks (`mdp:timeline`, `mdp:faq`, `mdp:pricing`),
  rendered across every form, with a new example for each.
- Custom brand color. A `brand-accent` frontmatter field (one 6-digit hex) that
  the engine derives a full WCAG-AA accent set from (five roles, light and dark),
  falling back to the named `theme` when a color cannot be made accessible. An
  optional `brand-accent-2` adds a secondary color used sparingly in engine-chosen
  spots (the title underline, the flow connectors, the active slide dot). The WCAG
  contrast oracle now lives in the engine (`packages/core/src/color.mjs`) and is
  shared by the build-time contrast gate. The masthead logo sits on a lockup plate
  so it stays legible in dark mode, and the title underline yields when a logo is
  present. A `brand-font` field selects the body/UI family from a closed set of
  system font stacks (system, serif, mono, rounded, humanist; no web fonts), the
  one allowed relaxation of the two-family lock. New `examples/brand-accent.mdp`.
- Published to npm: the engine as `mdp-compiler`, the MCP server as `mdp-mcp`, and
  the scaffolder as `create-mdp-extension` (all unscoped and public). `npm i
  mdp-compiler` to embed the engine, `npx -y mdp-mcp` for the MCP server, and
  `npm create mdp-extension` to scaffold a block or artifact.
- An MCP server (`mdp-mcp`, in `packages/mcp/`), so any MCP host (Claude Desktop,
  Cursor, ...) can compile MDP. It exposes `mdp_compile` (writes a file, returns
  the absolute path), `mdp_present` (a loopback browser preview), and
  `mdp_validate`, plus `mdp://spec` and `mdp://example/*` resources. Install with
  `claude mcp add mdp -- npx -y mdp-mcp`. The engine is vendored in (refreshed by
  `npm run sync:mcp`), so the published package is self-contained.
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

### Changed
- The engine package was renamed from `@mdp/core` to `mdp-compiler` for its npm
  publish (the `@mdp` scope is owned by an unrelated party). The playground alias,
  the build scripts, and the docs were updated to match.
- The masthead now carries the theme accent so the chosen palette reads at a
  glance, not only in links and buttons: the kicker is accent-colored and a short
  accent rule sits under the title, in all three artifacts. Both are meaning-spot
  accents, not colored surfaces, so the design lock is unchanged.
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
