// schema.mjs: the versioned JSON Schema for the MDP intermediate representation.
//
// This is "the spec is a prompt" made machine-checkable. The schema describes
// the exact shape `parse()` emits — the frontmatter vocabulary AND the closed
// set of body block/directive nodes — so the documented format and what the
// engine actually accepts cannot silently drift (issue #4). The conformance
// test (scripts/check-schema.mjs) parses every shipped source and validates the
// resulting IR against this schema; CI fails if an example or the engine
// diverges from it.
//
// Authored here as a plain object (not a JSON import) for three reasons:
//   1. It travels with the engine when the core src/ is vendored into the Codex
//      plugin and the MCP server (both copy the whole tree, byte-for-byte).
//   2. It bundles in the browser playground with no JSON-import attribute.
//   3. It keeps mdp-compiler dependency-free — no validator, no schema loader.
// spec/schema.json is the published artifact, REGENERATED from this object by
// scripts/gen-schema.mjs (a CI freshness gate keeps the two in lockstep).
//
// The enums are derived from the engine's own constants (THEMES, CALLOUT_VARIANTS)
// so adding a theme or a callout variant updates the schema automatically.

import { THEMES, DEFAULT_THEME } from "./tokens.mjs";
import { CALLOUT_VARIANTS } from "./callout.mjs";
import { DIAGRAM_KINDS } from "./diagram.mjs";

// Semantic version of the grammar this schema describes. Bump on any change to
// the frontmatter vocabulary or the block set. Independent of the `mdp:` format
// version (which gates source-level compatibility).
export const SCHEMA_VERSION = "1.1.0";

// The presentation forms a source can declare (the allowed enum). Matches
// ARTIFACTS in index.mjs; kept as a literal here to avoid a circular import
// (index.mjs re-exports SCHEMA).
const FORMS = ["page", "slides", "flyer", "report", "onepager", "memo", "letter"];

// The forms compiled when a source omits `forms:`. The three core forms stay the
// default, so an unannotated source (and the playground) build the familiar set;
// the document forms (report/onepager/memo/letter) are opt-in via an explicit
// `forms:` list.
const DEFAULT_FORMS = ["page", "slides", "flyer"];

// A field the parser always sets, but which is null when the author omits it.
const stringOrNull = { type: ["string", "null"] };

