# Themes and design

Color is owned entirely by the engine. The author selects a named theme, a vibe,
never a raw color. This is the whole point of MDP: the design lives in the
engine, not the source.

## The theme set

Set `theme` in the frontmatter to one of eleven curated palettes. Each is one
restrained accent over the shared warm-neutral ramp, ordered as a spectrum:

<div class="theme-gallery">
  <div class="theme-card"><span class="theme-chip" style="background:#5b54d6"></span><b>studio</b><span>Indigo. The default.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#2f6fd6"></span><b>ocean</b><span>A clean true blue.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#2f9183"></span><b>teal</b><span>A calm blue-green.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#2f7d46"></span><b>forest</b><span>A deep natural green.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#b5760f"></span><b>amber</b><span>A warm gold.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#b05c34"></span><b>terracotta</b><span>An earthy burnt clay.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#cf4633"></span><b>coral</b><span>A warm coral red.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#d34a63"></span><b>rose</b><span>A muted pink-red.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#9c3d6e"></span><b>plum</b><span>A deep berry.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#9145c8"></span><b>violet</b><span>A soft purple.</span></div>
  <div class="theme-card"><span class="theme-chip" style="background:#1c1b19;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)"></span><b>mono</b><span>Black-and-white, no accent.</span></div>
</div>

An unknown theme name falls back to `studio`. Try them live in the
[playground](#playground): click a swatch in the theme strip and watch the same
source recompose.

## The design lock

Every theme shares one system. The renderer guarantees it, and the author cannot
reach it:

- **Type.** Two font families only: one sans for body and UI, one serif reserved
  for the lead and quotes. Two weights only (regular and medium). One fixed
  modular scale. Strong, automatic hierarchy, so even a flatly written file reads
  with structure.
- **Color.** One warm neutral ink ramp plus a single restrained accent. Color
  encodes meaning, never decoration, and never colors a whole surface. The accent
  appears only in meaning-spots: links, the compare button, the recommendation
  callout, stat figures, the active slide dot, and flow arrows.
- **Space.** A single spacing scale. Whitespace is the primary structural device.
- **Restraint.** No gradients, no drop shadows, no decorative icons. Hierarchy
  comes from type and space.
- **Motion.** Minimal, and disabled under `prefers-reduced-motion`.
- **Accessibility.** WCAG AA contrast in light and dark, semantic HTML, and full
  keyboard navigation in the slides form.

## Light and dark

Every artifact ships both light and dark, switched automatically by
`prefers-color-scheme`. Each theme's accent has two shades, tuned so it passes
WCAG AA both as text on the background and as a fill behind near-white text.

## Why you cannot set colors

Because the author cannot style, the over-decorated, every-block-a-card,
multi-color look is impossible by construction. A flatly written file still reads
as designed. That discipline is enforced by the format, not by taste. Extending
the design is a deliberate, curated act, not a per-document free-for-all; see
[architecture](#/docs/architecture).
