# AGENTS.md

Machine-facing build and contribution guide for the MDP engine. (A thin
`CLAUDE.md` can point here later; see OPEN-SOURCE.md for the convention.)

## What this is

MDP compiles one declarative `.mdp` source into several design-locked HTML
artifacts. The design lives in the engine, not the source: authors write
meaning, the renderer guarantees the look.

## Build and run

- No dependencies. Plain Node ESM (`.mjs`). Runs with `node` directly, no
  install, no build step, no bundler.
- Build all artifacts: `node packages/core/build.mjs` (or `npm run build` /
  `pnpm build` from the repo root).
- Compile a different source: `node packages/core/build.mjs path/to/file.mdp`.
- Output: one HTML file per artifact under `dist/` at the repo root
  (`page.html`, `slides.html`, `flyer.html`, plus `report.html`, `onepager.html`,
  `memo.html`, `letter.html`, `scroll.html`, `accordion.html`, `tabs.html`,
  `stepper.html`, `plan.html` when a source opts into them).

## Determinism (a hard rule)

The render path must be pure: no `Date.now()`, no `Math.random()`, no clocks,
stable iteration order. Running the build twice must produce byte-identical
files. Any change that breaks this is a bug.

## Package layout

```
mdp/
  packages/core/            mdp-compiler, the engine
    src/
      parse.mjs             source string  -> IR { meta, blocks }
      inline.mjs            inline markdown -> escaped, safe HTML
      tokens.mjs            the locked "studio" design system, as CSS
      shared.mjs            doc scaffold + section helpers shared by renderers
      render-page.mjs       the `page` artifact solver
      render-slides.mjs     the `slides` artifact solver
      render-flyer.mjs      the `flyer` artifact solver
      render-report.mjs     the `report` artifact solver
      render-onepager.mjs   the one-pager artifact solver
      render-memo.mjs       the `memo` artifact solver
      render-letter.mjs     the `letter` artifact solver
      content-blocks.mjs    the shared content-flow block renderer used by scroll, accordion, tabs, stepper, and plan
      render-scroll.mjs     the `scroll` artifact solver
      render-accordion.mjs  the `accordion` artifact solver
      render-tabs.mjs       the `tabs` artifact solver
      render-stepper.mjs    the `stepper` artifact solver
      render-plan.mjs       the `plan` artifact solver
      tasks.mjs             the `mdp:tasks` checklist block (STYLE + render)
      index.mjs             exports parse() and compile(source, artifact)
    build.mjs               CLI: read a source, compile all artifacts, write dist
  commands/mdp.md           the Claude Code /mdp command
  codex/                    the Codex plugin (vendored engine; see Plugin surfaces)
  packages/mcp/             the mdp-mcp server (vendored engine; see Plugin surfaces)
  spec/schema.json          JSON Schema for the .mdp frontmatter (stub)
  examples/                 example probes (indexed in examples/README.md)
  templates/                fill-in document templates
```

The data flow is one direction: `source string -> parse() -> IR -> render() ->
HTML`. The IR (`{ meta, blocks }`) is the semantic representation every artifact
solves against. See `src/parse.mjs` for the node types.

## Plugin surfaces

The same engine ships to agent tools three ways. All author MDP, run the engine,
and surface the result; none adds anything to the format.

- **Claude Code**: the repo root is the plugin (`.claude-plugin/`, a single
  `/mdp` command in `commands/`). It runs the engine in place at `packages/core/`.
- **Codex**: a self-contained plugin in `codex/` (`.codex-plugin/plugin.json`,
  an `mdp` skill in `codex/skills/`). Codex caches a copy of a plugin on install,
  so the engine, `bin/`, `SPEC.md`, and one example are **vendored** into `codex/`
  by `npm run sync:codex`. They are a copy of the root, not a second source;
  re-run it after any engine change. The plugin sits in its own folder (not the
  root) so Codex and Claude each see exactly one `mdp` component: a root-level
  skill would collide with the `/mdp` command. To check it, rebuild a source
  through `codex/bin/mdp` and confirm the HTML is byte-identical to the root
  engine.
- **MCP server**: a self-contained server in `packages/mcp/` (`mdp-mcp`),
  published to npm and runnable via `npx -y mdp-mcp`, so any MCP host (Claude
  Desktop, Cursor, ...) can compile MDP. It exposes the `mdp_compile`,
  `mdp_present`, `mdp_validate`, and `mdp_send_slack` tools plus `mdp://spec` and `mdp://example/*`
  resources. Like Codex it is self-contained: the engine and assets are
  **vendored** in by `npm run sync:mcp` (a copy of the root, re-run after any
  engine change; CI fails if it is stale). It is the one package with
  dependencies (the MCP SDK + zod); the engine itself stays dependency-free.

