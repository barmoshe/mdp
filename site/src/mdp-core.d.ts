// Ambient types for the engine the playground bundles. `@mdp/core` is plain
// ESM with no shipped types; the hub only needs the compile surface, so this
// declares exactly what it imports. It mirrors packages/core/src/index.mjs.
declare module "@mdp/core" {
  /** Compile an MDP source string into the standalone HTML for one artifact. */
  export function compile(source: string, artifact?: string): string;
  /** Parse an MDP source into the semantic representation (the typed tree). */
  export function parse(source: string): unknown;
  /** The artifacts this engine can compile: ["page", "slides", "flyer"]. */
  export const ARTIFACTS: string[];
  /** The curated theme names: ["studio", "teal", "amber", "violet", "rose", "mono"]. */
  export const THEMES: string[];
  /** The default theme name ("studio"). */
  export const DEFAULT_THEME: string;
}
