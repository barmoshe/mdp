import { LINKS } from "../links";

const BLOCKS = [
  { name: "{.lead} / {.cite}", desc: "A standfirst under the title, and an attribution line under a quote." },
  { name: "mdp:stats", desc: "Key and value figures. A table on a page, a figure band in slides and flyer." },
  { name: "mdp:compare", desc: "Options side by side, each with a badge, a note, pros, and a call-to-action button." },
  { name: "mdp:flow", desc: "An a -> b -> c pipeline, rendered as bordered chips joined by an arrow." },
  { name: ":::callout", desc: "A bordered aside: note, tip, cost, recommendation, or warning." },
  { name: "---", desc: "A section break: a divider on a page, a slide break in slides, a panel on a flyer." },
  { name: "lang / dir", desc: "Set dir: rtl in the frontmatter and the whole layout flips. The author positions nothing." },
];

export default function Blocks() {
  return (
    <section className="section" id="blocks">
      <div className="wrap">
        <div className="section-head wrap-narrow">
          <p className="eyebrow eyebrow-accent">The format</p>
          <h2 className="h2">Plain Markdown, plus a small closed set of blocks</h2>
          <p className="lead">
            Any valid MDP file is also readable as ordinary Markdown. There is no
            color, size, or font anywhere in the source. The design lives in the
            engine.
          </p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--mdp-space-7)" }}>
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

          <dl className="deflist">
            {BLOCKS.map((b) => (
              <div className="defrow" key={b.name}>
                <dt>{b.name}</dt>
                <dd>{b.desc}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="prose" style={{ marginTop: "var(--mdp-space-6)" }}>
          Wrong input still renders: an unknown directive degrades to readable
          text, never a blank or black screen. See the full grammar in the{" "}
          <a href={LINKS.spec} target="_blank" rel="noreferrer">spec</a>.
        </p>
      </div>
    </section>
  );
}
