// Ambient types for the engine the playground bundles. `mdp-compiler` is plain
// ESM with no shipped types; the hub only needs the compile surface, so this
// declares exactly what it imports. It mirrors packages/core/src/index.mjs.
declare module "mdp-compiler" {
  /** Compile an MDP source string into the standalone HTML for one artifact. */
  export function compile(source: string, artifact?: string): string;
  /** Parse an MDP source into the semantic representation (the typed tree). */
  export function parse(source: string): unknown;
  /** The artifacts this engine can compile: ["page", "slides", "flyer"]. */
  export const ARTIFACTS: string[];
  /** The curated theme names, in spectrum order: studio, ocean, teal, forest,
   *  amber, terracotta, coral, rose, plum, violet, mono. */
  export const THEMES: string[];
  /** The default theme name ("studio"). */
  export const DEFAULT_THEME: string;
  /** A light-mode swatch per theme (accent fill / wash / text), for showing
   *  what each theme looks like in a picker. Keyed by theme name. */
  export const THEME_SWATCHES: Record<
    string,
    { fill: string; surface: string; text: string }
  >;
}
