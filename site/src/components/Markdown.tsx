import { useMemo } from "react";
import { marked } from "marked";

// GitHub-flavored Markdown, rendered to HTML. The docs content is static and
// authored in-repo (never user input), so rendering it directly is safe.
marked.setOptions({ gfm: true, breaks: false });

export default function Markdown({ source }: { source: string }) {
  const html = useMemo(() => marked.parse(source) as string, [source]);
  return <div className="doc-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
