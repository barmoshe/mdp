import { LINKS } from "../links";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-note stack">
          <a className="brand" href="#top" aria-label="MDP home">
            <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={24} height={24} />
            <span>MDP</span>
          </a>
          <p className="muted">
            Markdown Presentation. A presentation compiler for AI-written
            content. This site is built with the MDP engine itself.
          </p>
          <p className="muted">Apache-2.0. Built by Bar Moshe.</p>
        </div>

        <div className="footer-links" aria-label="Repository">
          <strong style={{ color: "var(--mdp-ink)", fontWeight: 500 }}>Project</strong>
          <a href={LINKS.repo} target="_blank" rel="noreferrer">GitHub</a>
          <a href={LINKS.vision} target="_blank" rel="noreferrer">Vision</a>
          <a href={LINKS.spec} target="_blank" rel="noreferrer">Spec</a>
          <a href={LINKS.changelog} target="_blank" rel="noreferrer">Changelog</a>
        </div>

        <div className="footer-links" aria-label="Get involved">
          <strong style={{ color: "var(--mdp-ink)", fontWeight: 500 }}>Build</strong>
          <a href={LINKS.examples} target="_blank" rel="noreferrer">Examples</a>
          <a href={LINKS.contributing} target="_blank" rel="noreferrer">Contributing</a>
          <a href={LINKS.issues} target="_blank" rel="noreferrer">Issues</a>
          <a href={LINKS.license} target="_blank" rel="noreferrer">License</a>
        </div>
      </div>
    </footer>
  );
}
