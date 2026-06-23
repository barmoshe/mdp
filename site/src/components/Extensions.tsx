import { useMemo, useState } from "react";
import { baseStyle, parse } from "mdp-compiler";
import { renderStatus, STATUS_STYLE } from "mdp-block-status";
import { renderSpecSheet, parseSpecSheet, SPEC_SHEET_STYLE } from "mdp-block-spec-sheet";
import { renderResume } from "mdp-artifact-resume";
import { LINKS } from "../links";

const REPO_EXT = `${LINKS.repo}/tree/main/extensions`;

// Wrap a block fragment as a complete HTML document for the preview iframe, using
// the engine's real exported baseStyle plus the block's own exported STYLE. This is
// the same composition a compiled document uses, so the preview is honest, not a
// reimplementation.
function buildFragmentDoc(theme: string, style: string, fragment: string): string {
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<style>${baseStyle(theme)}${style}` +
    `body{margin:0;padding:1.25rem;background:var(--mdp-bg);}</style></head>` +
    `<body>${fragment}</body></html>`
  );
}

// Static samples for the two blocks (the fence is what an author writes; the IR is
// what the host parses it into).
const STATUS_FENCE = "```mdp:status\nShipped: solid\nIn review: accent\nPlanned\n```";
const STATUS_DOC = buildFragmentDoc(
  "studio",
  STATUS_STYLE,
  renderStatus({
    type: "status",
    items: [
      { label: "Shipped", tone: "solid" },
      { label: "In review", tone: "accent" },
      { label: "Planned", tone: "default" },
    ],
  })
);

const SPEC_BODY = "title: Tidewater 12\nDisplay: 6.1 inch OLED\nWeight: 184 g\nBattery: 3200 mAh";
const SPEC_FENCE = "```mdp:spec-sheet\n" + SPEC_BODY + "\n```";
const SPEC_DOC = buildFragmentDoc(
  "studio",
  SPEC_SHEET_STYLE,
  renderSpecSheet(parseSpecSheet(SPEC_BODY))
);

// The artifact mini-playground starts from a small, real source.
const RESUME_SRC = `---
mdp: 1
theme: studio
title: Ada Lovelace
---

# Ada Lovelace
{.lead} Analyst and writer on the reach of computing. London.

## Experience
- Wrote the notes on the Analytical Engine, including the first published algorithm.
- Translated and extended Menabrea's memoir on the engine.

## Writing
Essays arguing the engine could go beyond pure calculation.`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="lib-copy"
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

export default function Extensions() {
  const [resumeSrc, setResumeSrc] = useState(RESUME_SRC);
  const resumeDoc = useMemo(() => {
    try {
      return renderResume(parse(resumeSrc));
    } catch {
      return '<!doctype html><html><body style="font-family:system-ui;padding:1rem">Could not parse this source.</body></html>';
    }
  }, [resumeSrc]);

  return (
    <section className="sec" id="extensions">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">Extension examples</p>
          <h2 className="h2">Real extensions you can read, run, and copy</h2>
          <p className="lead">
            Blocks add typed content every form can render; artifacts are whole new
            output types. These are real, self-contained packages that follow the
            naming and keyword convention. Each preview below is the actual module
            running, on the same engine the playground uses.
          </p>
        </div>

        <div className="ext-grid reveal-stagger">
          <div className="lib-card ext-card">
            <div className="lib-card-top">
              <h4>mdp-block-status</h4>
              <span className="lib-badge">block</span>
            </div>
            <p>Inline status pills, with token-only tones (default, accent, solid).</p>
            <iframe
              className="ext-preview"
              srcDoc={STATUS_DOC}
              title="mdp-block-status preview"
              loading="lazy"
            />
            <div className="lib-actions">
              <CopyButton text={STATUS_FENCE} label="Copy fence" />
              <a href={`${REPO_EXT}/mdp-block-status`} target="_blank" rel="noreferrer">View source</a>
              <a href="https://www.npmjs.com/package/mdp-block-status" target="_blank" rel="noreferrer">npm</a>
            </div>
          </div>

          <div className="lib-card ext-card">
            <div className="lib-card-top">
              <h4>mdp-block-spec-sheet</h4>
              <span className="lib-badge">block</span>
            </div>
            <p>A titled key/value spec sheet, as a two-column definition list.</p>
            <iframe
              className="ext-preview"
              srcDoc={SPEC_DOC}
              title="mdp-block-spec-sheet preview"
              loading="lazy"
            />
            <div className="lib-actions">
              <CopyButton text={SPEC_FENCE} label="Copy fence" />
              <a href={`${REPO_EXT}/mdp-block-spec-sheet`} target="_blank" rel="noreferrer">View source</a>
            </div>
          </div>

          <div className="lib-card ext-card ext-card-wide">
            <div className="lib-card-top">
              <h4>mdp-artifact-resume</h4>
              <span className="lib-badge">artifact</span>
            </div>
            <p>
              A resume output type: a solver over the whole source. Edit the source and
              the preview recompiles, the same parse plus render the CLI runs.
            </p>
            <div className="ext-mini">
              <textarea
                className="ext-src"
                value={resumeSrc}
                onChange={(e) => setResumeSrc(e.target.value)}
                spellCheck={false}
                aria-label="MDP source for the resume artifact"
              />
              <iframe className="ext-preview" srcDoc={resumeDoc} title="mdp-artifact-resume preview" />
            </div>
            <div className="lib-actions">
              <CopyButton text={resumeSrc} label="Copy source" />
              <a href={`${REPO_EXT}/mdp-artifact-resume`} target="_blank" rel="noreferrer">View source</a>
            </div>
          </div>
        </div>

        <p className="prose muted" style={{ marginTop: "var(--mdp-space-6)" }}>
          Want to build one? The <a href="#/docs/extensions">Build an extension</a> guide
          walks the whole path, and <code>npm create mdp-extension</code> scaffolds a
          working starter in one command.
        </p>
      </div>
    </section>
  );
}
