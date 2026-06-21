// Ambient type for Vite's `?raw` imports of .mdp sources (mirrors docs/docs.d.ts).
declare module "*.mdp?raw" {
  const source: string;
  export default source;
}