// One node per block type the parser emits (see parse.mjs). Each is closed
// (additionalProperties:false) and lists every key the parser sets, so a change
// to a node's shape on either side trips the conformance test.
const definitions = {
  title: {
    type: "object",
    additionalProperties: false,
    required: ["type", "text"],
    properties: { type: { const: "title" }, text: { type: "string" } },
  },
  lead: {
    type: "object",
    additionalProperties: false,
    required: ["type", "text"],
    properties: { type: { const: "lead" }, text: { type: "string" } },
  },
  break: {
    type: "object",
    additionalProperties: false,
    required: ["type"],
    properties: { type: { const: "break" } },
  },
  heading: {
    type: "object",
    additionalProperties: false,
    required: ["type", "level", "text"],
    properties: {
      type: { const: "heading" },
      // The parser clamps to a section heading (2) or a non-title H1 (1).
      level: { type: "integer", enum: [1, 2] },
      text: { type: "string" },
    },
  },
  list: {
    type: "object",
    additionalProperties: false,
    required: ["type", "ordered", "items"],
    properties: {
      type: { const: "list" },
      ordered: { type: "boolean" },
      items: { type: "array", items: { type: "string" } },
    },
  },
  stats: {
    type: "object",
    additionalProperties: false,
    required: ["type", "items"],
    properties: {
      type: { const: "stats" },
      items: { type: "array", items: { $ref: "#/definitions/statItem" } },
    },
  },
  statItem: {
    type: "object",
    additionalProperties: false,
    required: ["label", "value"],
    properties: { label: { type: "string" }, value: { type: "string" } },
  },
  compare: {
    type: "object",
    additionalProperties: false,
    required: ["type", "options"],
    properties: {
      type: { const: "compare" },
      options: { type: "array", items: { $ref: "#/definitions/compareOption" } },
    },
  },
  compareOption: {
    type: "object",
    additionalProperties: false,
    required: ["name", "badge", "note", "cta", "pros"],
    properties: {
      name: { type: "string" },
      badge: stringOrNull,
      note: stringOrNull,
      cta: stringOrNull,
      pros: { type: "array", items: { type: "string" } },
    },
  },
  flow: {
    type: "object",
    additionalProperties: false,
    required: ["type", "steps"],
    properties: {
      type: { const: "flow" },
      steps: { type: "array", items: { type: "string" } },
    },
  },
  callout: {
    type: "object",
    additionalProperties: false,
    required: ["type", "variant", "blocks"],
    properties: {
      type: { const: "callout" },
      variant: { enum: [...CALLOUT_VARIANTS] },
      // A callout holds only paragraphs today (parse.mjs::parseCalloutParagraphs).
      blocks: { type: "array", items: { $ref: "#/definitions/calloutParagraph" } },
    },
  },
  calloutParagraph: {
    type: "object",
    additionalProperties: false,
    required: ["type", "text"],
    properties: { type: { const: "paragraph" }, text: { type: "string" } },
  },
  quote: {
    type: "object",
    additionalProperties: false,
    required: ["type", "text", "cite"],
    properties: {
      type: { const: "quote" },
      text: { type: "string" },
      cite: stringOrNull,
    },
  },
  paragraph: {
    type: "object",
    additionalProperties: false,
    required: ["type", "text"],
    properties: { type: { const: "paragraph" }, text: { type: "string" } },
  },
  table: {
    type: "object",
    additionalProperties: false,
    required: ["type", "align", "header", "rows"],
    properties: {
      type: { const: "table" },
      // One logical alignment per column (RTL-safe), from the delimiter row.
      align: { type: "array", items: { enum: ["start", "end", "center"] } },
      header: { type: "array", items: { type: "string" } },
      rows: { type: "array", items: { type: "array", items: { type: "string" } } },
    },
  },
  chart: {
    type: "object",
    additionalProperties: false,
    required: ["type", "items"],
    properties: {
      type: { const: "chart" },
      items: { type: "array", items: { $ref: "#/definitions/chartItem" } },
    },
  },
  chartItem: {
    type: "object",
    additionalProperties: false,
    required: ["label", "value"],
    properties: { label: { type: "string" }, value: { type: "number" } },
  },
  diagram: {
    type: "object",
    additionalProperties: false,
    required: ["type", "kind", "nodes", "edges"],
    properties: {
      type: { const: "diagram" },
      kind: { enum: [...DIAGRAM_KINDS] },
      nodes: { type: "array", items: { $ref: "#/definitions/diagramNode" } },
      edges: { type: "array", items: { $ref: "#/definitions/diagramEdge" } },
    },
  },
  diagramNode: {
    type: "object",
    additionalProperties: false,
    required: ["id", "label"],
    properties: { id: { type: "string" }, label: { type: "string" } },
  },
  diagramEdge: {
    type: "object",
    additionalProperties: false,
    required: ["from", "to", "label", "dashed"],
    properties: {
      from: { type: "string" },
      to: { type: "string" },
      label: stringOrNull,
      dashed: { type: "boolean" },
    },
  },
};

