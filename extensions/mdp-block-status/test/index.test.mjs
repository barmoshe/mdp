// Tests for mdp-block-status. Zero-dep: node:test + node:assert. Run `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { renderStatus, STATUS_STYLE } from "../src/index.mjs";

const block = {
  type: "status",
  items: [
    { label: "Shipped", tone: "solid" },
    { label: "In review", tone: "accent" },
    { label: "Planned" },
    { label: "<b>x</b>", tone: "bogus" },
  ],
};

test("renders the root class and one pill per item", () => {
  const html = renderStatus(block);
  assert.match(html, /class="mdp-status"/);
  assert.equal((html.match(/<span class="mdp-status-pill/g) || []).length, 4);
});

test("maps the closed tone set, clamping unknown/missing to default", () => {
  const html = renderStatus(block);
  assert.match(html, /mdp-status-pill mdp-status-pill--solid/);
  assert.match(html, /mdp-status-pill mdp-status-pill--accent/);
  // "Planned" (no tone) and the bogus tone both clamp to the base pill class only.
  assert.ok(!html.includes("mdp-status-pill--bogus"), "unknown tone must not reach the class");
});

test("escapes author content (no raw HTML leaks through)", () => {
  const html = renderStatus(block);
  assert.ok(!html.includes("<b>x</b>"), "raw markup must not survive");
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
});

test("STYLE holds the design lock (tokens only, logical properties)", () => {
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(STATUS_STYLE), "no literal hex colors");
  assert.ok(
    !/\b(margin|padding|inset|border)-(left|right)\b/.test(STATUS_STYLE),
    "no physical left/right properties"
  );
});

test("deterministic: identical output across two renders", () => {
  assert.equal(renderStatus(block), renderStatus(block));
});
