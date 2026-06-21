import { useMemo, useState } from "react";
import { compile, ARTIFACTS } from "@mdp/core";
import { EXAMPLES } from "../examples";

// A non-editable teaser for the home page. It runs the real engine on a built-in
// example so the preview stays honest, and lets you flip the form (page, slides,
// flyer) to feel the "one source, three artifacts" idea, then sends you to the
// full playground to actually edit.
export default function PlaygroundPreview() {
  const [artifact, setArtifact] = useState("page");
  const source = EXAMPLES[0].source;
  const html = useMemo(() => {
    try {
      return compile(source, artifact);
    } catch {
      return "";
    }
  }, [artifact]);

  return (
    <div className="pg pg-preview-card">
      <div className="pg-bar">
        <div className="pg-tabs" role="tablist" aria-label="Artifact">
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
        <div className="pg-spacer" />
        <a className="btn btn-primary btn-small" href="#/playground">
          Open full playground
        </a>
      </div>
      <iframe
        className="pg-frame pg-frame-preview"
        title={`MDP ${artifact} preview`}
        srcDoc={html}
      />
    </div>
  );
}
