#!/usr/bin/env node
// preview-plan.mjs: render a Claude Code plan as MDP's `plan` form.
//
// Claude's plan-mode plans are plain Markdown (a title, `##` phases, prose, and
// often GitHub-style `- [ ]` task lists). This wraps that Markdown in minimal MDP
// frontmatter, lifts any contiguous run of `- [ ]` / `- [x]` / `- [~]` lines into
// an `mdp:tasks` block (so the plan form's checklists and live progress meter
// light up), compiles it to the `plan` artifact, writes the HTML, and — with
// --open and a local display — opens it in a browser.
//
// It is the shared core behind both the /mdp-preview-plan command (the manual
// path: the agent surfaces the HTML to you) and the PreToolUse hook on
// ExitPlanMode (the automatic path): with --hook it reads the tool-call JSON on
// stdin, lifts tool_input.plan, and renders it as the plan is presented — before
// the approval dialog — so the preview shows on every plan and each iteration,
// not just after approval.
//
// Usage:
//   node scripts/preview-plan.mjs <plan.md>        # a specific plan file
//   node scripts/preview-plan.mjs --latest         # newest plan in ~/.claude/plans
//   cat plan.md | node scripts/preview-plan.mjs --stdin
//   ... | node scripts/preview-plan.mjs --hook     # ExitPlanMode hook JSON on stdin
//   flags: [--out <file>] [--open] [--plans-dir <dir>] [--title <text>]
// --hook fails open (always exits 0) so it can never block ExitPlanMode, and
// falls back to the newest saved plan if the payload carries no plan.
// Prints `WROTE <abspath>` as its last line so a caller can find the HTML.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { compile } from "../packages/core/src/index.mjs";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function parseArgs(argv) {
  const args = { open: false, latest: false, stdin: false, hook: false, out: null, plansDir: null, title: null, input: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--open") args.open = true;
    else if (a === "--latest") args.latest = true;
    else if (a === "--stdin") args.stdin = true;
    else if (a === "--hook") args.hook = true;
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--plans-dir") args.plansDir = argv[++i];
    else if (a === "--title") args.title = argv[++i];
    else if (!a.startsWith("--")) args.input = a;
  }
  return args;
}

// The newest *.md in the plans dir, preferring a top-level plan over an agent's
// sub-plan (the `-agent-<id>` files a Plan subagent writes).
function newestPlan(plansDir) {
  let entries;
  try {
    entries = readdirSync(plansDir).filter((f) => f.endsWith(".md"));
  } catch {
    return null;
  }
  if (!entries.length) return null;
  const ranked = entries
    .map((f) => ({ f, mtime: statSync(join(plansDir, f)).mtimeMs, agent: /-agent-[0-9a-f]+\.md$/i.test(f) }))
    .sort((a, b) => a.agent - b.agent || b.mtime - a.mtime);
  return join(plansDir, ranked[0].f);
}

// Escape a value for a single-line YAML-ish frontmatter string.
function yamlString(s) {
  return String(s).replace(/[\r\n]+/g, " ").trim();
}

