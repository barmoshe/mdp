export default function Tools() {
  return (
    <section className="section" id="tools">
      <div className="wrap">
        <div className="section-head wrap-narrow">
          <p className="eyebrow eyebrow-accent">Where it reaches you</p>
          <h2 className="h2">Not an app to visit. A capability inside your agent.</h2>
          <p className="lead">
            MDP ships as plugins and an MCP server, so you go from content to a polished artifact
            without leaving your editor. Ask in plain language; the agent authors
            clean MDP, compiles it, and opens the result.
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))" }}>
          <div className="card">
            <h3>Claude Code</h3>
            <p style={{ marginBottom: "var(--mdp-space-4)" }}>
              This repo is the marketplace. Install, then just ask.
            </p>
            <pre className="codeblock">
{`/plugin marketplace add barmoshe/mdp
/plugin install mdp@mdp`}
            </pre>
            <p style={{ marginTop: "var(--mdp-space-3)" }}>
              Then “show this as a deck”, or <code>/mdp present &lt;file&gt;</code>.
            </p>
          </div>

          <div className="card">
            <h3>Codex</h3>
            <p style={{ marginBottom: "var(--mdp-space-4)" }}>
              A self-contained Codex plugin, with the engine vendored in.
            </p>
            <pre className="codeblock">
{`codex marketplace add barmoshe/mdp`}
            </pre>
            <p style={{ marginTop: "var(--mdp-space-3)" }}>
              Enable MDP from the Codex app, then “make a one-pager from this
              file”.
            </p>
          </div>

          <div className="card">
            <h3>Any MCP host</h3>
            <p style={{ marginBottom: "var(--mdp-space-4)" }}>
              An MCP server for Claude Desktop, Cursor, and any MCP host.
            </p>
            <pre className="codeblock">
{`claude mcp add mdp -- npx -y mdp-mcp`}
            </pre>
            <p style={{ marginTop: "var(--mdp-space-3)" }}>
              Exposes <code>mdp_compile</code>, <code>mdp_present</code>, and{" "}
              <code>mdp_validate</code>.
            </p>
          </div>

          <div className="card">
            <h3>Command line</h3>
            <p style={{ marginBottom: "var(--mdp-space-4)" }}>
              Zero dependencies. Plain Node ESM, Node 18 or newer.
            </p>
            <pre className="codeblock">
{`node packages/core/build.mjs \\
  examples/comparison.mdp --open slides`}
            </pre>
            <p style={{ marginTop: "var(--mdp-space-3)" }}>
              Writes <code>page.html</code>, <code>slides.html</code>, and{" "}
              <code>flyer.html</code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
