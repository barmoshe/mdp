// The playground/showcase starter sources are derived from examples/manifest.json
// (the single source of truth) plus the real .mdp files on disk, so the hub can
// never drift from what ships. Only entries tagged "site" appear. Vite inlines
// each source at build time via the raw glob; no source is hand-copied here.

import manifest from "../../examples/manifest.json";

export type Example = { id: string; label: string; lead: string; source: string };

const sources = import.meta.glob("../../examples/*.mdp", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type Entry = { id: string; file: string; label: string; lead: string; roles: string[] };

export const EXAMPLES: Example[] = (manifest as Entry[])
  .filter((e) => e.roles.includes("site"))
  .map((e) => ({
    id: e.id,
    label: e.label,
    lead: e.lead,
    source: sources[`../../examples/${e.file}`],
  }));
