// scaffold.mjs: copy a template tree into a target directory, substituting
// __TOKEN__ placeholders. Pure given its inputs (no clock, no randomness): the
// same (templateDir, target, tokens) always writes the same bytes. Determinism
// is a hard requirement across MDP and the scaffolder is no exception.

import {
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";

// Apply the token map to a string. `tokens` is an array of [key, value] pairs so
// the order is declared and auditable; each key is a literal __TOKEN__ string
// (double underscores can't collide with JS/CSS/Markdown/JSON syntax), so a
// plain split/join per key is injection-free.
export function substitute(text, tokens) {
  let out = text;
  for (const [key, value] of tokens) {
    out = out.split(key).join(value);
  }
  return out;
}

// Map a template filename to its written name: drop ".tmpl", rename the license
// file, and reveal the dotfile.
function outName(name) {
  if (name === "gitignore.tmpl") return ".gitignore";
  if (name.startsWith("LICENSE-") && name.endsWith(".tmpl")) return "LICENSE";
  return name.endsWith(".tmpl") ? name.slice(0, -5) : name;
}

// Collect template files under base as POSIX-style relative paths, sorted at
// every level so traversal order is stable across machines.
function walk(base, sub = "") {
  const here = sub ? join(base, sub) : base;
  const out = [];
  for (const entry of readdirSync(here).sort()) {
    const rel = sub ? `${sub}/${entry}` : entry;
    if (statSync(join(base, rel)).isDirectory()) {
      out.push(...walk(base, rel));
    } else {
      out.push(rel);
    }
  }
  return out;
}

// Scaffold templateDir into target, substituting tokens. `license` selects which
// LICENSE-<id>.tmpl to emit (the others are skipped). Refuses a non-empty target
// unless force; never deletes, only writes the files it generates. Returns the
// sorted list of written relative paths.
export function scaffold({ templateDir, target, tokens, license, force = false }) {
  if (!existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }
  if (existsSync(target)) {
    const entries = readdirSync(target);
    if (entries.length && !force) {
      throw new Error(
        `Target "${target}" is not empty. Re-run with --force to write into it.`
      );
    }
  }

  const wantedLicense = `LICENSE-${String(license).toUpperCase()}.tmpl`;
  const written = [];

  for (const rel of walk(templateDir)) {
    const base = rel.split("/").pop();
    if (base.startsWith("LICENSE-") && base !== wantedLicense) continue;

    const outText = substitute(readFileSync(join(templateDir, rel), "utf8"), tokens);

    const parts = rel.split("/");
    parts[parts.length - 1] = outName(base);
    const outRel = parts.join("/");
    const outPath = join(target, outRel);

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, outText);
    written.push(outRel);
  }

  return written.sort();
}
