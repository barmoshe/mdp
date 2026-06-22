import { useEffect, useMemo, useState } from "react";
import { compile, THEME_SWATCHES } from "mdp-compiler";
import { EXAMPLES } from "../examples";
import {
  currentTheme,
  currentAccent,
  currentAccent2,
  withAccent,
  withAccent2,
  currentFont,
  withFont,
} from "../mdp-frontmatter";

// Seed from the real brand-accent example so the demo can never drift from what
// ships, and so it opens already branded (the derivation is the point).
const SEED = EXAMPLES.find((e) => e.id === "brand-accent")?.source ?? EXAMPLES[0].source;

const FONTS = [
  { value: "", label: "font: default" },
  { value: "serif", label: "font: serif" },
  { value: "mono", label: "font: mono" },
  { value: "rounded", label: "font: rounded" },
  { value: "humanist", label: "font: humanist" },
];

export default function Brand() {
  const [source, setSource] = useState(SEED);
  const [debounced, setDebounced] = useState(SEED);

  // Recolor a beat after the last input, so dragging the picker stays smooth.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(source), 160);
    return () => clearTimeout(t);
  }, [source]);

  const theme = currentTheme(source);
  const accent = currentAccent(source);
  const accent2 = currentAccent2(source);
  const font = currentFont(source);

  // The same engine the CLI and plugins run, deriving the accent set live.
  const { html, error } = useMemo(() => {
    try {
      return { html: compile(debounced, "page"), error: null as string | null };
    } catch (e) {
      return { html: "", error: e instanceof Error ? e.message : String(e) };
    }
  }, [debounced]);

  return (
    <section className="sec sec-tint" id="brand">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">The brand layer</p>
          <h2 className="h2">One brand color in. A full accent set out, light and dark.</h2>
          <p className="lead">
            Name a brand color in the frontmatter and the engine re-lights it into a
            full accent set, every role gated to WCAG AA in light and dark, or it
            falls back to the theme. Add a second color, a logo, and a system-font
            family. You pick the inputs, never how they are used.
          </p>
        </div>

        <div className="brand-demo">
          <div className="brand-controls">
            <label className="brand-control">
              <span className="brand-control-label">brand-accent</span>
              <span className="brand-control-row">
                <input
                  type="color"
                  className="brand-color"
                  aria-label="Brand color (brand-accent)"
                  value={accent || THEME_SWATCHES[theme]?.fill || "#5b54d6"}
                  onChange={(e) => setSource((s) => withAccent(s, e.target.value))}
                />
                <code>{accent || "theme default"}</code>
              </span>
            </label>

            <label className="brand-control">
              <span className="brand-control-label">brand-accent-2</span>
              <span className="brand-control-row">
                <input
                  type="color"
                  className="brand-color"
                  aria-label="Secondary brand color (brand-accent-2)"
                  value={accent2 || THEME_SWATCHES[theme]?.text || "#e8a33d"}
                  onChange={(e) => setSource((s) => withAccent2(s, e.target.value))}
                />
                <code>{accent2 || "none"}</code>
              </span>
            </label>

            <label className="brand-control">
              <span className="brand-control-label">brand-font</span>
              <select
                className="pg-select"
                aria-label="Brand font (brand-font)"
                value={font}
                onChange={(e) => setSource((s) => withFont(s, e.target.value))}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>

            <div className="brand-control">
              <span className="brand-control-label">brand-logo</span>
              <p className="brand-control-note">
                A frontmatter slot the engine places on a locked plate, sanitized and
                legible on every theme.
              </p>
            </div>

            {(accent || accent2) && (
              <button
                type="button"
                className="btn btn-small brand-reset"
                onClick={() => setSource((s) => withAccent2(withAccent(s, ""), ""))}
              >
                Reset to theme
              </button>
            )}
          </div>

          <div className="brand-preview">
            {error ? (
              <pre className="pg-error" role="alert">{error}</pre>
            ) : (
              <iframe className="brand-frame" title="Branded MDP page preview" srcDoc={html} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
