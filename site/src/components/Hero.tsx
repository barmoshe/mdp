import type { CSSProperties } from "react";
import { LINKS } from "../links";
import HeroArtifacts from "./HeroArtifacts";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true" />
      <div className="sec-rail-wide">
        <div className="hero-grid">
          <div className="hero-copy reveal-stagger">
            <span className="hero-eyebrow" style={{ "--reveal-i": 0 } as CSSProperties}>
              <span className="hero-dot" aria-hidden="true" />
              One source in. Many finished forms out.
            </span>

            <h1 style={{ "--reveal-i": 1 } as CSSProperties}>
              AI writes the words. <span className="accent">MDP makes them look shipped.</span>
            </h1>

            <p className="hero-lead" style={{ "--reveal-i": 2 } as CSSProperties}>
              MDP is a presentation compiler for AI-written content. You write the
              meaning; the engine owns the design. One <code>.mdp</code> source
              compiles into a page, a deck, a flyer, a report, a one-pager, a memo,
              or a letter, and every one looks shipped.
            </p>

            <div className="hero-actions" style={{ "--reveal-i": 3 } as CSSProperties}>
              <a className="btn btn-primary" href="#/playground">Try the playground</a>
              <span className="hero-textlinks">
                <a href={LINKS.repo} target="_blank" rel="noreferrer">GitHub</a>
                <a href={LINKS.vision} target="_blank" rel="noreferrer">Read the vision</a>
              </span>
            </div>

            <div className="hero-chips" style={{ "--reveal-i": 4 } as CSSProperties}>
              <span className="chip"><b>Zero-dependency</b> engine</span>
              <span className="chip"><b>Deterministic</b> output</span>
              <span className="chip"><b>WCAG-AA</b> themes, light and dark</span>
              <span className="chip">Claude · Codex · MCP · CLI</span>
            </div>
          </div>

          <div className="hero-visual reveal">
            <HeroArtifacts />
          </div>
        </div>
      </div>
    </section>
  );
}
