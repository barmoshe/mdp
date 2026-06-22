import type { ReactNode } from "react";

// The hero showcase: a bento wall of distinct form and block examples, each a
// token-built mini-artifact. No engine on the critical path and no source code;
// each card shows a different MDP output (a chart, a deck, a comparison, stats, a
// timeline, a diagram, a poster, pricing tiers) so the panel reads as the range
// of what one source compiles into. Decorative (aria-hidden); the Forms gallery
// and the playground below run the real engine. Static, so it carries no motion
// of its own and respects prefers-reduced-motion by construction.

function Card({ tag, className = "", children }: { tag: string; className?: string; children: ReactNode }) {
  return (
    <div className={`ha-card ${className}`}>
      {children}
      <span className="ha-card-tag">{tag}</span>
    </div>
  );
}

export default function HeroArtifacts() {
  return (
    <div className="ha" aria-hidden="true">
      <div className="ha-bento">
        <Card tag="chart">
          <div className="ha-card-title">Revenue</div>
          <div className="ha-chart">
            <span style={{ height: "42%" }} />
            <span style={{ height: "61%" }} />
            <span style={{ height: "79%" }} />
            <span style={{ height: "100%" }} />
          </div>
        </Card>

        <Card tag="slides" className="ha-card-slide">
          <span className="ha-kicker" />
          <div className="ha-card-title ha-card-title-lg">Q3 review</div>
          <span className="ha-rule" />
        </Card>

        <Card tag="compare">
          <div className="ha-cmp">
            <div className="ha-cmp-col">
              <span className="ha-cmp-h">Build</span>
              <span className="ha-bar w1" />
              <span className="ha-bar w2" />
            </div>
            <div className="ha-cmp-col is-pick">
              <span className="ha-cmp-h">Buy</span>
              <span className="ha-bar w1" />
              <span className="ha-bar w2" />
            </div>
          </div>
        </Card>

        <Card tag="stats">
          <div className="ha-statrow">
            <span className="ha-stat">
              <span className="ha-stat-val">1,240</span>
              <span className="ha-stat-label">signups</span>
            </span>
            <span className="ha-stat">
              <span className="ha-stat-val">68%</span>
              <span className="ha-stat-label">active</span>
            </span>
          </div>
        </Card>

        <Card tag="timeline">
          <div className="ha-tl">
            <div className="ha-tl-row"><i /><span className="ha-bar w1" /></div>
            <div className="ha-tl-row"><i /><span className="ha-bar w2" /></div>
            <div className="ha-tl-row"><i /><span className="ha-bar w3" /></div>
          </div>
        </Card>

        <Card tag="diagram">
          <div className="ha-dg">
            <span className="ha-dg-node" />
            <span className="ha-dg-arrow" />
            <span className="ha-dg-node is-accent" />
            <span className="ha-dg-arrow" />
            <span className="ha-dg-node" />
          </div>
        </Card>

        <Card tag="flyer">
          <span className="ha-kicker" />
          <div className="ha-card-title">Launch day</div>
          <div className="ha-figs">
            <span className="ha-fig" />
            <span className="ha-fig" />
            <span className="ha-fig" />
          </div>
        </Card>

        <Card tag="pricing">
          <div className="ha-price">
            <div className="ha-price-tier">
              <span className="ha-price-amt">$0</span>
              <span className="ha-bar w2" />
            </div>
            <div className="ha-price-tier is-pick">
              <span className="ha-price-amt">$40</span>
              <span className="ha-bar w2" />
            </div>
          </div>
        </Card>
      </div>

      <div className="ha-caption"><span>forms and blocks, one source</span></div>
    </div>
  );
}
