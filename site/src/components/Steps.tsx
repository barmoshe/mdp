import type { CSSProperties } from "react";

const STEPS = [
  {
    n: "01",
    title: "Write the meaning",
    body: "A person or an agent writes a declarative .mdp source: typed elements filled with content. No styling, no code, nothing to position.",
  },
  {
    n: "02",
    title: "The engine compiles",
    body: "MDP parses the source into typed meaning and composes it against locked design tokens. Deterministic and byte-identical every run.",
  },
  {
    n: "03",
    title: "Compile to any form",
    body: "The same source becomes a page, a deck, a flyer, a report, a one-pager, a memo, or a letter, each laid out by its own solver. None of them can look junky.",
  },
];

export default function Steps() {
  return (
    <section className="sec" id="how">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">How it works</p>
          <h2 className="h2">Write meaning. Compile. Ship the form you need.</h2>
        </div>

        <div className="steps reveal-stagger">
          {STEPS.map((s, i) => (
            <div className="step" key={s.n} style={{ "--reveal-i": i } as CSSProperties}>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
