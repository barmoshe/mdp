// check-image.mjs: tests for body images (issue #56).
//
// Asserts the engine's guarantees for `![alt](src)`: a standalone image line
// becomes a block-level <figure class="mdp-figure-img"> in every form; the
// same syntax mixed into running text stays inline as <img class="mdp-inline-
// img">; an unsafe src drops the image entirely (block vanishes with no
// leftover paragraph, inline leaves no <img>); alt text is escaped; output is
// deterministic; and body images carry no physical left/right so they flip
// for free under dir=rtl.
// Pure asserts, no dependencies. Run via `npm test` (after check-logo).

import assert from "node:assert";
import { compile } from "../packages/core/src/index.mjs";

const FORMS = [
  "page",
  "report",
  "onepager",
  "flyer",
  "slides",
  "memo",
  "letter",
  "scroll",
  "accordion",
  "tabs",
  "stepper",
  "plan",
];
const FIGURE = /<figure class="mdp-figure-img"><img[^>]*><\/figure>/g;
const INLINE_IMG = /<img class="mdp-inline-img"[^>]*>/g;

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`ok   - ${name}`);
  } catch (e) {
    fail++;
    console.error(`FAIL - ${name}: ${e.message}`);
  }
}

// A minimal source; `bodyLine` is inserted as the paragraph after the lead.
const src = (bodyLine) =>
  `---\nmdp: 1\nforms: [${FORMS.join(", ")}]\ntitle: Image test\n---\n\n# Image test\n{.lead} A body image should render.\n\n${bodyLine}\n`;

check("standalone image line emits exactly one block figure in every form", () => {
  for (const f of FORMS) {
    const html = compile(src("![A hand-drawn robot at a desk](./robot.png)"), f);
    assert.equal((html.match(FIGURE) || []).length, 1, `${f}: figure count`);
    assert.ok(html.includes('src="./robot.png"'), `${f}: src present`);
    assert.ok(html.includes('alt="A hand-drawn robot at a desk"'), `${f}: alt present`);
  }
});

check("image mixed into running text renders inline, not as a figure", () => {
  for (const f of FORMS) {
    const html = compile(src("Some text ![icon](./icon.png) more text."), f);
    assert.equal((html.match(INLINE_IMG) || []).length, 1, `${f}: inline img count`);
    assert.equal((html.match(FIGURE) || []).length, 0, `${f}: must not be a figure`);
    assert.ok(!html.includes(">!<"), `${f}: no stray ! before the image`);
  }
});

// Bad URLs avoid literal parens and whitespace: the URL capture group
// (shared with the link syntax's `[text](url)`) stops at the first `)` or
// space, so a payload containing either would split across the line before
// ever reaching safeImgUrl. That matching limitation is pre-existing and
// shared with links; not something this test re-checks.
const UNSAFE = [
  ["javascript:", "javascript:evilCode"],
  ["data:text/html", "data:text/html,<b>x</b>"],
  ["raw (non-base64) svg data:", "data:image/svg+xml,PHN2Zz48L3N2Zz4="],
];
for (const [label, bad] of UNSAFE) {
  check(`unsafe standalone image (${label}) vanishes, no leftover block`, () => {
    for (const f of FORMS) {
      const withBad = compile(src(`![bad](${bad})`), f);
      const noImage = compile(src(""), f);
      assert.equal((withBad.match(FIGURE) || []).length, 0, `${f}: expected no figure`);
      assert.equal(withBad, noImage, `${f}: output must equal the no-image render`);
    }
  });
  check(`unsafe inline image (${label}) drops, no <img> emitted`, () => {
    for (const f of FORMS) {
      const html = compile(src(`Some text ![bad](${bad}) more text.`), f);
      assert.equal((html.match(INLINE_IMG) || []).length, 0, `${f}: expected no inline img`);
      assert.ok(!html.includes("javascript:"), `${f}: scheme must not leak`);
    }
  });
}

check("alt text is HTML-escaped", () => {
  const html = compile(src('![<script>alert(1)</script>](./x.png)'), "page");
  assert.ok(!html.includes("<script>alert(1)</script>"), "raw script must not appear");
  assert.ok(html.includes("&lt;script&gt;"), "alt must be escaped");
});

check("deterministic: two compiles are byte-identical", () => {
  for (const f of FORMS) {
    const s = src("![robot](./robot.png)");
    assert.equal(compile(s, f), compile(s, f), f);
  }
});

check("rtl: .mdp-figure-img and its img use no physical left/right", () => {
  const html = compile(
    `---\nmdp: 1\nlang: he\ndir: rtl\nforms: [page]\ntitle: brand\n---\n\n# brand\n\n![diagram](./robot.png)\n`,
    "page"
  );
  assert.ok(html.includes('dir="rtl"'), "doc must carry dir=rtl");
  const rules = html.match(/\.mdp-figure-img[^{]*\{[^}]*\}/g) || [];
  assert.ok(rules.length > 0, "expected at least one .mdp-figure-img rule");
  for (const rule of rules) {
    assert.ok(!/\b(left|right)\b/.test(rule), `.mdp-figure-img must avoid physical left/right: ${rule}`);
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
