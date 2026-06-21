import type { ReactNode } from "react";

type Channel = { name: string; body: string; cmd: string; foot: ReactNode };

const CHANNELS: Channel[] = [
  {
    name: "Claude Code",
    body: "This repo is the marketplace. Install, then just ask.",
    cmd: "/plugin marketplace add barmoshe/mdp\n/plugin install mdp@mdp",
    foot: <>Then "show this as a deck", or <code>/mdp present &lt;file&gt;</code>.</>,
  },
  {
    name: "Codex",
    body: "A self-contained Codex plugin, with the engine vendored in.",
    cmd: "codex marketplace add barmoshe/mdp",
    foot: <>Enable MDP in the Codex app, then "make a one-pager from this file".</>,
  },
  {
    name: "Any MCP host",
    body: "An MCP server for Claude Desktop, Cursor, and any MCP host.",
    cmd: "claude mcp add mdp -- npx -y mdp-mcp",
    foot: <>Exposes <code>mdp_compile</code>, <code>mdp_present</code>, and <code>mdp_validate</code>.</>,
  },
  {
    name: "Command line",
    body: "Zero dependencies. Plain Node ESM, Node 18 or newer.",
    cmd: "node packages/core/build.mjs \\\n  examples/block-compare.mdp --open slides",
    foot: <>Writes <code>page.html</code>, <code>slides.html</code>, and <code>flyer.html</code>.</>,
  },
];

export default function Install() {
  return (
    <section className="sec" id="install">
      <div className="sec-rail-wide">
        <div className="masthead">
          <p className="eyebrow eyebrow-accent">Where it reaches you</p>
          <h2 className="h2">Not an app to visit. A capability inside your agent.</h2>
          <p className="lead">
            MDP ships as plugins, an MCP server, and a CLI, so you go from content
            to a polished artifact without leaving your editor. Ask in plain
            language; the agent authors clean MDP, compiles it, and opens the result.
          </p>
        </div>

        <div className="install-grid">
          {CHANNELS.map((c) => (
            <div className="card install-card" key={c.name}>
              <h3>{c.name}</h3>
              <p>{c.body}</p>
              <pre className="install-cmd">{c.cmd}</pre>
              <p className="muted">{c.foot}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
