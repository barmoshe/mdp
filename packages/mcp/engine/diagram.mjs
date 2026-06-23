// diagram.mjs: the `diagram` block primitive — native, zero-dependency SVG.
//
// MDP renders connector diagrams ITSELF, to pure inline SVG with a deterministic
// layout, instead of bundling a diagram library (Mermaid et al. need a DOM/headless
// browser and drift across versions). A small Mermaid-inspired text syntax names a
// `kind` and a set of nodes + edges; the engine lays them out and emits one <svg>.
//
// Three kinds ship today: `flow` (layered boxes + directed arrows), `sequence`
// (actors as lifelines + ordered messages), and `tree` (a tidy node hierarchy).
// MORE KINDS ARE PLANNED (gantt, state, ER); each is a new layout function behind
// the same `kind` dispatch, so adding one is additive and touches nothing else.
//
// Invariants this file keeps:
//   - Deterministic: integer coordinates only, NO trigonometry (connectors are
//     axis-aligned orthogonal elbows, arrowheads are axis-aligned triangles), so
//     the markup is byte-identical run to run AND across platforms.
//   - Design-locked: SVG carries geometry only; every colour comes from a CSS class
//     bound to a --mdp-* token below. The author sets no colour/size/font.
//   - Graceful: an unknown kind never reaches here (parse degrades it to text); an
//     empty diagram renders nothing.
//   - RTL note (v1): diagrams render left-to-right; SVG geometry is not logical-
//     property aware, so RTL mirroring is deferred (documented future work).
//
// IR shape (from parse.mjs):
//   { type: 'diagram', kind: 'flow'|'sequence'|'tree',
//     nodes: [ { id, label } ], edges: [ { from, to, label, dashed } ] }

import { escapeHtml } from "./inline.mjs";

// The kinds the engine lays out. parse.mjs validates against this; an unlisted
// kind degrades to readable text rather than reaching the renderer.
export const DIAGRAM_KINDS = ["flow", "sequence", "tree"];

// Layout constants, in SVG user units (the <svg> scales to its container via the
// viewBox). Integers keep every emitted coordinate byte-stable.
const FONT_SIZE = 14;
const CHAR_ADVANCE = 7.3; // estimated advance for the locked sans (no DOM to measure)
const NODE_H = 44;
const PAD_X = 16;
const MIN_W = 72;
const H_GAP = 40; // gap between sibling boxes / lifelines
const V_GAP = 44; // gap between layers / message rows
const MARGIN = 16;
const ARROW = 9; // arrowhead half-extent

// The shared diagram stylesheet, injected by each renderer that can emit a
// diagram. Colour lives here (token-bound classes); the markup is geometry only.
export const DIAGRAM_STYLE = `.mdp-diagram { margin: 0; }
.mdp-diagram-svg {
  display: block;
  inline-size: 100%;
  block-size: auto;
  max-inline-size: 100%;
  font-family: var(--mdp-font-sans);
  font-size: ${FONT_SIZE}px;
}
.mdp-diagram-node {
  fill: var(--mdp-surface);
  stroke: var(--mdp-border);
  stroke-width: 1;
}
.mdp-diagram-label { fill: var(--mdp-ink); }
.mdp-diagram-edge {
  fill: none;
  stroke: var(--mdp-accent);
  stroke-width: 1.5;
}
.mdp-diagram-edge.is-dashed { stroke-dasharray: 5 4; }
.mdp-diagram-arrow { fill: var(--mdp-accent); stroke: none; }
.mdp-diagram-lifeline {
  fill: none;
  stroke: var(--mdp-border);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}
.mdp-diagram-edge-label { fill: var(--mdp-ink-soft); }
.mdp-diagram-edge-label-bg { fill: var(--mdp-bg); }`;

// Estimate a box width from the label length. No DOM to measure text, so this is a
// fixed-advance estimate (very long labels may overflow; acceptable for v1).
function boxWidth(label) {
  return Math.max(MIN_W, Math.round(String(label).length * CHAR_ADVANCE) + PAD_X * 2);
}

// A node: a rounded rect with a centred label (centred without measuring via
// text-anchor + dominant-baseline). x,y is the top-inline-start corner.
function nodeBox(x, y, w, label) {
  const cx = x + Math.round(w / 2);
  const cy = y + Math.round(NODE_H / 2);
  return (
    `<rect class="mdp-diagram-node" x="${x}" y="${y}" width="${w}" height="${NODE_H}" rx="8"/>\n` +
    `<text class="mdp-diagram-label" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central">${escapeHtml(label)}</text>`
  );
}

