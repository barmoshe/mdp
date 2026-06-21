import { LINKS } from "../links";
import HeroArtifacts from "./HeroArtifacts";

export default function Hero() {
  return (
    <section className="hero sec-rail-wide" id="top">
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span className="hero-dot" aria-hidden="true" />
            One source in. A page, a deck, and a flyer out.
          </span>

          <h1>
            AI writes the words. <span className="accent">MDP makes them look shipped.</span>
          </h1>

          <p className="hero-lead">
            MDP is a presentation compiler for AI-written content. You write the
            meaning; the engine owns the design, so the same <code>.mdp</code>{" "}
            source compiles into a page, a deck, and a flyer that all look shipped.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="#/playground">Try the playground</a>
            <span className="hero-textlinks">
              <a href={LINKS.repo} target="_blank" rel="noreferrer">GitHub</a>
              <a href={LINKS.vision} target="_blank" rel="noreferrer">Read the vision</a>
            </span>
          </div>

          <div className="hero-chips">
            <span className="chip"><b>Zero-dependency</b> engine</span>
            <span className="chip"><b>Deterministic</b> output</span>
            <span className="chip"><b>11</b> WCAG-AA themes</span>
            <span className="chip">Claude · Codex · MCP · CLI</span>
          </div>
        </div>

        <div className="hero-visual">
          <HeroArtifacts />
        </div>
      </div>
    </section>
  );
}
