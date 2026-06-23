import { useState } from "react";
import { EXAMPLES } from "../examples";
import { TEMPLATES } from "../templates";
import { LINKS } from "../links";

const EXAMPLE_BLURB: Record<string, string> = {
  "block-compare": "Compare options side by side, with a flow and callouts.",
  "block-stats": "Key figures rendered as a clean stat band.",
  "block-table": "GitHub-style pipe tables with per-column alignment.",
  "block-chart": "Label and value pairs as a proportional, accent-colored bar chart.",
  "block-diagram": "Native SVG flow, sequence, and tree diagrams from one syntax.",
  "block-timeline": "A vertical sequence of steps on a single accent rail.",
  "block-faq": "Question and answer pairs as native, keyboard-friendly disclosures.",
  "block-pricing": "Priced tiers as a locked card grid, the priced sibling of compare.",
  "theme-gallery": "The same source shown across the full theme spectrum.",
  "brand-logo": "A masthead logo, sanitized and design-locked.",
  "brand-accent": "Name a brand color; the engine derives the full light and dark accent set.",
  "release-notes": "Announce a version, calmly.",
  "report": "A paginated long-form document: cover, contents, and numbered sections.",
  "onepager": "A single dense sheet, the executive leave-behind.",
  "memo": "An internal memo: To, From, Date, and Re over a tight column.",
  "letter": "Formal correspondence: letterhead, salutation, body, and sign-off.",
  "scroll": "A scroll-driven narrative that reveals each section as you read.",
  "accordion": "Collapsible sections to scan and open on demand.",
  "tabs": "A tabbed explorer with arrow-key navigation and deep links.",
  "stepper": "A guided walkthrough, one numbered step at a time.",
  "form-plan": "An implementation plan: phases, status-aware checklists, and live progress.",
  "starter": "The smallest source to copy and build on.",
};

const TEMPLATE_BLURB: Record<string, string> = {
  "decision-brief": "Recommend one path among a few.",
  "product-one-pager": "A single, at-a-glance product pitch.",
  "release-notes": "Announce a versioned release.",
  "resume": "A clean, design-locked CV.",
  "story": "Tell a launch or case study as a scroll narrative.",
  "faq": "Answer common questions as a collapsible list.",
  "explorer": "Lay out a product across tabs to jump between.",
  "walkthrough": "Guide a task step by step.",
  "implementation-plan": "Lay out an implementation as phases and checklists.",
};

function LibCard({ label, lead, blurb, source, href, play }: {
  label: string;
  lead: string;
  blurb: string;
  source: string;
  href: string;
  play: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="lib-card">
      <div className="lib-card-top">
        <h4>{label}</h4>
        <span className="lib-badge">{lead}</span>
      </div>
      <p>{blurb}</p>
      <div className="lib-actions">
        <button
          className="lib-copy"
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(source);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy source"}
        </button>
        <a href={play}>Open</a>
        <a href={href} target="_blank" rel="noreferrer">View</a>
      </div>
    </div>
  );
}

export default function Library() {
  return (
    <section className="sec" id="library">
      <div className="sec-rail-wide">
        <div className="masthead reveal">
          <p className="eyebrow eyebrow-accent">Examples &amp; templates</p>
          <h2 className="h2">Start from a working source, not a blank page</h2>
          <p className="lead">
            Every block has an example you can read, and every common document has
            a fill-in template you can copy. Each is one .mdp source, indexed by a
            manifest so nothing drifts.
          </p>
        </div>

        <div className="lib-block">
          <div className="lib-head">
            <h3>Examples</h3>
            <a href={LINKS.examples} target="_blank" rel="noreferrer">All examples</a>
          </div>
          <div className="lib-grid">
            {EXAMPLES.map((e) => (
              <LibCard
                key={e.id}
                label={e.label}
                lead={e.lead}
                blurb={EXAMPLE_BLURB[e.id] ?? ""}
                source={e.source}
                href={`${LINKS.repo}/blob/main/examples/${e.id}.mdp`}
                play={`#/playground?src=${e.id}&kind=example`}
              />
            ))}
          </div>
        </div>

        <div className="lib-block">
          <div className="lib-head">
            <h3>Templates</h3>
            <a href={`${LINKS.repo}/tree/main/templates`} target="_blank" rel="noreferrer">All templates</a>
          </div>
          <div className="lib-grid">
            {TEMPLATES.map((t) => (
              <LibCard
                key={t.id}
                label={t.label}
                lead={t.lead}
                blurb={TEMPLATE_BLURB[t.id] ?? ""}
                source={t.source}
                href={`${LINKS.repo}/blob/main/templates/${t.id}.mdp`}
                play={`#/playground?src=${t.id}&kind=template`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
