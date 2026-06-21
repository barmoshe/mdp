import { useEffect, useState } from "react";
import { LINKS } from "../links";

export default function Nav({
  isDocs = false,
  active,
}: {
  isDocs?: boolean;
  active?: "playground";
}) {
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes, so following a link never
  // leaves the panel hanging open over the next view.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  // On the docs and playground pages the in-page anchors (#how, #blocks) don't
  // resolve, so those views get a minimal set with a Home link instead.
  const minimal = isDocs || active === "playground";

  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="brand" href="#top" aria-label="MDP home">
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={26} height={26} />
          <span>MDP</span>
        </a>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="nav-links"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            {open ? (
              <path d="M4 4l10 10M14 4L4 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M2 5h14M2 9h14M2 13h14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <nav id="nav-links" className={`nav-links${open ? " is-open" : ""}`} aria-label="Primary">
          {minimal ? (
            <a className="nav-link" href={active === "playground" ? "#/" : "#top"}>Home</a>
          ) : (
            <>
              <a className="nav-link" href="#how">How it works</a>
              <a className="nav-link" href="#blocks">Format</a>
              <a className="nav-link" href="#library">Examples</a>
            </>
          )}
          <a className="nav-link" href="#/docs/getting-started">Docs</a>
          <a className="nav-link" href={LINKS.repo} target="_blank" rel="noreferrer">GitHub</a>
          <a className="btn btn-primary btn-small nav-cta" href="#/playground">Playground</a>
        </nav>
      </div>
    </header>
  );
}
