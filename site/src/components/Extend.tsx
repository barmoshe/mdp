import { LINKS } from "../links";

const SHIPPED = [
  { name: "Live playground", note: "The real engine, compiling in your browser." },
  { name: "MCP server", note: "mdp_compile, mdp_present, and mdp_validate from any host." },
  { name: "Brand logo", note: "A frontmatter slot the engine places, sanitized and locked." },
  { name: "Examples & templates", note: "A conventioned library on one manifest." },
];

const PLANNED = [
  { name: "mdp:chart", note: "A typed chart block every artifact can render." },
  { name: "create-mdp-extension", note: "A scaffolder for new blocks and new artifacts." },
  { name: "Schema conformance", note: "A JSON Schema and a conformance test for the format." },
];

export default function Extend() {
  return (
    <section className="sec" id="extend">
      <div className="sec-rail-wide">
        <div className="masthead">
          <p className="eyebrow eyebrow-accent">Extend the compiler</p>
          <h2 className="h2">A compiler you can extend, with the design lock intact</h2>
          <p className="lead">
            MDP grows in two open units: new blocks (typed content every artifact
            can render) and new artifacts (output types as new solvers over the
            same tree). Content authors write meaning; extension authors build the
            design.
          </p>
        </div>

        <div className="extend-grid">
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