// The frontmatter object (the IR's `meta`). Closed to the keys the engine reads
// or that a source may carry; `mdp` is the only required field.
const meta = {
  type: "object",
  additionalProperties: false,
  required: ["mdp"],
  properties: {
    mdp: { description: "Format version. Required.", type: "integer", const: 1 },
    theme: {
      description: "A named renderer theme (a vibe, never a color). The engine owns the look.",
      enum: [...THEMES],
      default: DEFAULT_THEME,
    },
    forms: {
      description: "Which presentation forms this source compiles to.",
      type: "array",
      items: { enum: FORMS },
      uniqueItems: true,
      minItems: 1,
      default: DEFAULT_FORMS,
    },
    title: {
      description: "Optional. Defaults to the first H1 in the body.",
      type: "string",
    },
    kicker: {
      description: "Optional eyebrow line placed above the title in the masthead.",
      type: "string",
    },
    lang: {
      description: "Optional BCP-47 language tag, emitted as the document lang.",
      type: "string",
    },
    dir: {
      description: "Optional text direction. The layout flips via logical properties.",
      enum: ["ltr", "rtl", "auto"],
    },
    "brand-logo": {
      description:
        "Optional brand logo for the masthead: a URL, relative path, or data:image URI. Size and position are engine-locked; unsafe values are dropped.",
      type: "string",
    },
    "brand-accent": {
      description:
        "Optional custom brand color: one 6-digit hex (e.g. #7DB74B). The engine derives a full WCAG-AA accent set (5 roles, light + dark) from it; a malformed or inaccessible value falls back to `theme`. A reference to one color, never a style.",
      type: "string",
      pattern: "^#[0-9a-fA-F]{6}$",
    },
    "brand-accent-2": {
      description:
        "Optional secondary brand color (one 6-digit hex), used sparingly in engine-chosen accents (title underline, flow connectors, active slide dot). Applies only alongside brand-accent and falls back to it when inaccessible.",
      type: "string",
      pattern: "^#[0-9a-fA-F]{6}$",
    },
    "brand-font": {
      description:
        "Optional brand font for the body/UI family, one of a closed set of system font stacks (no web fonts). The serif role (lead and quotes) is unchanged; an unknown value falls back to the theme default.",
      enum: ["system", "serif", "mono", "rounded", "humanist"],
    },
    to: {
      description:
        "Optional addressee for the memo and letter forms (the To: line). Plain text; ignored by the other forms.",
      type: "string",
    },
    from: {
      description:
        "Optional sender for the memo and letter forms (the From: line, the letterhead, and the signature). Plain text; ignored by the other forms.",
      type: "string",
    },
    date: {
      description:
        "Optional date line for the memo and letter forms. A free string (e.g. \"June 22, 2026\"); the engine never inserts a clock, so the value is exactly what the author writes.",
      type: "string",
    },
    salutation: {
      description:
        "Optional greeting for the letter form (e.g. \"Dear Dr. Lin,\"). Plain text; ignored by the other forms.",
      type: "string",
    },
    signoff: {
      description:
        "Optional closing for the letter form (e.g. \"Sincerely,\"), placed above the signature. Plain text; ignored by the other forms.",
      type: "string",
    },
    demonstrates: {
      description:
        "Optional authoring/CI metadata: feature tags the coverage gate reads. Not rendered.",
      type: "array",
      items: { type: "string" },
    },
  },
};

// The full schema: the parsed IR is exactly { meta, blocks }.
export const SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://github.com/barmoshe/mdp/blob/main/spec/schema.json",
  title: "MDP intermediate representation",
  description:
    "The semantic tree parse() emits from an .mdp source: frontmatter (meta) plus the ordered, closed set of body blocks. Exported from mdp-compiler as SCHEMA and enforced as a conformance test so the spec cannot drift from the engine.",
  version: SCHEMA_VERSION,
  type: "object",
  additionalProperties: false,
  required: ["meta", "blocks"],
  properties: {
    meta,
    blocks: {
      type: "array",
      description: "The flat, ordered body. Every node is one of the closed block types.",
      items: {
        oneOf: [
          { $ref: "#/definitions/title" },
          { $ref: "#/definitions/lead" },
          { $ref: "#/definitions/break" },
          { $ref: "#/definitions/heading" },
          { $ref: "#/definitions/list" },
          { $ref: "#/definitions/stats" },
          { $ref: "#/definitions/compare" },
          { $ref: "#/definitions/flow" },
          { $ref: "#/definitions/callout" },
          { $ref: "#/definitions/quote" },
          { $ref: "#/definitions/paragraph" },
          { $ref: "#/definitions/table" },
          { $ref: "#/definitions/chart" },
          { $ref: "#/definitions/diagram" },
        ],
      },
    },
  },
  definitions,
};