// Pull a human title from the first `#`/`##` heading, else a default.
function deriveTitle(md) {
  const m = md.match(/^\s{0,3}#{1,2}\s+(.+?)\s*$/m);
  return m ? m[1].trim() : "Implementation plan";
}

const TASK_RE = /^\s*[-*]\s+\[([ xX~\-])\]\s+(.*)$/;

// Lift contiguous runs of GitHub-style task list lines into an `mdp:tasks`
// fenced block, normalising each marker to MDP's `[ ]` / `[x]` / `[~]`. Nested
// task items are flattened (the plan form groups by phase, not by indent).
function liftTasks(md) {
  const lines = md.split("\n");
  const out = [];
  let run = null; // collected task lines, or null when not in a run
  const flush = () => {
    if (!run) return;
    out.push("```mdp:tasks");
    for (const t of run) out.push(t);
    out.push("```");
    run = null;
  };
  for (const line of lines) {
    const m = line.match(TASK_RE);
    if (m) {
      const mark = m[1];
      const norm = mark === "x" || mark === "X" ? "x" : mark === "~" || mark === "-" ? "~" : " ";
      (run ||= []).push(`- [${norm}] ${m[2].trim()}`);
    } else if (line.trim() === "" && run) {
      // A blank line inside a run keeps the run open if more tasks follow; peek
      // is unnecessary — just close on the blank and let a new run start. This
      // keeps separate task groups as separate blocks.
      flush();
      out.push(line);
    } else {
      flush();
      out.push(line);
    }
  }
  flush();
  return out.join("\n");
}

// Mark the goal as the lead: the first plain-prose paragraph after the `#` title
// (and before the first `##` phase) becomes a `{.lead}` standfirst, so it reads
// as the plan's goal in the masthead. Skips headings, lists, fences, and breaks.
function markGoalLead(md) {
  const lines = md.split("\n");
  let seenTitle = false;
  let done = false;
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    if (!done) {
      if (/^\s{0,3}#\s+/.test(line)) { seenTitle = true; out.push(line); continue; }
      if (/^\s{0,3}##\s+/.test(line)) { done = true; out.push(line); continue; }
      const plain =
        seenTitle && t !== "" && t !== "---" &&
        !/^\s{0,3}#{1,6}\s+/.test(line) && !/^\s*[-*]\s+/.test(line) &&
        !/^\s*\d+\.\s+/.test(line) && !line.startsWith("```") &&
        !line.startsWith(":::") && !/^\{\./.test(t);
      if (plain) { out.push(`{.lead} ${t}`); done = true; continue; }
    }
    out.push(line);
  }
  return out.join("\n");
}

// Make each `## ` heading start a phase: insert a `---` break before it (MDP's
// plan form splits phases on breaks, where Claude plans only use `##` headings).
function insertPhaseBreaks(md) {
  const lines = md.split("\n");
  const out = [];
  for (const line of lines) {
    if (/^\s{0,3}##\s+/.test(line) && out.length && out[out.length - 1].trim() !== "---") {
      out.push("---");
    }
    out.push(line);
  }
  return out.join("\n");
}

// Turn plan Markdown into an MDP `plan` source: prepend frontmatter (unless the
// source already carries a `---` block), promote the goal to the lead, split
// phases on `##`, and lift task lists.
function toMdp(md, titleOverride) {
  const clean = md.replace(/^﻿/, "");
  if (/^\s*---\s*\n/.test(clean)) return liftTasks(clean); // already MDP-shaped
  const title = yamlString(titleOverride || deriveTitle(md));
  const body = liftTasks(insertPhaseBreaks(markGoalLead(clean)));
  const front = `---\nmdp: 1\nforms: [plan]\nkicker: Plan\ntitle: ${title}\n---\n\n`;
  return front + body;
}

// Best-effort open in the OS browser; a no-op (swallowed) on a headless/remote
// box where there is no display to open into.
function openInBrowser(file) {
  const platform = process.platform;
  const headless = platform === "linux" && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
  if (headless) return false;
  const [cmd, cmdArgs] =
    platform === "darwin" ? ["open", [file]] :
    platform === "win32" ? ["cmd", ["/c", "start", "", file]] :
    ["xdg-open", [file]];
  try {
    const child = spawn(cmd, cmdArgs, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// In --hook mode the ExitPlanMode PreToolUse payload arrives as JSON on stdin;
// lift the plan markdown out of it (tool_input.plan, or a bare .plan). Returns
// "" on empty/non-JSON input so the caller can fall back to the newest plan.
function planFromHookStdin() {
  const raw = readStdin();
  if (!raw.trim()) return "";
  try {
    const payload = JSON.parse(raw);
    return (payload.tool_input && payload.tool_input.plan) || payload.plan || "";
  } catch {
    return "";
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  // --hook must never block ExitPlanMode: on any problem, report and exit 0.
  const failOpen = args.hook;
  const bail = (msg, code) => {
    console.error(msg);
    process.exit(failOpen ? 0 : code);
  };

  let md = "";
  let sourceLabel = "";
  if (args.hook) {
    md = planFromHookStdin();
    sourceLabel = "ExitPlanMode hook";
    if (!md.trim()) {
      // No plan in the payload (malformed/absent) — fall back to the newest
      // saved plan so the preview still appears.
      const plansDir = args.plansDir || join(homedir(), ".claude", "plans");
      const path = newestPlan(plansDir);
      if (path) {
        md = readFileSync(path, "utf8");
        sourceLabel = resolve(path);
      }
    }
  } else if (args.stdin) {
    md = readStdin();
    sourceLabel = "stdin";
  } else {
    let path = args.input;
    if (!path && args.latest) {
      const plansDir = args.plansDir || join(homedir(), ".claude", "plans");
      path = newestPlan(plansDir);
      if (!path) bail(`preview-plan: no plan .md found in ${plansDir}`, 2);
    }
    if (!path) bail("preview-plan: pass a plan .md path, --latest, --stdin, or --hook", 2);
    md = readFileSync(path, "utf8");
    sourceLabel = resolve(path);
  }

  if (!md.trim()) bail("preview-plan: the plan source is empty", 2);

  const source = toMdp(md, args.title);
  let html;
  try {
    html = compile(source, "plan");
  } catch (e) {
    bail(`preview-plan: compile failed: ${e && e.message ? e.message : e}`, 1);
  }

  const out = args.out ? resolve(args.out) : join(repoRoot, "dist", "plan-preview.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);

  if (args.open) openInBrowser(out);

  console.error(`preview-plan: rendered ${sourceLabel} -> plan form`);
  console.log(`WROTE ${out}`);
}

main();
