import { LINKS } from "../links";

const ITEMS = [
  { label: "Live playground", state: "done", note: "Source on the left, the artifacts on the right. You are using it." },
  { label: "mdp:chart block", state: "next", note: "A typed chart block every artifact can render." },
  { label: "create-mdp-extension", state: "next", note: "A scaffolder for new blocks and new artifacts." },
  { label: "MCP server", state: "next", note: "So an agent can emit MDP from inside the tools you already use." },
  { label: "Schema conformance", state: "next", note: "A JSON Schema and a conformance test for the format." },
];

export default function Roadmap() {
  return (
    <section className="section" id="roadmap">
      <div className="wrap">
        <div className="section-head wrap-narrow">
          <p className="eyebrow eyebrow-accent">Status and roadmap</p>
          <h2 className="h2">Early and honest</h2>
          <p className="lead">
            A working engine that proves the core claim: one source composes
            deterministically into three clean artifacts. The format and the
            block grammar will move before 1.0. Issues and ideas are welcome.
          </p>
        </div>

        <div className="grid grid-2">
          {ITEMS.map((it) => (
            <div className="card" key={it.label}>
              <span className="pill" style={it.state === "done" ? { borderColor: "var(--mdp-accent-border)", color: "var(--mdp-accent-text)" } : undefined}>
                <span className="pill-dot" aria-hidden="true" />
                {it.state === "done" ? "Shipped" : "Planned"}
              </span>
              <h3 style={{ marginTop: "var(--mdp-space-3)" }}>{it.label}</h3>
              <p>{it.note}</p>
            </div>
          ))}
        </div>

        <p className="prose" style={{ marginTop: "var(--mdp-space-6)" }}>
          The substrate is extensible in two units, both with the design lock
          intact: <b>blocks</b> (new typed content rendered across every artifact)
          and <b>artifacts</b> (new output types as new solvers over the same
          tree). Read the full picture in the{" "}
          <a href={LINKS.vision} target="_blank" rel="noreferrer">vision</a>.
        </p>
      </div>
    </section>
  );
}
