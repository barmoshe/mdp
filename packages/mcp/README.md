# mdp-mcp

An MCP server for [MDP](https://github.com/barmoshe/mdp), a presentation compiler
for AI-written content. Hand it a plain `.mdp` source and it compiles a
design-locked **page**, **slide deck**, or **flyer** and hands back a file you can
open, from any MCP-speaking host.

The author writes meaning; the engine owns all design. Output is deterministic
(byte-identical for the same source). The only design knobs are a named `theme:`
and an optional `brand-logo:` mark the engine places in the masthead.

## Install

```text
claude mcp add mdp -- npx -y mdp-mcp
```

Or in a host config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mdp": { "command": "npx", "args": ["-y", "mdp-mcp"] }
  }
}
```

Optional env: `MDP_OUT_DIR` (where artifacts are written; defaults to the OS temp
dir), `MDP_NO_OPEN=1` (compile and serve without opening a browser).

## Tools

| Tool | What it does |
|---|---|
| `mdp_compile(source, form, out_dir?)` | Compile to HTML, write a file, return the absolute path. `form`: `page` \| `slides` \| `flyer` \| `all`. |
| `mdp_present(source, form?, out_dir?)` | Compile (default `slides`), serve on a loopback preview, open the browser, return the URL + path. |
| `mdp_validate(source)` | Parse and report `{ ok, meta, blocks, issues }`. Never throws. |

## Resources

- `mdp://spec` — the MDP specification.
- `mdp://example/{name}` and `mdp://template/{name}`: one resource per vendored source. The server lists them from the bundled manifests.

## License

Apache-2.0. Part of the MDP monorepo: https://github.com/barmoshe/mdp
