---
description: Render the current plan (or a given plan file) as MDP's interactive `plan` form and preview it. Use when the user asks to preview, show, or render a plan as MDP, or after you present a plan in plan mode and want to surface it as a polished, tickable plan view.
argument-hint: [plan file path, or nothing to use the active/most-recent plan]
---

# Preview a plan as MDP

Take a Claude Code plan (plain Markdown: a title, `##` phases, prose, and
`- [ ]` task lists) and render it as MDP's `plan` form — collapsible phases,
status-aware checklists, and a live progress meter — then show it to the user.

The conversion + compile is done by `scripts/preview-plan.mjs` in the MDP plugin
(it wraps the plan in minimal MDP frontmatter, lifts `- [ ]` / `- [x]` / `- [~]`
runs into `mdp:tasks` blocks, promotes the goal to the lead, and splits a phase
per `##`). The render path is pure, so the same plan always produces the same
HTML.

Arguments: $ARGUMENTS

## Steps

1. Decide the plan source:
   - If `$ARGUMENTS` is a path to a `.md` file, use it.
   - Otherwise use the active plan. Claude writes plans to `~/.claude/plans/`;
     `--latest` picks the newest one there.
   - If the user pasted plan text instead, write it to a temp `.md` first, or
     pipe it in with `--stdin`.

2. Compile to the `plan` form. The converter lives at the plugin root, so
   `${CLAUDE_PLUGIN_ROOT}` resolves it when installed as a plugin and falls back to
   the repo root (`.`) for in-repo dev:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/preview-plan.mjs" --latest --open
   # or: node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/preview-plan.mjs" <plan.md> --open
   # or: node "${CLAUDE_PLUGIN_ROOT:-.}/scripts/preview-plan.mjs" --stdin --open < plan.md
   ```

   `--open` opens the HTML in a browser when you are running Claude Code locally
   with a display; it is a harmless no-op on a headless/remote box. The script
   prints `WROTE <abspath>` as its last line — capture that path.

3. Surface the preview to the user:
   - Always send the written HTML file with the file tool so it renders in the
     app's preview (this is what works in a remote/web session, where a browser
     opened inside the container cannot reach the user).
   - If `--open` reported success (local run), also mention it opened in their
     browser.

4. Keep it deterministic and read-only: do not edit the user's plan; only render
   it. If the compile fails, report the error from the script rather than
   guessing.

## Automatic alternative

To render every plan without invoking this command, wire a `PreToolUse` hook on
`ExitPlanMode` that runs `preview-plan.mjs --hook` (see the "Preview a plan as MDP"
section of the README). `--hook` reads the tool-call JSON on stdin and renders the
exact plan being presented, so the preview appears *before* the approval prompt and
on each revision. It fails open and never blocks the plan.