// An axis-aligned arrowhead (a triangle) whose tip is at (tx,ty), pointing one of
// up/down/left/right. No trig: the three points are offsets along the two axes.
function arrowHead(tx, ty, dir) {
  let pts;
  if (dir === "down") pts = `${tx},${ty} ${tx - ARROW},${ty - ARROW} ${tx + ARROW},${ty - ARROW}`;
  else if (dir === "up") pts = `${tx},${ty} ${tx - ARROW},${ty + ARROW} ${tx + ARROW},${ty + ARROW}`;
  else if (dir === "right") pts = `${tx},${ty} ${tx - ARROW},${ty - ARROW} ${tx - ARROW},${ty + ARROW}`;
  else pts = `${tx},${ty} ${tx + ARROW},${ty - ARROW} ${tx + ARROW},${ty + ARROW}`;
  return `<polygon class="mdp-diagram-arrow" points="${pts}"/>`;
}

// An orthogonal elbow connector from (x1,y1) to (x2,y2): a straight line when the
// columns align, else a vertical-horizontal-vertical step through the mid-row.
function elbow(x1, y1, x2, y2, dashed = "") {
  if (x1 === x2) {
    return `<line class="mdp-diagram-edge${dashed}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  const my = Math.round((y1 + y2) / 2);
  return `<polyline class="mdp-diagram-edge${dashed}" points="${x1},${y1} ${x1},${my} ${x2},${my} ${x2},${y2}"/>`;
}

// A small label sitting on its own background plate so a connector does not read
// through it. Width is estimated from the text length (no DOM).
function edgeLabel(cx, cy, label) {
  const text = String(label);
  const w = Math.round(text.length * CHAR_ADVANCE) + 8;
  const h = FONT_SIZE + 6;
  const x = cx - Math.round(w / 2);
  const y = cy - Math.round(h / 2);
  return (
    `<rect class="mdp-diagram-edge-label-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>\n` +
    `<text class="mdp-diagram-edge-label" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central">${escapeHtml(text)}</text>`
  );
}

// sequence: actors as columns with dashed lifelines, messages as ordered arrows.
// Layout is trivial and fully deterministic — the most robust kind.
function layoutSequence(nodes, edges) {
  const widths = nodes.map((n) => boxWidth(n.label));
  const centers = [];
  const COL_GAP = 96;
  let x = MARGIN;
  for (let i = 0; i < nodes.length; i++) {
    centers[i] = x + Math.round(widths[i] / 2);
    x += widths[i] + COL_GAP;
  }
  const totalW = x - COL_GAP + MARGIN;
  const index = new Map(nodes.map((n, i) => [n.id, i]));

  const firstMsgY = MARGIN + NODE_H + 28;
  const ROW = V_GAP;
  const lifelineBottom = firstMsgY + Math.max(edges.length, 1) * ROW;
  const totalH = lifelineBottom + MARGIN;

  const parts = [];
  for (let i = 0; i < nodes.length; i++) {
    parts.push(
      `<line class="mdp-diagram-lifeline" x1="${centers[i]}" y1="${MARGIN + NODE_H}" x2="${centers[i]}" y2="${lifelineBottom}"/>`
    );
  }
  for (let i = 0; i < nodes.length; i++) {
    parts.push(nodeBox(centers[i] - Math.round(widths[i] / 2), MARGIN, widths[i], nodes[i].label));
  }
  edges.forEach((e, j) => {
    const fi = index.get(e.from);
    const ti = index.get(e.to);
    if (fi == null || ti == null) return;
    const y = firstMsgY + j * ROW;
    const dashed = e.dashed ? " is-dashed" : "";
    if (fi === ti) {
      const x0 = centers[fi];
      const w = 38;
      parts.push(
        `<polyline class="mdp-diagram-edge${dashed}" points="${x0},${y} ${x0 + w},${y} ${x0 + w},${y + 16} ${x0},${y + 16}"/>`
      );
      parts.push(arrowHead(x0, y + 16, "left"));
      if (e.label) parts.push(edgeLabel(x0 + w, y - 6, e.label));
    } else {
      const x1 = centers[fi];
      const x2 = centers[ti];
      parts.push(`<line class="mdp-diagram-edge${dashed}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`);
      parts.push(arrowHead(x2, y, x2 > x1 ? "right" : "left"));
      if (e.label) parts.push(edgeLabel(Math.round((x1 + x2) / 2), y - 10, e.label));
    }
  });
  return { w: totalW, h: totalH, inner: parts.join("\n") };
}

