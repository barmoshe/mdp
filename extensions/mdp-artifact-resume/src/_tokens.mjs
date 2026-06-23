// _tokens.mjs: a minimal slice of the MDP design system, vendored so this
// artifact renders a styled, standalone document with no @mdp/core install. It
// is intentionally small: one accent, the warm neutral ramp, the type + spacing
// scale, and a dark-mode flip.
//
// When @mdp/core is published, delete this file and import the real system:
//   import { baseStyle } from "@mdp/core";   // honors all 11 themes, light+dark
//
// The `theme` argument is accepted for API compatibility; this minimal copy uses
// a single accent regardless. The real baseStyle() resolves the named theme.

export function baseStyle(/* theme */) {
  return `:root {
  --mdp-font-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mdp-weight-normal: 400;
  --mdp-weight-medium: 500;
  --mdp-text-small: 0.9rem;
  --mdp-text-body: 1.0625rem;
  --mdp-text-h2: 1.5rem;
  --mdp-text-title: 2.5rem;
  --mdp-space-3: 0.75rem;
  --mdp-space-4: 1rem;
  --mdp-space-5: 1.5rem;
  --mdp-space-6: 2rem;
  --mdp-space-7: 3rem;
  --mdp-space-8: 4rem;
  --mdp-leading-body: 1.7;
  --mdp-leading-tight: 1.2;
  --mdp-bg: #fdfcfb;
  --mdp-surface: #f4f3f0;
  --mdp-ink: #1c1b19;
  --mdp-ink-soft: #56544f;
  --mdp-border: rgba(28, 27, 25, 0.12);
  --mdp-accent: #5b54d6;
  --mdp-accent-text: #4b44c0;
}
@media (prefers-color-scheme: dark) {
  :root {
    --mdp-bg: #141413;
    --mdp-surface: #1f1e1c;
    --mdp-ink: #f4f3f1;
    --mdp-ink-soft: #a8a59f;
    --mdp-border: rgba(244, 243, 241, 0.14);
  }
}
* { box-sizing: border-box; }
html { font-family: var(--mdp-font-sans); }
body { margin: 0; background: var(--mdp-surface); color: var(--mdp-ink); }`;
}
