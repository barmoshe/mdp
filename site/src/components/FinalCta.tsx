import { LINKS } from "../links";

export default function FinalCta() {
  return (
    <section className="sec sec-tint cta" id="start">
      <div className="sec-rail">
        <p className="eyebrow eyebrow-accent">Try it</p>
        <h2>Write it once. Ship the page, the deck, and the flyer.</h2>
        <div className="cta-actions">
          <a className="btn btn-primary" href="#/playground">Open the playground</a>
          <a className="btn" href={LINKS.repo} target="_blank" rel="noreferrer">View on GitHub</a>
        </div>
      </div>
    </section>
  );
}
