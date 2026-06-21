// A static, decorative "one source -> three forms" visual for the hero. It does
// NOT run the engine: it is hand-built from the same design tokens so it echoes
// the engine's real masthead language (kicker tick, Fraunces title, accent rule)
// with zero layout shift and no compile on the critical path. The live engine
// lives in the playground section below.
export default function HeroArtifacts() {
  return (
    <div className="ha" aria-hidden="true">
      <div className="ha-source">
        <div><span className="c-dim">---</span></div>
        <div><span className="c-key">theme</span>: studio</div>
        <div><span className="c-key">title</span>: <span className="c-ink">Nightly digest</span></div>
        <div><span className="c-dim">---</span></div>
        <div><span className="c-ink"># Two ways to run it</span></div>
        <div>{"{.lead}"} Same result, two paths.</div>
        <div><span className="c-dim">```mdp:flow</span></div>
        <div>Collect &rarr; Summarize &rarr; Send</div>
      </div>

      <div className="ha-caption"><span>compiles to</span></div>

      <div className="ha-frames">
        <div className="ha-frame">
          <div className="ha-kicker" />
          <div className="ha-title">Nightly digest</div>
          <div className="ha-rule" />
          <div className="ha-bar w1" />
          <div className="ha-bar w2" />
          <div className="ha-bar w3" />
          <span className="ha-frame-tag">page</span>
        </div>
        <div className="ha-frame is-slides">
          <div className="ha-kicker" />
          <div className="ha-title">Nightly digest</div>
          <div className="ha-rule" />
          <span className="ha-frame-tag">slides</span>
        </div>
        <div className="ha-frame">
          <div className="ha-kicker" />
          <div className="ha-title">Nightly digest</div>
          <div className="ha-rule" />
          <div className="ha-bar w1" />
          <div className="ha-figs">
            <span className="ha-fig" />
            <span className="ha-fig" />
            <span className="ha-fig" />
          </div>
          <span className="ha-frame-tag">flyer</span>
        </div>
      </div>
    </div>
  );
}
