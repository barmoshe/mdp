// demo.mjs: render a sample resume into dist/preview.html. Self-contained: it uses
// a literal IR (the shape mdp-compiler's parse() returns) and the vendored
// _tokens.mjs baseStyle, so it runs with no mdp-compiler install. In real use an
// artifact consumes the public parser: renderResume(parse(source)). Preview only.

import { mkdirSync, writeFileSync } from "node:fs";
import { renderResume } from "./src/index.mjs";

const ir = {
  meta: { title: "Ada Lovelace", theme: "studio" },
  blocks: [
    { type: "title", text: "Ada Lovelace" },
    { type: "lead", text: "Analyst and writer on the reach of computing. London." },
    {
      type: "stats",
      items: [
        { label: "Focus", value: "Computing" },
        { label: "Languages", value: "English, French" },
      ],
    },
    { type: "heading", text: "Experience" },
    {
      type: "list",
      ordered: false,
      items: [
        "Wrote the notes on the Analytical Engine, including the first published algorithm.",
        "Translated and extended Menabrea's memoir on the engine.",
      ],
    },
    { type: "heading", text: "Writing" },
    { type: "paragraph", text: "Essays arguing the engine could go **beyond pure calculation**." },
  ],
};

mkdirSync("dist", { recursive: true });
writeFileSync("dist/preview.html", renderResume(ir));
console.log("Wrote dist/preview.html");
