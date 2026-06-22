import type { CSSProperties } from "react";

// The form set is a data array, so the gallery grows when a form is added and the
// prose never states a count. Each card is a token-built preview (no engine on
// the critical path); "See it live" opens the real compiler in the playground.
type FormId =
  | "page"
  | "slides"
  | "flyer"
  | "report"
  | "onepager"
  | "memo"
  | "letter"
  | "scroll"
  | "accordion"
  | "tabs"
  | "stepper";

const FORMS: { id: FormId; label: string; line: string }[] = [
  { id: "page", label: "Page", line: "A calm scrolling document. The reading form." },
  { id: "slides", label: "Slides", line: "A click-through deck. The presenting form." },
  { id: "flyer", label: "Flyer", line: "One composed surface. The at-a-glance form." },
  { id: "report", label: "Report", line: "A paginated long-form: cover, contents, numbered sections." },
  { id: "onepager", label: "One-pager", line: "A single dense sheet. The executive leave-behind." },
  { id: "memo", label: "Memo", line: "To, From, Date, and Re over a tight column." },
  { id: "letter", label: "Letter", line: "Letterhead, salutation, body, and sign-off." },
  { id: "scroll", label: "Scroll story", line: "A scroll-driven narrative that reveals as you read." },
  { id: "accordion", label: "Accordion", line: "Collapsible sections to scan and open on demand." },
  { id: "tabs", label: "Tabs", line: "A tabbed explorer for lateral, jump-anywhere reading." },
  { id: "stepper", label: "Stepper", line: "A guided walkthrough, one numbered step at a time." },
];

function Thumb({ id }: { id: FormId }) {
  if (id === "slides") {
    return (
      <div className="ha-frame is-slides" aria-hidden="true">
        <div className="ha-kicker" />
        <div className="ha-title">Nightly digest</div>
        <div className="ha-rule" />
      </div>
    );
  }
  if (id === "flyer" || id === "onepager") {
    return (
      <div className="ha-frame" aria-hidden="true">
        <div className="ha-kicker" />
        <div className="ha-title">Nightly digest</div>
        <div className="ha-rule" />
        <div className="ha-figs">
          <span className="ha-fig" />
          <span className="ha-fig" />
          <span className="ha-fig" />
        </div>
      </div>
    );
  }
  if (id === "tabs") {
    return (
      <div className="ha-frame" aria-hidden="true">
        <div className="ha-tabs">
          <span className="ha-tab is-on" />
          <span className="ha-tab" />
          <span className="ha-tab" />
        </div>
        <div className="ha-title">Nightly digest</div>
        <div className="ha-bar w1" />
        <div className="ha-bar w2" />
      </div>
    );
  }
  if (id === "stepper") {
    return (
      <div className="ha-frame" aria-hidden="true">
        <div className="ha-steps">
          <span className="ha-step is-on" />
          <span className="ha-step" />
          <span className="ha-step" />
        </div>
        <div className="ha-title">Nightly digest</div>
        <div className="ha-bar w1" />
        <div className="ha-bar w2" />
      </div>
    );
  }
  if (id === "scroll") {
    return (
      <div className="ha-frame" aria-hidden="true">
        <div className="ha-kicker" />
        <div className="ha-title">Nightly digest</div>
        <div className="ha-prog">
          <span />
        </div>
        <div className="ha-bar w1" />
        <div className="ha-bar w2" />
        <div className="ha-bar w3" />
      </div>
    );
  }
  if (id === "accordion") {
    return (
      <div className="ha-frame" aria-hidden="true">
        <div className="ha-title">Nightly digest</div>
        <div className="ha-acc-row is-open">
          <span className="ha-chev" />
          <span className="ha-bar w1" />
        </div>
        <div className="ha-acc-sub" />
        <div className="ha-acc-row">
          <span className="ha-chev" />
          <span className="ha-bar w2" />
        </div>
        <div className="ha-acc-row">
          <span className="ha-chev" />
          <span className="ha-bar w3" />
        </div>
      </div>
    );
  }
  // page, report, memo, letter: a calm reading stack.
  return (
    <div className="ha-frame" aria-hidden="true">
      <div className="ha-kicker" />
      <div className="ha-title">Nightly digest</div>
      <div className="ha-rule" />
      <div className="ha-bar w1" />
      <div className="ha-bar w2" />
      <div className="ha-bar w3" />
    </div>
  );
}

export default function Forms() {
  return (
    <section className="sec" id="forms">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">One source, many forms</p>
          <h2 className="h2">Write it once. Compile it into the form you need.</h2>
          <p className="lead">
            The same <code>.mdp</code> source becomes a page to read, a deck to
            present, a flyer to post, the document forms from report to letter, and
            interactive forms: a scroll story, tabs, an accordion, a stepper. You opt
            into the forms you want with one line of frontmatter; the engine lays out
            each one.
          </p>
        </div>

        <div className="forms-split">
          <aside className="forms-source-sticky">
            <div className="forms-source" aria-hidden="true">
              <div><span className="c-dim">---</span></div>
              <div><span className="c-key">mdp</span>: 1</div>
              <div><span className="c-key">theme</span>: studio</div>
              <div><span className="c-key">forms</span>: [page, slides, flyer]</div>
              <div><span className="c-key">title</span>: <span className="c-ink">Nightly digest</span></div>
              <div><span className="c-dim">---</span></div>
              <div><span className="c-ink"># Two ways to run it</span></div>
              <div>{"{.lead}"} Same result, two paths.</div>
              <div>&nbsp;</div>
              <div><span className="c-dim">```mdp:flow</span></div>
              <div>Collect -&gt; Summarize -&gt; Send</div>
              <div><span className="c-dim">```</span></div>
            </div>
            <a className="btn btn-primary forms-cta" href="#/playground?src=starter&kind=example">
              See it live
            </a>
          </aside>

          <ul className="forms-gallery reveal-stagger" aria-label="Forms the same source compiles into">
            {FORMS.map((f, i) => (
              <li className="form-card" key={f.id} style={{ "--reveal-i": i } as CSSProperties}>
                <Thumb id={f.id} />
                <div className="form-card-meta">
                  <h3>{f.label}</h3>
                  <p>{f.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
