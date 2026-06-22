// build.mjs: the MDP CLI. Compiles one .mdp source into every MDP artifact
// (page, slides, flyer, report, one-pager, memo, letter) and can open one to
// show it or present it.
//
// Usage:
//   node build.mjs <source.mdp> [--out <dir>] [--only <artifact>] [--theme <name>] [--open [artifact]]
//
// Defaults: source = examples/block-compare.mdp; build all artifacts.
// Output dir: --out <dir>, else a temp preview folder when --open is used,
// else <repo>/dist. --open with no artifact opens the first built one (or the
// page). The compile is deterministic (no clocks, no randomness); --open is a
// side effect only and does not touch the output bytes.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { compile, ARTIFACTS } from "./src/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

// Override the frontmatter `theme:` line (the --theme flag), so one source can be
// re-rendered across themes (the theme-gallery driver) without editing the file.
// Pure string transform on the frontmatter block; without --theme it is a no-op.
function overrideTheme(src, theme) {
  const lines = src.split("\n");
  if (lines[0].trim() !== "---") return src;
  const end = lines.indexOf("---", 1);
  if (end === -1) return src;
  for (let i = 1; i < end; i++) {
    if (/^\s*theme\s*:/.test(lines[i])) {
      lines[i] = `theme: ${theme}`;
      return lines.join("\n");
    }
  }
  lines.splice(1, 0, `theme: ${theme}`);
  return lines.join("\n");
}

// --- parse argv ---
const argv = process.argv.slice(2);
let inputArg = null;
let outArg = null;
let onlyArg = null;
let themeArg = null;
let openArg; // undefined = no open; null = open default; string = open that artifact

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") outArg = argv[++i];
  else if (a === "--only") onlyArg = argv[++i];
  else if (a === "--theme") themeArg = argv[++i];
  else if (a === "--open") {
    const next = argv[i + 1];
    if (next && ARTIFACTS.includes(next)) { openArg = next; i++; }
    else openArg = null;
  } else if (!a.startsWith("--") && inputArg === null) {
    inputArg = a;
  }
}

const inputPath = inputArg
  ? resolve(process.cwd(), inputArg)
  : join(repoRoot, "examples", "block-compare.mdp");

let targets = ARTIFACTS;
if (onlyArg) {
  if (!ARTIFACTS.includes(onlyArg)) {
    console.error(`Unknown artifact "${onlyArg}". Expected one of: ${ARTIFACTS.join(", ")}`);
    process.exit(1);
  }
  targets = [onlyArg];
}

// Output dir: explicit --out, else a fixed temp preview folder when opening
// (named after the source so it is stable, no randomness), else <repo>/dist.
let distDir;
if (outArg) distDir = resolve(process.cwd(), outArg);
else if (openArg !== undefined) {
  distDir = join(tmpdir(), "mdp-preview", basename(inputPath).replace(/\.[^.]*$/, ""));
} else distDir = join(repoRoot, "dist");

mkdirSync(distDir, { recursive: true });

let source = readFileSync(inputPath, "utf8");
if (themeArg) source = overrideTheme(source, themeArg);

console.log(`MDP build`);
console.log(`  source: ${inputPath}`);

const written = {};
for (const artifact of targets) {
  const html = compile(source, artifact);
  const outPath = join(distDir, `${artifact}.html`);
  writeFileSync(outPath, html, "utf8");
  written[artifact] = outPath;
  const bytes = Buffer.byteLength(html, "utf8");
  console.log(`  wrote:  ${outPath}  (${bytes} bytes)`);
}

console.log(`Done. Compiled ${targets.length} artifact${targets.length === 1 ? "" : "s"}.`);

// --open: show or present by opening the artifact in the default application.
if (openArg !== undefined) {
  const artifact = openArg && written[openArg] ? openArg : targets[0];
  const toOpen = written[artifact];
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", toOpen] : [toOpen];
  console.log(`  opening ${artifact}: ${toOpen}`);
  const child = spawn(cmd, args, { stdio: "ignore", detached: true });
  child.on("error", (e) => {
    console.error(`  could not open automatically (${e.message}). Open this file manually:`);
    console.error(`  ${toOpen}`);
  });
  child.unref();
}
