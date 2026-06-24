import { LINKS } from "../links";

const SHIPPED = [
  { name: "Live playground", note: "The real engine, compiling in your browser." },
  { name: "MCP server", note: "mdp-mcp on npm: mdp_compile, mdp_present, and mdp_validate from any host." },
  { name: "create-mdp-extension", note: "On npm: scaffold a new block or artifact with one command." },
  { name: "Brand layer", note: "Name a brand color; the engine derives a full AA-gated accent set, light and dark, plus a logo plate and a system-font selector." },
  { name: "Examples & templates", note: "A conventioned library on one manifest." },
  { name: "Interactive forms", note: "Scroll, accordion, tabs, stepper, and plan: client-side forms over the same source, each with a no-JavaScript fallback and full keyboard navigation." },
  { name: "New blocks", note: "A typed pipe table, a pure-CSS bar chart, native zero-dependency SVG diagrams (flow, sequence, tree), a timeline, FAQ disclosures, and pricing tiers, all rendered by every form." },
];

const PLANNED = [
  { name: "More diagram kinds", note: "Gantt, state, and ER diagrams behind the same mdp:diagram syntax." },
  { name: "Schema conformance test", note: "A conformance test that pins the engine to the published JSON Schema." },
];

export default function Extend() {
  return (
    <section className="sec" id="extend">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">Extend the compiler</p>
          <h2 className="h2">A compiler you can extend, with the design lock intact</h2>
          <p className="lead">
            MDP grows in two open units: new blocks (typed content every artifact
            can render) and new artifacts (output types as new solvers over the
            same tree). Content authors write meaning; extension authors build the
            design.
          </p>
        </div>

        <div className="extend-grid reveal-stagger">
          <div>
            <p className="eyebrow eyebrow-accent">Shipped</p>
            <dl className="deflist">
              {SHIPPED.map((s) => (
                <div className="defrow" key={s.name}>
                  <dt>{s.name}</dt>
                  <dd>{s.note}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="eyebrow">Planned</p>
            <dl className="deflist">
              {PLANNED.map((p) => (
                <div className="defrow" key={p.name}>
                  <dt>{p.name}</dt>
                  <dd>{p.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="prose muted" style={{ marginTop: "var(--mdp-space-6)" }}>
          Pandoc proved one source to many outputs. Gamma proved a reflow engine
          that cannot look bad. Markdoc proved a safe declarative tree with no
          code. MDP fuses all three. Read the{" "}
          <a href={LINKS.vision} target="_blank" rel="noreferrer">vision</a>.
        </p>
      </div>
    </section>
  );
}
