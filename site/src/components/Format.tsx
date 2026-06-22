import { LINKS } from "../links";

const CATEGORIES = [
  {
    name: "Text & quotes",
    blocks: [
      { name: "{.lead} / {.cite}", desc: "A standfirst under the title, and an attribution line under a quote." },
      { name: "> pull quote", desc: "A blockquote becomes a serif pull quote, with an optional {.cite} line." },
    ],
  },
  {
    name: "Data & diagrams",
    blocks: [
      { name: "mdp:stats", desc: "Key and value figures. A table on a page, a figure band in slides and flyer." },
      { name: "mdp:compare", desc: "Options side by side, each with a badge, a note, pros, and a call-to-action." },
      { name: "mdp:flow", desc: "An a -> b -> c pipeline, rendered as bordered chips joined by an arrow." },
    ],
  },
  {
    name: "Callouts & layout",
    blocks: [
      { name: ":::callout", desc: "A bordered aside: note, tip, cost, recommendation, or warning." },
      { name: "---", desc: "A section break: a divider on a page, a slide break in slides, a panel on a flyer." },
      { name: "lang / dir", desc: "Set dir: rtl in the frontmatter and the whole layout flips. You position nothing." },
    ],
  },
];

export default function Format() {
  return (
    <section className="sec" id="blocks">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">The format</p>
          <h2 className="h2">Plain Markdown, plus a few typed elements</h2>
          <p className="lead">
            Any valid MDP file is also readable as ordinary Markdown, with no
            color, size, or font in the source. Beyond Markdown, MDP adds typed
            elements in three groups. The design lives in the engine.
          </p>
        </div>

        <div className="format-grid">
          <pre className="codeblock" aria-label="An MDP source example">
{`---
`}<span className="c-key">mdp</span>{`: 1
`}<span className="c-key">theme</span>{`: studio
`}<span className="c-key">forms</span>{`: [page, slides, flyer]
`}<span className="c-key">title</span>{`: Two ways to run the digest
---

`}<span className="c-dim"># Two ways to run the digest</span>{`
{.lead} Both paths reach the same result.

`}<span className="c-dim">{'```'}mdp:flow</span>{`
Collect data -> Summarize -> Send one message
`}<span className="c-dim">{'```'}</span>{`

:::callout recommendation
Start self-hosted, move later if you prefer.
:::`}
          </pre>

          <div className="format-cats reveal-stagger">
            {CATEGORIES.map((cat) => (
              <div className="format-cat" key={cat.name}>
                <p className="eyebrow eyebrow-accent">{cat.name}</p>
                <dl className="deflist">
                  {cat.blocks.map((b) => (
                    <div className="defrow" key={b.name}>
                      <dt>{b.name}</dt>
                      <dd>{b.desc}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>

        <p className="prose" style={{ marginTop: "var(--mdp-space-6)" }}>
          An unknown directive degrades to readable text, never a blank or black
          screen. See the full grammar in the{" "}
          <a href={LINKS.spec} target="_blank" rel="noreferrer">spec</a>.
        </p>
      </div>
    </section>
  );
}
