// Import doc pages as raw strings via Vite's ?raw suffix.
declare module "*.md?raw" {
  const content: string;
  export default content;
}
