export default function Pitch() {
  return (
    <section className="section" id="why">
      <div className="wrap">
        <div className="section-head wrap-narrow">
          <p className="eyebrow eyebrow-accent">Why MDP</p>
          <h2 className="h2">AI writes oceans of Markdown. Then what?</h2>
          <p className="lead">
            It is clean and cheap, but it reads as a flat wall of text. Ask to
            show it nicely and you get a one-off HTML artifact that looks fine
            once and is junky and unmaintainable the next day.
          </p>
        </div>

        <div className="grid grid-3">
          <div className="card">
            <h3>Plain Markdown</h3>
            <p>
              Diffable and honest, but flat. A wall of text with no hierarchy and
              nothing to present.
            </p>
          </div>
          <div className="card">
            <h3>The one-off artifact</h3>
            <p>
              Hand-built HTML that over-decorates, drifts, and rots. Beautiful for
              a day, junky by the next.
            </p>
          </div>
          <div className="card" style={{ borderColor: "var(--mdp-accent-border)" }}>
            <h3 style={{ color: "var(--mdp-accent-text)" }}>MDP</h3>
            <p>
              The author writes meaning. The engine owns all design, so the output
              cannot look junky, and one source becomes many forms.
            </p>
          </div>
        </div>

        <p className="lead wrap-narrow" style={{ marginTop: "var(--mdp-space-7)" }}>
          A markdown viewer gives you one rendering.{" "}
          <span style={{ color: "var(--mdp-accent-text)" }}>MDP gives you a compiler.</span>
        </p>
      </div>
    </section>
  );
}
