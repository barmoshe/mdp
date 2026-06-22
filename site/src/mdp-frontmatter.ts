// Shared frontmatter readers/writers for the .mdp source string. Lifted out of
// Playground.tsx so the Brand section can drive the same theme / brand-accent /
// brand-accent-2 / brand-font edits through one source of truth (no second,
// drifting copy of the rewrite logic). Pure string transforms, no engine calls.
import { THEMES, DEFAULT_THEME } from "mdp-compiler";

// Read the theme the source currently declares, so a theme control stays in
// sync with the editor (the editor is the single source of truth).
export function currentTheme(src: string): string {
  const m = src.match(/^theme:[ \t]*(\S+)/m);
  return m && THEMES.includes(m[1]) ? m[1] : DEFAULT_THEME;
}

// Rewrite the frontmatter theme line so picking a theme is one click. If the
// source has no theme line yet, insert one after `mdp:`.
export function withTheme(src: string, theme: string): string {
  if (/^theme:[ \t]*\S+/m.test(src)) {
    return src.replace(/^theme:[ \t]*\S+.*$/m, `theme: ${theme}`);
  }
  return src.replace(/^(mdp:[ \t]*\d+.*)$/m, `$1\ntheme: ${theme}`);
}

// The brand colors the source currently declares (empty string when none), so the
// color inputs stay in sync with the editor.
export function currentAccent(src: string): string {
  const m = src.match(/^brand-accent:[ \t]*(#[0-9a-fA-F]{6})/m);
  return m ? m[1] : "";
}
export function currentAccent2(src: string): string {
  const m = src.match(/^brand-accent-2:[ \t]*(#[0-9a-fA-F]{6})/m);
  return m ? m[1] : "";
}

// Set, replace, or (with an empty value) remove a frontmatter line, inserting it
// after an anchor line when it does not exist yet. Used for every brand field.
function setFrontmatterLine(src: string, key: string, value: string, anchor: RegExp): string {
  const line = new RegExp(`^${key}:[ \\t]*\\S.*$`, "m");
  if (!value) return src.replace(new RegExp(`^${key}:[ \\t]*\\S.*$\\n?`, "m"), "");
  if (line.test(src)) return src.replace(line, `${key}: ${value}`);
  return src.replace(anchor, `$1\n${key}: ${value}`);
}
export function withAccent(src: string, hex: string): string {
  // anchor after `theme:`, else after `mdp:`
  const anchor = /^theme:[ \t]*\S+.*$/m.test(src) ? /^(theme:[ \t]*\S+.*)$/m : /^(mdp:[ \t]*\d+.*)$/m;
  return setFrontmatterLine(src, "brand-accent", hex, anchor);
}
export function withAccent2(src: string, hex: string): string {
  // anchor after `brand-accent:`, else `theme:`, else `mdp:`
  const anchor = /^brand-accent:[ \t]*\S+.*$/m.test(src)
    ? /^(brand-accent:[ \t]*\S+.*)$/m
    : /^theme:[ \t]*\S+.*$/m.test(src)
      ? /^(theme:[ \t]*\S+.*)$/m
      : /^(mdp:[ \t]*\d+.*)$/m;
  return setFrontmatterLine(src, "brand-accent-2", hex, anchor);
}

// The brand-font the source declares ("" for none/system, the theme default).
export function currentFont(src: string): string {
  const m = src.match(/^brand-font:[ \t]*([A-Za-z]+)/m);
  const k = m ? m[1].toLowerCase() : "";
  return k === "system" ? "" : k;
}
export function withFont(src: string, key: string): string {
  // anchor after the last brand line that exists, else theme, else mdp
  const anchor = /^brand-accent-2:[ \t]*\S+.*$/m.test(src)
    ? /^(brand-accent-2:[ \t]*\S+.*)$/m
    : /^brand-accent:[ \t]*\S+.*$/m.test(src)
      ? /^(brand-accent:[ \t]*\S+.*)$/m
      : /^theme:[ \t]*\S+.*$/m.test(src)
        ? /^(theme:[ \t]*\S+.*)$/m
        : /^(mdp:[ \t]*\d+.*)$/m;
  return setFrontmatterLine(src, "brand-font", key, anchor);
}
