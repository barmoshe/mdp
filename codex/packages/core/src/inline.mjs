// inline.mjs: inline Markdown to safe HTML.
//
// Contract: escape first, then apply a small, fixed set of inline marks. The
// source has no raw HTML by design (see SPEC "non-goals"), so the only HTML we
// ever emit is the escaped text plus the tags we generate here. That keeps the
// render path injection-safe.
//
// Supported marks (and only these):
//   **bold**      -> <strong>
//   *italic*      -> <em>
//   `code`        -> <code>
//   [text](url)   -> <a href="url">text</a>

// Escape the five HTML-significant characters.
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escape a string for use inside a double-quoted HTML attribute, and defang
// dangerous URL schemes so a link can never smuggle script in. Only http(s),
// mailto, relative, and anchor URLs pass through; anything else is dropped to
// "#".
function safeUrl(raw) {
  const url = String(raw).trim();
  const lower = url.toLowerCase();
  const ok =
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("/") ||
    lower.startsWith("#") ||
    lower.startsWith("./") ||
    lower.startsWith("../");
  const cleaned = ok ? url : "#";
  return escapeHtml(cleaned);
}

// Render inline marks. Operates on already-escaped text so the regexes never
// see real angle brackets. Order matters: code spans are extracted first and
// parked as placeholders so their contents are not re-processed.
export function inline(text) {
  let out = escapeHtml(text);

  // 1. Code spans: pull them out so their bodies are not touched by other
  //    marks. Use a private-use-area placeholder that cannot occur in source.
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_m, body) => {
    codes.push(body);
    return `${codes.length - 1}`;
  });

  // 2. Links: [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
    return `<a href="${safeUrl(url)}">${label}</a>`;
  });

  // 3. Bold: **text** (before italics, so ** is not eaten by *).
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 4. Italic: *text*
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // 5. Restore code spans.
  out = out.replace(/(\d+)/g, (_m, i) => `<code>${codes[Number(i)]}</code>`);

  return out;
}
