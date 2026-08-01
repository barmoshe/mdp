// check-diagram.mjs: tests for the `mdp:diagram` primitive's geometry.
//
// The bug these exist for: a connector label is drawn on a background plate
// sized from its text, but the layouts sized the viewBox from their node grid
// alone. Any plate that reached past that grid was cropped by the viewBox, so
// the label did not look wrong, it silently vanished. Three of four diagrams in
// a real document lost a label that way.
//
// The invariants asserted here:
//   - every label plate is inside the viewBox, in all three kinds;
//   - no two label plates overlap (the loser is unreadable under the winner);
//   - a same-layer edge is a straight sibling arrow, not a trip out to the
//     back-edge channel and back with a reversed arrowhead;
//   - output stays byte-identical run to run, which is the file's headline
//     invariant and the thing a layout change is most likely to break.
//
// Pure asserts, no dependencies. Run via `npm test`.

import assert from "node:assert";
import { compile } from "../packages/core/src/index.mjs";

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`ok   - ${name}`);
  } catch (e) {
    fail++;
    console.error(`FAIL - ${name}\n       ${e.message}`);
  }
}

const doc = (body) =>
  `---\nmdp: 1\nforms: [page]\ntitle: diagram\n---\n\n# diagram\n\n${body}\n`;

const fence = (kind, lines) => "```mdp:diagram " + kind + "\n" + lines + "\n```";

function svgs(html) {
  return html.match(/<svg\b[\s\S]*?<\/svg>/g) || [];
}

function viewBox(svg) {
  const [x, y, w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  return { x, y, w, h };
}

function labelPlates(svg) {
  const out = [];
  const re =
    /<rect class="mdp-diagram-edge-label-bg" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/g;
  for (const m of svg.matchAll(re)) {
    const [x, y, w, h] = m.slice(1).map(Number);
    out.push({ x, y, w, h });
  }
  return out;
}

const overlaps = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function assertPlatesFit(svg, label) {
  const vb = viewBox(svg);
  for (const p of labelPlates(svg)) {
    assert.ok(
      p.x >= vb.x && p.y >= vb.y && p.x + p.w <= vb.x + vb.w && p.y + p.h <= vb.y + vb.h,
      `${label}: plate ${p.x},${p.y} ${p.w}x${p.h} falls outside viewBox ${vb.x} ${vb.y} ${vb.w} ${vb.h}`
    );
  }
}

function assertNoPlateOverlap(svg, label) {
  const plates = labelPlates(svg);
  for (let i = 0; i < plates.length; i++) {
    for (let j = i + 1; j < plates.length; j++) {
      assert.ok(
        !overlaps(plates[i], plates[j]),
        `${label}: plates ${i} and ${j} overlap, so one is unreadable`
      );
    }
  }
}

// The exact shape that lost its "signature" label: a fan-out whose two forward
// labels share a midpoint row, plus a same-layer edge between the two targets.
const FAN_OUT = fence(
  "flow",
  ["S: Services", "C: Agreement", "I: Invoice", "S -> C: totals", "S -> I: line items", "C -> I: signature"].join("\n")
);

check("flow: every label plate is inside the viewBox", () => {
  const [svg] = svgs(compile(doc(FAN_OUT), "page"));
  assert.ok(svg, "expected one svg");
  assert.equal(labelPlates(svg).length, 3, "expected three labels");
  assertPlatesFit(svg, "flow");
});

check("flow: no two label plates overlap", () => {
  const [svg] = svgs(compile(doc(FAN_OUT), "page"));
  assertNoPlateOverlap(svg, "flow");
});

check("flow: a same-layer edge is a straight sibling arrow", () => {
  const [svg] = svgs(compile(doc(FAN_OUT), "page"));
  // The old routing sent it out to the channel and back, which shows up as a
  // four-point polyline whose x overshoots the target and returns.
  const polylines = [...svg.matchAll(/<polyline class="mdp-diagram-edge[^"]*" points="([^"]+)"/g)].map(
    (m) => m[1]
  );
  for (const pts of polylines) {
    const xs = pts.split(/\s+/).map((p) => Number(p.split(",")[0]));
    const overshoots = xs.some((x, i) => i > 0 && i < xs.length - 1 && x > Math.max(xs[0], xs.at(-1)));
    assert.ok(!overshoots, `sibling edge routed past its target: ${pts}`);
  }
});

check("flow: a long label on a back edge does not get cropped", () => {
  // A back edge parks its label on the channel, hard against the frame, which
  // is where the original bug bit hardest.
  const back = fence(
    "flow",
    ["A: Draft", "B: Review", "A -> B", "B -> A: needs another pass"].join("\n")
  );
  const [svg] = svgs(compile(doc(back), "page"));
  assert.ok(labelPlates(svg).length >= 1, "expected a back-edge label");
  assertPlatesFit(svg, "flow back edge");
});

check("tree: label plates fit and do not collide", () => {
  const tree = fence(
    "tree",
    ["root: Engine", "root -> a: Resolve the document", "root -> b: Validate the graph"].join("\n")
  );
  const [svg] = svgs(compile(doc(tree), "page"));
  assertPlatesFit(svg, "tree");
  assertNoPlateOverlap(svg, "tree");
});

check("sequence: label plates fit and do not collide", () => {
  const seq = fence(
    "sequence",
    [
      "actor G: Gateway",
      "actor A: Application",
      "G -> A: a webhook delivered twice",
      "A -> G: acknowledged once",
    ].join("\n")
  );
  const [svg] = svgs(compile(doc(seq), "page"));
  assertPlatesFit(svg, "sequence");
  assertNoPlateOverlap(svg, "sequence");
});

check("output stays byte-identical across runs", () => {
  const a = compile(doc(FAN_OUT), "page");
  const b = compile(doc(FAN_OUT), "page");
  assert.equal(a, b, "two compiles of one source diverged");
});

check("geometry stays integral", () => {
  const [svg] = svgs(compile(doc(FAN_OUT), "page"));
  for (const m of svg.matchAll(/(?:x|y|width|height|x1|y1|x2|y2)="(-?[\d.]+)"/g)) {
    const v = Number(m[1]);
    assert.ok(Number.isInteger(v), `non-integer coordinate ${v} breaks byte-stability`);
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