// tree: a tidy hierarchy. Leaves take sequential inline slots; a parent centres
// over its children. Depth sets the row. Deterministic post-order placement.
function layoutTree(nodes, edges) {
  const index = new Map(nodes.map((n, i) => [n.id, i]));

  // Tree semantics: the trailing label in `parent -> child: Name` NAMES THE CHILD;
  // it is not a label on the connector. A hierarchy has named nodes, not labeled
  // edges. The parser is kind-agnostic, so it parks that text on the edge and
  // defaults a never-declared child's label to its id — which, in a tree, renders
  // bare ids in the boxes and stacks the real names as edge labels at sibling
  // midpoints, where they collide and clip. Here, where we know this is a tree, we
  // fold each such label into its still-unnamed child and clear it from the edge.
  // An explicit `child: Name` declaration wins (its label differs from the id); a
  // genuine edge label on an already-named child is left intact.
  const display = nodes.map((n) => n.label);
  const edgeText = edges.map((e) => e.label);
  for (let j = 0; j < edges.length; j++) {
    const t = index.get(edges[j].to);
    if (t == null || !edgeText[j]) continue;
    if (display[t] === nodes[t].id) {
      display[t] = edgeText[j];
      edgeText[j] = null;
    }
  }

  const children = nodes.map(() => []);
  const indeg = nodes.map(() => 0);
  for (const e of edges) {
    const f = index.get(e.from);
    const t = index.get(e.to);
    if (f == null || t == null) continue;
    children[f].push(t);
    indeg[t]++;
  }
  let roots = nodes.map((_, i) => i).filter((i) => indeg[i] === 0);
  if (!roots.length) roots = [0];

  const widths = nodes.map((_, i) => boxWidth(display[i]));
  const depth = nodes.map(() => 0);
  const cx = nodes.map(() => 0);
  const placed = nodes.map(() => false);
  let leafX = MARGIN;

  function place(i, d) {
    placed[i] = true;
    depth[i] = d;
    const kids = children[i].filter((k) => !placed[k]);
    if (!kids.length) {
      cx[i] = leafX + Math.round(widths[i] / 2);
      leafX += widths[i] + H_GAP;
      return cx[i];
    }
    const xs = kids.map((k) => place(k, d + 1));
    cx[i] = Math.round((xs[0] + xs[xs.length - 1]) / 2);
    return cx[i];
  }
  for (const r of roots) if (!placed[r]) place(r, 0);
  for (let i = 0; i < nodes.length; i++) if (!placed[i]) place(i, 0);

  const maxDepth = Math.max(...depth, 0);
  const rowH = NODE_H + V_GAP;
  const yOf = (d) => MARGIN + d * rowH;
  const totalW = leafX - H_GAP + MARGIN;
  const totalH = MARGIN + (maxDepth + 1) * NODE_H + maxDepth * V_GAP + MARGIN;

  const parts = [];
  for (let j = 0; j < edges.length; j++) {
    const f = index.get(edges[j].from);
    const t = index.get(edges[j].to);
    if (f == null || t == null) continue;
    const py = yOf(depth[f]) + NODE_H;
    const ty = yOf(depth[t]);
    parts.push(elbow(cx[f], py, cx[t], ty, edges[j].dashed ? " is-dashed" : ""));
    parts.push(arrowHead(cx[t], ty, "down"));
    if (edgeText[j]) parts.push(edgeLabel(Math.round((cx[f] + cx[t]) / 2), Math.round((py + ty) / 2), edgeText[j]));
  }
  for (let i = 0; i < nodes.length; i++) {
    parts.push(nodeBox(cx[i] - Math.round(widths[i] / 2), yOf(depth[i]), widths[i], display[i]));
  }
  return { w: totalW, h: totalH, inner: parts.join("\n") };
}

