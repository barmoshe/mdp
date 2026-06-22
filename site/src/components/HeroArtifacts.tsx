// A static, decorative "one source -> many forms" visual for the hero. It does
// NOT run the engine: it is hand-built from the same design tokens so it echoes
// the engine's real masthead language (kicker tick, Fraunces title, accent rule)
// with zero layout shift and no compile on the critical path. The live engine
// lives in the playground section below. The form set is data-driven, so the
// panel grows when a form is added and never states a count.
type FormId = "page" | "slides" | "flyer" | "report" | "onepager" | "memo" | "letter";

const FORMS: { id: FormId; label: string }[] = [
  { id: "page", label: "page" },
  { id: "slides", label: "slides" },
  { id: "flyer", label: "flyer" },
  { id: "report", label: "report" },
  { id: "onepager", label: "one-pager" },
  { id: "memo", label: "memo" },
  { id: "letter", label: "letter" },
];

// One small token-built preview per form. The same title rides every frame, so
// the panel reads as one source becoming many shapes.
function FormFrame({ id, label }: { id: FormId; label: string }) {
  const centered = id === "slides";
  const figs = id === "flyer" || id === "onepager";
  return (
    <div className={`ha-frame${centered ? " is-slides" : ""}`}>
      <div className="ha-kicker" />
      <div className="ha-title">Nightly digest</div>
      <div className="ha-rule" />
      {!centered && (
        <>
          <div className="ha-bar w1" />
          <div className="ha-bar w2" />
          {!figs && <div className="ha-bar w3" />}
        </>
      )}
      {figs && (
        <div className="ha-figs">
          <span className="ha-fig" />
          <span className="ha-fig" />
          <span className="ha-fig" />
        </div>
      )}
      <span className="ha-frame-tag">{label}</span>
    </div>
  );
}

export default function HeroArtifacts() {
  return (
    <div className="ha" aria-hidden="true">
      <div className="ha-source">
        <div><span className="c-dim">---</span></div>
        <div><span className="c-key">theme</span>: studio</div>
        <div><span className="c-key">title</span>: <span className="c-ink">Nightly digest</span></div>
        <div><span className="c-dim">---</span></div>
        <div><span className="c-ink"># Two ways to run it</span></div>
        <div>{"{.lead}"} Same result, two paths.</div>
        <div><span className="c-dim">```mdp:flow</span></div>
        <div>Collect &rarr; Summarize &rarr; Send</div>
      </div>

      <div className="ha-caption"><span>one source, many forms</span></div>

      <div className="ha-frames">
        {FORMS.map((f) => (
          <FormFrame key={f.id} id={f.id} label={f.label} />
        ))}
      </div>
    </div>
  );
}
