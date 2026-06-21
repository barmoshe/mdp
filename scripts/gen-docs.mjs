// gen-docs.mjs: regenerate the example index table in examples/README.md between
// the <!-- examples:begin --> / <!-- examples:end --> markers, by parsing each
// examples/*.mdp. The demonstrates / blocks / forms / theme columns are DERIVED
// here (single source of truth = the file), never hand-kept. Run via
// `npm run gen:docs`; CI runs it then `git diff --quiet` to prove freshness.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "../packages/core/src/index.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const BEGIN = "<!-- examples:begin -->";
const END = "<!-- examples:end -->";
const STRUCTURAL = new Set(["title", "lead", "heading", "break", "paragraph"]);

const files = readdirSync(join(root, "examples")).filter((f) => f.endsWith(".mdp")).sort();
const rows = files.map((file) => {
  const { meta, blocks } = parse(readFileSync(join(root, "examples", file), "utf8"));
  const demonstrates = Array.isArray(meta.demonstrates) ? meta.demonstrates.join(", ") : "(none)";
  const blockTypes =
    [...new Set(blocks.map((b) => b.type).filter((t) => !STRUCTURAL.has(t)))].sort().join(", ") || "(prose)";
  const forms = Array.isArray(meta.forms) ? meta.forms.join(", ") : "page, slides, flyer";
  return `| \`${file}\` | ${demonstrates} | ${blockTypes} | ${forms} | ${meta.theme || "studio"} |`;
});
const table = ["| file | demonstrates | blocks | forms | theme |", "|---|---|---|---|---|", ...rows].join("\n");

const path = join(root, "examples", "README.md");
const md = readFileSync(path, "utf8");
const b = md.indexOf(BEGIN);
const e = md.indexOf(END);
if (b === -1 || e === -1) {
  console.error(`gen-docs: markers ${BEGIN} / ${END} not found in ${path}`);
  process.exit(1);
}
const next = md.slice(0, b + BEGIN.length) + "\n\n" + table + "\n\n" + md.slice(e);
writeFileSync(path, next);
console.log(`gen-docs: wrote ${files.length} rows to examples/README.md`);
