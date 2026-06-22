import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { compile, ARTIFACTS, THEMES, THEME_SWATCHES } from "mdp-compiler";
import { EXAMPLES } from "../examples";
import { TEMPLATES } from "../templates";
import {
  currentTheme,
  withTheme,
  currentAccent,
  currentAccent2,
  withAccent,
  withAccent2,
  currentFont,
  withFont,
} from "../mdp-frontmatter";

const ARTIFACT_HINT: Record<string, string> = {
  page: "A calm scrolling document. The reading form.",
  slides: "A click-through deck. Arrow keys or space move; F is fullscreen.",
  flyer: "One composed surface. The at-a-glance form.",
  report: "A paginated long-form document: cover, contents, numbered sections.",
  onepager: "A single dense sheet. The executive leave-behind.",
  memo: "An internal memo: To / From / Date / Re over a tight column.",
  letter: "Formal correspondence: letterhead, salutation, body, sign-off.",
};

export default function Playground({
  variant = "full",
  initialId,
  initialKind,
}: {
  variant?: "full" | "embed";
  initialId?: string;
  initialKind?: string;
}) {
  const [source, setSource] = useState(() => {
    if (initialId) {
      const pool = initialKind === "template" ? TEMPLATES : EXAMPLES;
      const hit = pool.find((x) => x.id === initialId);
      if (hit) return hit.source;
    }
    return EXAMPLES[0].source;
  });
  const [artifact, setArtifact] = useState("page");
  const [debounced, setDebounced] = useState(source);
  const blobUrl = useRef<string | null>(null);

  // Keep typing smooth: the textarea updates instantly, the compile runs a
  // beat after you stop.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(source), 160);
    return () => clearTimeout(t);
  }, [source]);

  const theme = currentTheme(source);
  const accent = currentAccent(source);
  const accent2 = currentAccent2(source);
  const font = currentFont(source);

  // The starter picker merges the example probes and the fill-in templates. Ids
  // collide across the two sets (both have "release-notes"), so options are keyed
  // by "kind:id".
  const SOURCES = [
    ...EXAMPLES.map((e) => ({ key: `example:${e.id}`, label: e.label, source: e.source })),
    ...TEMPLATES.map((t) => ({ key: `template:${t.id}`, label: t.label, source: t.source })),
  ];
  const currentKey = SOURCES.find((s) => s.source === source)?.key ?? "";

  // The real engine, bundled from packages/core. Wrong input still renders, but
  // a hard parse error surfaces in the preview instead of a blank frame.
  const { html, error } = useMemo(() => {
    try {
      return { html: compile(debounced, artifact), error: null as string | null };
    } catch (e) {
      return { html: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [debounced, artifact]);

  useEffect(() => {
    return () => {
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    };
  }, []);

  function openInNewTab() {
    if (!html) return;
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    const blob = new Blob([html], { type: "text/html" });
    blobUrl.current = URL.createObjectURL(blob);
    window.open(blobUrl.current, "_blank", "noopener");
  }

  return (
    <div className={`pg pg-${variant}`} id="playground-app">
      <div className="pg-bar">
        <div className="pg-control pg-forms">
          <span>form</span>
          <div className="pg-tabs" role="tablist" aria-label="Output form">
            {ARTIFACTS.map((a) => (
              <button
                key={a}
                role="tab"
                aria-selected={artifact === a}
                className="pg-tab"
                onClick={() => setArtifact(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <label className="pg-control">
          <span>start from</span>
          <select
            className="pg-select"
            aria-label="Start from an example or template"
            value={currentKey}
            onChange={(e) => {
              const item = SOURCES.find((s) => s.key === e.target.value);
              if (item) setSource(item.source);
            }}
          >
            {!currentKey && <option value="">edited</option>}
            <optgroup label="Examples (feature demos)">
              {EXAMPLES.map((e) => (
                <option key={`example:${e.id}`} value={`example:${e.id}`}>
                  {e.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Templates (fill-in starters)">
              {TEMPLATES.map((t) => (
                <option key={`template:${t.id}`} value={`template:${t.id}`}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className="pg-spacer" />

        <div className="pg-control pg-themes" role="radiogroup" aria-label="Theme">
          <span>theme</span>
          <div className="pg-swatches">
            {THEMES.map((t) => {
              const sw = THEME_SWATCHES[t];
              const selected = theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`pg-swatch${selected ? " is-selected" : ""}`}
                  title={t}
                  aria-label={`${t} theme`}
                  onClick={() => setSource((s) => withTheme(s, t))}
                  style={
                    {
                      "--sw-fill": sw?.fill,
                      "--sw-surface": sw?.surface,
                      "--sw-text": sw?.text,
                    } as CSSProperties
                  }
                >
                  <span className="pg-swatch-dot" aria-hidden="true" />
                  <span className="pg-swatch-name">{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pg-control pg-brand">
          <span>brand</span>
          <input
            type="color"
            aria-label="Brand color (brand-accent)"
            title="Brand color: sets brand-accent; the engine derives the accent set"
            value={accent || THEME_SWATCHES[theme]?.fill || "#5b54d6"}
            onChange={(e) => setSource((s) => withAccent(s, e.target.value))}
            style={{ width: 30, height: 26, padding: 0, border: "none", background: "none", cursor: "pointer" }}
          />
          <input
            type="color"
            aria-label="Secondary brand color (brand-accent-2)"
            title="Secondary brand color: sets brand-accent-2"
            value={accent2 || THEME_SWATCHES[theme]?.text || "#e8a33d"}
            onChange={(e) => setSource((s) => withAccent2(s, e.target.value))}
            style={{ width: 30, height: 26, padding: 0, border: "none", background: "none", cursor: "pointer" }}
          />
          {(accent || accent2) && (
            <button
              type="button"
              className="btn btn-small"
              title="Clear brand colors (fall back to the theme)"
              onClick={() => setSource((s) => withAccent2(withAccent(s, ""), ""))}
            >
              clear
            </button>
          )}
          <select
            className="pg-select"
            aria-label="Brand font (brand-font)"
            title="Body font: a closed set of system stacks; the serif role is unchanged"
            value={font}
            onChange={(e) => setSource((s) => withFont(s, e.target.value))}
          >
            <option value="">font: default</option>
            <option value="serif">font: serif</option>
            <option value="mono">font: mono</option>
            <option value="rounded">font: rounded</option>
            <option value="humanist">font: humanist</option>
          </select>
        </div>

        <button className="btn btn-small" onClick={openInNewTab}>
          Open
        </button>
      </div>

      <div className="pg-body">
        <div className="pg-editor-wrap">
          <div className="pg-editor-head">source.mdp</div>
          <textarea
            className="pg-editor"
            value={source}
            spellCheck={false}
            aria-label="MDP source"
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        <div className="pg-preview">
          {error ? (
            <pre className="pg-error" role="alert">
              {error}
            </pre>
          ) : (
            <iframe
              className="pg-frame"
              title={`MDP ${artifact} preview`}
              srcDoc={html}
              allow="fullscreen"
            />
          )}
        </div>
      </div>

      <p className="pg-hint">
        Editing on the left compiles the real engine on the right. {ARTIFACT_HINT[artifact]}
      </p>
    </div>
  );
}
