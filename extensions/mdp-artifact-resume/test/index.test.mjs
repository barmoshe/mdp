// Tests for mdp-artifact-resume. Zero-dep: node:test + node:assert. `npm test`.
// Uses a literal IR (the shape mdp-compiler's parse() returns) so it runs offline.

import { test } from "node:test";
import assert from "node:assert/strict";
import { renderResume, RESUME_STYLE } from "../src/index.mjs";

const ir = {
  meta: { title: "Ada Lovelace", theme: "studio" },
  blocks: [
    { type: "title", text: "Ada Lovelace" },
    { type: "lead", text: "Analyst and writer. <b>x</b>" },
    { type: "stats", items: [{ label: "Focus", value: "Computing" }] },
    { type: "heading", text: "Experience" },
    { type: "list", ordered: false, items: ["One", "Two"] },
    { type: "pricing", tiers: [] }, // not part of a resume -> dropped
  ],
};

test("returns a complete HTML document with the resume layout", () => {
  const html = renderResume(ir);
  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<title>Ada Lovelace<\/title>/);
  assert.match(html, /<main class="mdp-resume">/);
  assert.match(html, /class="mdp-resume-name"/);
  assert.match(html, /class="mdp-resume-section"/);
});

test("embeds the base token system (baseStyle) so it is self-styled", () => {
  assert.match(renderResume(ir), /--mdp-ink:/);
});

test("renders known blocks and drops unknown ones", () => {
  const html = renderResume(ir);
  assert.match(html, /Experience/);
  assert.equal((html.match(/<li>/g) || []).length, 2); // the list items only
  assert.match(html, /mdp-resume-facts/); // stats becomes a quick-facts row
  assert.ok(!html.includes("pricing"), "an unsupported block is dropped");
});

test("escapes author content (no raw HTML leaks through)", () => {
  const html = renderResume(ir);
  assert.ok(!html.includes("<b>x</b>"), "raw markup must not survive");
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
});

test("STYLE holds the design lock (tokens only, logical properties)", () => {
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(RESUME_STYLE), "no literal hex colors");
  assert.ok(
    !/\b(margin|padding|inset|border)-(left|right)\b/.test(RESUME_STYLE),
    "no physical left/right properties"
  );
});

test("deterministic: identical output across two renders", () => {
  assert.equal(renderResume(ir), renderResume(ir));
});
