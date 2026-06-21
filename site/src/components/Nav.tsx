import { LINKS } from "../links";

export default function Nav({ isDocs = false }: { isDocs?: boolean }) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="brand" href="#top" aria-label="MDP home">
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={24} height={24} />
          <span>MDP</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          {isDocs ? (
            <a className="nav-link" href="#top">Home</a>
          ) : (
            <>
              <a className="nav-link" href="#playground">Playground</a>
              <a className="nav-link" href="#how">How it works</a>
              <a className="nav-link" href="#blocks">Blocks</a>
            </>
          )}
          <a className="nav-link" href="#/docs/getting-started">Docs</a>
          <a className="nav-link" href={LINKS.repo} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