## Releasing

Each package versions independently and publishes **manually**. There is no
release workflow; tagging does nothing automated.

1. Bump the version in the changed package's `package.json` (`mdp-compiler` in
   `packages/core`, `mdp-mcp` in `packages/mcp`, and/or `create-mdp-extension`),
   update `CHANGELOG.md`, and land it on `main`. After an engine change, re-run
   `npm run sync:codex` and `npm run sync:mcp` so the vendored copies match (the
   CI freshness gates fail otherwise). `mdp-mcp` also carries a hardcoded version
   string in `src/server.mjs` that sync does not touch; bump it by hand.
2. Authenticate once: `npm login` (npm's browser web-auth, which clears 2FA). A
   local `npm publish` returns a misleading `404` if you are not logged in first.
3. Publish each changed package from its own directory:
   `cd packages/core && npm publish --access public`, then
   `cd packages/mcp && npm publish --access public`. `packages/mcp` has a
   `prepack` hook that re-runs `sync-mcp` (re-vendoring the engine) before it
   packs, so the tarball always ships a fresh engine.
4. Tag and cut the GitHub Release for visibility:
   `git tag vX.Y.Z && git push origin vX.Y.Z`, then `gh release create vX.Y.Z`
   with notes from `CHANGELOG.md`. The tag is a marker only; it publishes nothing.

A published version is immutable: to fix a mistake, bump and ship a new version
(`npm deprecate` retires a bad one).

**CI auto-publish is a not-yet-built future option.** There is no
`.github/workflows/release.yml` (an earlier one was removed). Clearing npm's
2FA-on-publish gate (`EOTP`) from CI needs either a **granular** access token
created with the **"Bypass two-factor authentication"** box (npm removed classic
Automation tokens in Nov 2025) or **Trusted Publishing** via OIDC. Until one is
set up, releases are manual by the flow above.

## The design lock

`src/tokens.mjs` is the single source of the look: two font families, two
weights, one neutral ink ramp, light + dark, no gradients or shadows. Every
renderer imports `baseStyle()` and shares the same block primitives (eyebrow,
lead, headings, lists, stats, quote, hairline). Do not add per-element styling
to the source format, and do not introduce a second accent colour without an
ADR. Hierarchy comes from type size, weight, and whitespace.

## How to add a new artifact renderer

1. Create `packages/core/src/render-<name>.mjs` exporting
   `render<Name>(ir) -> htmlString`. Import `inline` from `inline.mjs` and the
   helpers from `shared.mjs` (`htmlDocument`, `deriveTitle`, `deriveEyebrow`,
   `splitSections`, `extractMasthead`, `sectionHeading`).
2. Build the artifact's own layout CSS as a string and pass it to
   `htmlDocument({ title, style, body, script })`. Reuse the shared block
   classes (`.mdp-h2`, `.mdp-list`, `.mdp-figures`, `.mdp-quote`, ...) so the
   form stays consistent with the others. Only add layout, never new colours or
   fonts.
3. Register it in `src/index.mjs`: add one entry to `RENDERERS`
   (`<name>: render<Name>`). `ARTIFACTS` and the CLI pick it up automatically.
4. Keep the render pure (see Determinism). Solve the IR; never reach back to
   the raw source or to any external state.

## How to add a new block type

1. Teach `src/parse.mjs` to emit a new typed node. Unknown directives must
   degrade to readable text, never throw or blank.
2. Handle the new node in each `render-*.mjs` (and add shared CSS to
   `tokens.mjs` if the primitive is cross-artifact).
3. Update `spec/schema.json` and the SPEC once the shape settles.

The current block set: `{.lead}` / `{.cite}` (line roles), `mdp:stats`,
`mdp:compare`, `mdp:flow`, `mdp:table`, `mdp:chart`, `mdp:diagram` (flow,
sequence, tree kinds), `mdp:timeline`, `mdp:faq`, `mdp:pricing`, `mdp:tasks`
(a status-aware checklist: todo / done / active), and
`:::callout` (note, tip, cost, recommendation, warning variants). Every block
must degrade to readable text if the renderer does not recognise it.
