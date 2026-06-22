import type { CSSProperties } from "react";

export default function Gap() {
  return (
    <section className="sec sec-tint" id="why">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">The gap</p>
          <h2 className="h2">AI writes oceans of Markdown. Then what?</h2>
          <p className="lead">
            It is clean and cheap, but it reads as a flat wall of text. Ask to
            show it nicely and you get a one-off HTML artifact: fine once, junky
            and unmaintainable the next day. If you build with AI and want
            finished-looking output without hand-building it, that gap is the
            whole problem.
          </p>
        </div>

        <div className="gap-grid reveal-stagger">
          <div className="card gap-card" style={{ "--reveal-i": 0 } as CSSProperties}>
            <h3 className="gap-label">Plain Markdown</h3>
            <p>Diffable and honest, but flat. A wall of text with no hierarchy and nothing to present.</p>
          </div>
          <div className="card gap-card" style={{ "--reveal-i": 1 } as CSSProperties}>
            <h3 className="gap-label">The one-off artifact</h3>
            <p>Hand-built HTML that over-decorates, drifts, and rots. Beautiful for a day, junky by the next.</p>
          </div>
          <div className="card gap-card is-win" style={{ "--reveal-i": 2 } as CSSProperties}>
            <h3 className="gap-label">MDP</h3>
            <p>You write meaning. The engine owns all design, so the output cannot look junky, and one source becomes many forms.</p>
          </div>
        </div>

        <p className="gap-closer">
          A markdown viewer gives you one rendering. <b>MDP gives you a compiler.</b>
        </p>
      </div>
    </section>
  );
}
