// The fill-in templates shown on the site, derived from templates/manifest.json
// (the single source of truth) plus the real .mdp files on disk. Mirrors
// examples.ts. Only entries tagged "site-template" appear. The templates live at
// repo-root /templates (a sibling of /site), reachable by the dev server's
// fs.allow and by the build glob.

import manifest from "../../templates/manifest.json";

export type Template = { id: string; label: string; lead: string; source: string };

const sources = import.meta.glob("../../templates/*.mdp", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

type Entry = { id: string; file: string; label: string; lead: string; roles: string[] };

export const TEMPLATES: Template[] = (manifest as Entry[])
  .filter((e) => e.roles.includes("site-template"))
  .map((e) => ({
    id: e.id,
    label: e.label,
    lead: e.lead,
    source: sources[`../../templates/${e.file}`],
  }));
