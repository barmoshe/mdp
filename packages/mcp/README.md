# mdp-mcp

An MCP server for [MDP](https://github.com/barmoshe/mdp), a presentation compiler
for AI-written content. Hand it a plain `.mdp` source and it compiles a
design-locked **page**, **slide deck**, **flyer**, **report**, **one-pager**,
**memo**, or **letter** and hands back a file you can open, from any MCP-speaking
host.

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
dir), `MDP_NO_OPEN=1` (compile and serve without opening a browser). For the Slack
tool: `SLACK_BOT_TOKEN` and (optional) `MDP_SLACK_CHANNEL` — see
[Send to Slack](#send-to-slack).

## Tools

| Tool | What it does |
|---|---|
| `mdp_compile(source, form, out_dir?)` | Compile to HTML, write a file, return the absolute path. `form`: `page` \| `slides` \| `flyer` \| `report` \| `onepager` \| `memo` \| `letter` \| `all`. |
| `mdp_present(source, form?, out_dir?)` | Compile (default `slides`), serve on a loopback preview, open the browser, return the URL + path. |
| `mdp_validate(source)` | Parse and report `{ ok, meta, blocks, issues }`. Never throws. |
| `mdp_send_slack(source, form?, channel?, initial_comment?, out_dir?)` | Compile one artifact and upload the HTML to a Slack channel as a file. Requires `SLACK_BOT_TOKEN`; see [Send to Slack](#send-to-slack). |

## Resources

- `mdp://spec` — the MDP specification.
- `mdp://example/{name}` and `mdp://template/{name}`: one resource per vendored source. The server lists them from the bundled manifests.

## Send to Slack

`mdp_send_slack` compiles one artifact and uploads the self-contained `.html` to a
Slack channel as a file (via Slack's current external-upload flow). The artifact is
the real, design-locked output — opening it in a browser shows the full design, with
interactive forms working. Slack does **not** render an uploaded `.html` inline; it
shows it as a downloadable file.

It needs a Slack **bot token** (incoming webhooks cannot upload files). One-time
setup:

1. Create an app at <https://api.slack.com/apps> → *From scratch*.
2. **OAuth & Permissions** → *Bot Token Scopes* → add **`files:write`**.
3. *Install to workspace* and copy the **Bot User OAuth Token** (`xoxb-…`).
4. Invite the bot to the target channel (`/invite @your-app`) and copy the channel
   id (channel name → *View channel details* → bottom of the dialog, e.g. `C0123…`).
   The bot must be a member of the channel or Slack returns `not_in_channel`.

Then set the env in your MCP host's server config (never commit the token):

```json
{
  "mcpServers": {
    "mdp": {
      "command": "npx",
      "args": ["-y", "mdp-mcp"],
      "env": { "SLACK_BOT_TOKEN": "xoxb-…", "MDP_SLACK_CHANNEL": "C0123456789" }
    }
  }
}
```

`MDP_SLACK_CHANNEL` is the default channel; pass `channel` to override per call.
Expected failures degrade to `{ ok:false, error }` (e.g. `no_token`, `no_channel`,
`not_in_channel`, `invalid_auth`) rather than throwing.

## License

Apache-2.0. Part of the MDP monorepo: https://github.com/barmoshe/mdp
