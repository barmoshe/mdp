import { useEffect, useState } from "react";

// The hero's "one source -> many forms" visual. It does NOT run the engine: it is
// hand-built from the same design tokens so it echoes the engine's real masthead
// language (kicker tick, Fraunces title, accent rule) with no compile on the
// critical path. A single .mdp source sits on top; below, a layered preview stage
// cycles a representative span of forms so the panel shows the core promise live.
// Decorative (aria-hidden); the Forms gallery below enumerates the full set. The
// live engine lives in the playground section. Motion is compositor-only (opacity
// + transform) and disabled under prefers-reduced-motion.

const CYCLE = ["page", "slides", "flyer", "report", "scroll"] as const;
type FormId = (typeof CYCLE)[number];

// One token-built mini-layout per form, distinct enough that the cross-fade reads
// as the same source becoming a different shape. Reuses the same primitives as the
// Forms gallery thumbs, so the hero and the gallery speak one visual language.
function Preview({ id }: { id: FormId }) {
  if (id === "slides") {
    return (
      <div className="ha-pv-body is-center">
        <span className="ha-kicker" />
        <div className="ha-title ha-title-lg">Nightly digest</div>
        <span className="ha-rule" />
      </div>
    );
  }
  if (id === "flyer") {
    return (
      <div className="ha-pv-body">
        <span className="ha-kicker" />
        <div className="ha-title">Nightly digest</div>
        <span className="ha-rule" />
        <div className="ha-figs">
          <span className="ha-fig" />
          <span className="ha-fig" />
          <span className="ha-fig" />
        </div>
      </div>
    );
  }
  if (id === "report") {
    return (
      <div className="ha-pv-body">
        <span className="ha-kicker" />
        <div className="ha-title">Nightly digest</div>
        <span className="ha-rule" />
        <div className="ha-toc">
          <span className="ha-toc-row"><i />
            <span className="ha-bar w2" />
          </span>
          <span className="ha-toc-row"><i />
            <span className="ha-bar w3" />
          </span>
          <span className="ha-toc-row"><i />
            <span className="ha-bar w2" />
          </span>
        </div>
      </div>
    );
  }
  if (id === "scroll") {
    return (
      <div className="ha-pv-body has-rail">
        <span className="ha-prog"><span /></span>
        <span className="ha-kicker" />
        <div className="ha-title">Nightly digest</div>
        <span className="ha-bar w1" />
        <span className="ha-bar w2" />
        <span className="ha-rail" aria-hidden="true">
          <i className="is-on" />
          <i />
          <i />
        </span>
      </div>
    );
  }
  return (
    <div className="ha-pv-body">
      <span className="ha-kicker" />
      <div className="ha-title">Nightly digest</div>
      <span className="ha-rule" />
      <span className="ha-bar w1" />
      <span className="ha-bar w2" />
      <span className="ha-bar w3" />
    </div>
  );
}

export default function HeroArtifacts() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reduce?.matches) return;
    const t = window.setInterval(() => {
      setActive((n) => (n + 1) % CYCLE.length);
    }, 2200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="ha" aria-hidden="true">
      <div className="ha-source">
        <div><span className="c-dim">---</span></div>
        <div><span className="c-key">mdp</span>: 1</div>
        <div><span className="c-key">theme</span>: studio</div>
        <div><span className="c-key">forms</span>: <span className="c-accent">[page, slides, flyer, report, scroll]</span></div>
        <div><span className="c-key">title</span>: <span className="c-ink">Nightly digest</span></div>
        <div><span className="c-dim">---</span></div>
        <div><span className="c-ink"># Two ways to run it</span></div>
        <div>{"{.lead}"} Same result, two paths.</div>
      </div>

      <div className="ha-compile" aria-hidden="true">
        <span className="ha-compile-rule" />
        <span className="ha-compile-tag">compiles to</span>
        <span className="ha-compile-rule" />
      </div>

      <div className="ha-stage">
        <span className="ha-stage-back two" aria-hidden="true" />
        <span className="ha-stage-back one" aria-hidden="true" />
        <div className="ha-screen">
          {CYCLE.map((f, n) => (
            <div className={`ha-pv${n === active ? " is-on" : ""}`} key={f}>
              <Preview id={f} />
              <span className="ha-screen-tag">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ha-caption"><span>one source, many forms</span></div>
    </div>
  );
}
