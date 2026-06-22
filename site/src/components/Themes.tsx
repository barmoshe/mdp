import type { CSSProperties } from "react";
import { THEMES, THEME_SWATCHES } from "mdp-compiler";

const LOCK = [
  "No color, size, or font in the source. The author cannot style.",
  "Every theme passes WCAG AA contrast, in light and dark, gated by a test.",
  "Two fonts, two weights, one accent. Hierarchy from type and whitespace.",
  "No gradients, drop shadows, or decorative icons. Calm by construction.",
];

export default function Themes() {
  return (
    <section className="sec sec-tint" id="themes">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">The design lock</p>
          <h2 className="h2">Pick a theme, never a color</h2>
          <p className="lead">
            The author chooses from a curated spectrum of named themes; the engine
            owns every pixel of the result. That is why the output cannot drift into
            the over-decorated look.
          </p>
        </div>

        <div className="spectrum reveal">
          {THEMES.map((t) => {
            const sw = THEME_SWATCHES[t];
            return (
              <span className="spectrum-chip" key={t}>
                <span className="spectrum-dot" style={{ background: sw?.fill } as CSSProperties} />
                {t}
              </span>
            );
          })}
        </div>

        <div className="lock-grid reveal-stagger">
          {LOCK.map((l, i) => (
            <div className="lock-item" key={l} style={{ "--reveal-i": i } as CSSProperties}>
              <span className="lock-mark" aria-hidden="true">&#10003;</span>
              <p>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
