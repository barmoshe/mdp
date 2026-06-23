# Plugins

MDP is not an app to visit and not a syntax to learn. It is a capability the
agent reaches for inside the tool you already use. You ask in plain language; the
agent authors clean MDP, compiles it with the bundled engine, and opens the page,
deck, flyer, document form (report, one-pager, memo, letter), or interactive form
(scroll, accordion, tabs, stepper). The same engine ships to agent tools three ways.

## Claude Code

This repo is the marketplace. Add it, then install the plugin:

```text
/plugin marketplace add barmoshe/mdp
/plugin install mdp@mdp
```

Then just ask, for example "show this as a deck", "make a one-pager from this
file", or "present this". Or run the command directly:

```text
/mdp present <a file, some text, or nothing>
```

The plugin is the repo root: a single `/mdp` command that runs the engine in
place at `packages/core/`.

## Codex

MDP also ships a self-contained Codex plugin, so the same flow works inside
Codex. Add this repo as a marketplace:

```text
codex marketplace add barmoshe/mdp
```

Then enable MDP from the Codex app's plugins list and ask, for example "show this
as a slide deck" or "make a one-pager from this file".

The Codex plugin lives in `codex/`. Because Codex caches a copy of a plugin on
install, the dependency-free engine is vendored into that folder and refreshed
with `npm run sync:codex`. It is a copy of the root engine, not a second source,
and it compiles byte-identical output.

## MCP server

For any MCP-speaking host (Claude Desktop, Cursor, Windsurf, ...) MDP also ships
as a standalone MCP server, `mdp-mcp`. It exposes `mdp_compile`, `mdp_present`,
`mdp_validate`, and `mdp_send_slack`, plus the spec and examples as resources. See the
[MCP server](#/docs/mcp) page to install it.

## One engine, many surfaces

All three surfaces author MDP, run the same engine, and open the result. None
adds anything to the format. See the [MCP server](#/docs/mcp) page for the
cross-host option, and the [architecture](#/docs/architecture) for how the pieces
fit.
