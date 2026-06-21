import { LINKS } from "../links";

export default function Hero() {
  return (
    <section className="hero wrap" id="top">
      <span className="hero-eyebrow">
        <span className="hero-dot" aria-hidden="true" />
        Markdown Presentation, open source
      </span>

      <h1>
        One source, <span className="accent">many polished artifacts.</span>
      </h1>

      <p className="hero-lead">
        MDP is a presentation compiler for AI-written content. The author writes
        meaning; the engine owns all design. The same{" "}
        <code>.mdp</code> source compiles, deterministically, into a page, a
        slide deck, and a flyer.
      </p>

      <div className="hero-actions">
        <a className="btn btn-primary" href="#/playground">
          Try the playground
        </a>
        <a className="btn" href={LINKS.repo} target="_blank" rel="noreferrer">
          View on GitHub
        </a>
        <a className="btn" href={LINKS.vision} target="_blank" rel="noreferrer">
          Read the vision
        </a>
      </div>

      <div className="hero-meta">
        <span><b>Apache-2.0</b> licensed</span>
        <span><b>Zero-dependency</b> engine</span>
        <span><b>Deterministic</b>, byte-identical output</span>
        <span>Ships as <b>Claude</b> and <b>Codex</b> plugins</span>
      </div>
    </section>
  );
}