// flow: a layered graph, top to bottom. Layer = shortest path (BFS) from a source,
// which is bounded by the node count and cycle-safe (a back edge never lowers a
// layer, so a cycle cannot blow up the diagram the way longest-path would). Layers
// centre horizontally.
function layoutFlow(nodes, edges) {
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const adj = nodes.map(() => []);
  const indeg = nodes.map(() => 0);
  for (const e of edges) {
    const f = index.get(e.from);
    const t = index.get(e.to);
    if (f == null || t == null) continue;
    adj[f].push(t);
    indeg[t]++;
  }
  const layer = nodes.map(() => -1);
  const queue = [];
  nodes.forEach((_, i) => {
    if (indeg[i] === 0) {
      layer[i] = 0;
      queue.push(i);
    }
  });
  if (!queue.length) {
    layer[0] = 0; // every node is in a cycle: seed from the first node
    queue.push(0);
  }
  for (let qi = 0; qi < queue.length; qi++) {
    const u = queue[qi];
    for (const v of adj[u]) {
      if (layer[v] === -1) {
        layer[v] = layer[u] + 1;
        queue.push(v);
      }
    }
  }
  for (let i = 0; i < nodes.length; i++) if (layer[i] === -1) layer[i] = 0;

  const maxLayer = Math.max(...layer, 0);
  const byLayer = Array.from({ length: maxLayer + 1 }, () => []);
  nodes.forEach((n, i) => byLayer[layer[i]].push(i));

  const widths = nodes.map((n) => boxWidth(n.label));
  const layerW = byLayer.map(
    (idxs) => idxs.reduce((s, i) => s + widths[i], 0) + Math.max(idxs.length - 1, 0) * H_GAP
  );
  const maxW = Math.max(...layerW, 0);
  // Back edges (target on the same or an earlier layer) route up a reserved
  // channel to the inline-end so they never hide under the forward chain.
  const hasBack = edges.some((e) => {
    const f = index.get(e.from);
    const t = index.get(e.to);
    return f != null && t != null && layer[t] <= layer[f];
  });
  const channelX = MARGIN + maxW + 18;
  const totalW = hasBack ? channelX + MARGIN : MARGIN * 2 + maxW;

  const cx = nodes.map(() => 0);
  byLayer.forEach((idxs, d) => {
    let x = MARGIN + Math.round((maxW - layerW[d]) / 2);
    for (const i of idxs) {
      cx[i] = x + Math.round(widths[i] / 2);
      x += widths[i] + H_GAP;
    }
  });
  const rowH = NODE_H + V_GAP;
  const yOf = (d) => MARGIN + d * rowH;
  const totalH = MARGIN + (maxLayer + 1) * NODE_H + maxLayer * V_GAP + MARGIN;

  const parts = [];
  for (const e of edges) {
    const f = index.get(e.from);
    const t = index.get(e.to);
    if (f == null || t == null) continue;
    const dashed = e.dashed ? " is-dashed" : "";
    if (layer[t] > layer[f]) {
      // forward: leave the source bottom, enter the target top (arrow down).
      const py = yOf(layer[f]) + NODE_H;
      const ty = yOf(layer[t]);
      parts.push(elbow(cx[f], py, cx[t], ty, dashed));
      parts.push(arrowHead(cx[t], ty, "down"));
      if (e.label) parts.push(edgeLabel(Math.round((cx[f] + cx[t]) / 2), Math.round((py + ty) / 2), e.label));
    } else {
      // back or same layer: out the source's inline-end, up the channel, into the
      // target's inline-end (arrow points back toward the box).
      const sy = yOf(layer[f]) + Math.round(NODE_H / 2);
      const ty = yOf(layer[t]) + Math.round(NODE_H / 2);
      const sx = cx[f] + Math.round(widths[f] / 2);
      const tx = cx[t] + Math.round(widths[t] / 2);
      parts.push(
        `<polyline class="mdp-diagram-edge${dashed}" points="${sx},${sy} ${channelX},${sy} ${channelX},${ty} ${tx},${ty}"/>`
      );
      parts.push(arrowHead(tx, ty, "left"));
      if (e.label) parts.push(edgeLabel(channelX, Math.round((sy + ty) / 2), e.label));
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    parts.push(nodeBox(cx[i] - Math.round(widths[i] / 2), yOf(layer[i]), widths[i], nodes[i].label));
  }
  return { w: totalW, h: totalH, inner: parts.join("\n") };
}

// Render a diagram block to one inline <svg>. Dispatches on kind; an empty diagram
// renders nothing (filtered by the caller). Edges are drawn before boxes so the
// boxes sit on top of the connectors.
export function renderDiagram(block) {
  const nodes = block.nodes || [];
  const edges = block.edges || [];
  if (!nodes.length) return "";

  let layout;
  if (block.kind === "sequence") layout = layoutSequence(nodes, edges);
  else if (block.kind === "tree") layout = layoutTree(nodes, edges);
  else layout = layoutFlow(nodes, edges);

  const title = `${block.kind} diagram, ${nodes.length} node${nodes.length === 1 ? "" : "s"}`;
  return (
    `<figure class="mdp-diagram">\n` +
    `<svg class="mdp-diagram-svg" viewBox="0 0 ${layout.w} ${layout.h}" role="img" aria-label="${escapeHtml(
      title
    )}" xmlns="http://www.w3.org/2000/svg">\n` +
    layout.inner +
    `\n</svg>\n</figure>`
  );
}
