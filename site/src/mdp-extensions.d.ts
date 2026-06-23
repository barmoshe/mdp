// Ambient types for the example extension packages the showcase imports. Each is
// plain ESM with no shipped types; the hub only needs their render surface, so this
// declares exactly what Extensions.tsx imports. Mirrors mdp-core.d.ts. The Vite
// alias (runtime) and the tsconfig paths (typecheck) map each specifier to
// extensions/<name>/src/index.mjs.

declare module "mdp-block-status" {
  /** Render a status-pills block (IR { type:"status", items:[{label,tone}] }) to
   *  an HTML fragment string. */
  export function renderStatus(block: unknown): string;
  /** The block's stylesheet (tokens only), injected alongside baseStyle. */
  export const STATUS_STYLE: string;
}

declare module "mdp-block-spec-sheet" {
  /** Render a spec-sheet block to an HTML fragment string. */
  export function renderSpecSheet(block: unknown): string;
  /** Parse a fenced body ("key: value" lines, optional "title:") into the IR node. */
  export function parseSpecSheet(body: string): unknown;
  /** The block's stylesheet (tokens only), injected alongside baseStyle. */
  export const SPEC_SHEET_STYLE: string;
}

declare module "mdp-artifact-resume" {
  /** Render the whole IR (from parse()) as a complete resume HTML document. */
  export function renderResume(ir: unknown): string;
  /** The artifact's layout stylesheet (tokens only). */
  export const RESUME_STYLE: string;
}
