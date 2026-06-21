const STEPS = [
  {
    n: "01",
    title: "A declarative source",
    body: "Markdoc-shaped: typed tags filled with data, no arbitrary code. That is what keeps it agent-emittable, statically checkable, and safe.",
  },
  {
    n: "02",
    title: "A semantic representation",
    body: "The source parses into typed meaning: a lead, a hero stat, a quote, a call to action, a section. Intent, not layout.",
  },
  {
    n: "03",
    title: "Deterministic composition",
    body: "Each artifact is a solver, not a template. It lays the meaning out against locked design tokens and reflows, so it cannot look bad and is compiled once.",
  },
  {
    n: "04",
    title: "AI authors, the engine composes",
    body: "The AI works at authoring time. The render path is pure: the same source produces byte-identical output every time.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <div className="section-head wrap-narrow">
          <p className="eyebrow eyebrow-accent">The method</p>
          <h2 className="h2">Deterministic composition over a semantic representation</h2>
          <p className="lead">
            Not templates, and not live AI at render time. The design is locked
            in the engine, so output cannot drift into the over-decorated look.
          </p>
        </div>

        <div className="grid grid-2">
          {STEPS.map((s) => (
            <div className="card" key={s.n}>
              <div className="card-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>

        <p className="prose muted" style={{ marginTop: "var(--mdp-space-6)" }}>
          Pandoc proved one source to many outputs. Gamma proved a reflow engine
          that cannot look bad. Markdoc proved a safe declarative tree with no
          code. Each proved one leg. MDP fuses all three into a publishable
          substrate.
        </p>
      </div>
    </section>
  );
}
