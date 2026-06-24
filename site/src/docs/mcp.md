# MCP server

MDP ships as an MCP server, `mdp-mcp`, so any MCP-speaking host (Claude Desktop,
Claude Code, Cursor, Windsurf, ...) can compile MDP without leaving the tool. It
runs the same engine as the CLI and the plugins, so output is byte-identical.

## Install

No clone needed. Point your host at the published package with npx.

### Claude Code

```text
claude mcp add mdp -- npx -y mdp-mcp
```

### Claude Desktop (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "mdp": { "command": "npx", "args": ["-y", "mdp-mcp"] }
  }
}
```

Set `MDP_OUT_DIR` in the server's `env` to choose where artifacts are written; it
defaults to your OS temp dir, and the server never assumes the working directory.
Set `MDP_NO_OPEN=1` to compile and serve without auto-opening a browser. For
`mdp_send_slack`, set `SLACK_BOT_TOKEN` (a bot token with `files:write`) and,
optionally, `MDP_SLACK_CHANNEL` (the default channel id).

## Tools

- **mdp_compile(source, form, out_dir?)** — compile to HTML and write a file.
  `form` is any artifact (`page`, `slides`, `flyer`, `report`, `onepager`,
  `memo`, `letter`, `scroll`, `accordion`, `tabs`, `stepper`, `plan`), or `all`.
  Returns the absolute output path(s) and byte size. No browser. Deterministic.
- **mdp_present(source, form?, out_dir?)** — compile (default `slides`), serve it
  on a loopback (127.0.0.1) preview server, open your browser, and return the URL
  and path.
- **mdp_validate(source)** — parse and report `{ ok, meta, blocks, issues }`.
  Never errors; malformed input degrades to issues so an agent can self-correct.
- **mdp_send_slack(source, form?, channel?, initial_comment?, out_dir?)** — compile
  one artifact and upload the self-contained HTML to a Slack channel as a file.
  Requires `SLACK_BOT_TOKEN` (a bot token with `files:write`); the channel is the
  `channel` argument or `MDP_SLACK_CHANNEL`. Slack shows the `.html` as a
  downloadable file (it does not render HTML inline); opening it shows the full
  design, interactive forms included. Expected failures degrade to `{ ok, error }`.

## Resources

- **mdp://spec** — the format specification.
- **mdp://example/comparison**, **mdp://example/tidewater** — complete sources an
  agent can read to learn the grammar before authoring.

## How it delivers artifacts

Every compile writes a file and returns its absolute path, because MCP hosts do
not render rich HTML uniformly in chat. Filenames are derived from a hash of the
source (`mdp-<hash>-<form>.html`), so the same source always lands on the same
path. `mdp_present` adds a loopback preview and opens it in your browser, the most
reliable way to actually see a deck or flyer.
