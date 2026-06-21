import { useEffect } from "react";
import { DOCS, DOC_GROUPS, findDoc } from "../docs";
import { REPO } from "../links";
import Markdown from "./Markdown";

export default function Docs({ pageId }: { pageId: string }) {
  const page = findDoc(pageId);

  // New page, fresh scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pageId]);

  const idx = DOCS.findIndex((d) => d.id === page.id);
  const prev = idx > 0 ? DOCS[idx - 1] : null;
  const next = idx < DOCS.length - 1 ? DOCS[idx + 1] : null;

  return (
    <div className="wrap docs-layout">
      <aside className="docs-sidebar" aria-label="Documentation">
        <nav className="stack-lg">
          {DOC_GROUPS.map((group) => (
            <div key={group} className="docs-nav-group">
              <p className="eyebrow">{group}</p>
              <ul className="docs-nav-list">
                {DOCS.filter((d) => d.group === group).map((d) => (
                  <li key={d.id}>
                    <a
                      className="docs-nav-link"
                      aria-current={d.id === page.id ? "page" : undefined}
                      href={`#/docs/${d.id}`}
                    >
                      {d.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <article className="docs-content">
        <Markdown source={page.content} />

        <div className="docs-pager">
          {prev ? (
            <a className="docs-pager-link" href={`#/docs/${prev.id}`}>
              <span className="muted">Previous</span>
              <span>{prev.title}</span>
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a className="docs-pager-link docs-pager-next" href={`#/docs/${next.id}`}>
              <span className="muted">Next</span>
              <span>{next.title}</span>
            </a>
          )}
        </div>

        <p className="muted docs-edit">
          <a href={`${REPO}/blob/main/site/src/docs/${page.id}.md`} target="_blank" rel="noreferrer">
            Edit this page on GitHub
          </a>
        </p>
      </article>
    </div>
  );
}
