import { useEffect } from "react";

// Wire the .reveal / .reveal-stagger CSS (defined in base.css) to an
// IntersectionObserver. Those classes hold content at opacity 0 by design;
// without this hook nothing ever sets `is-revealed`, so the content stays
// invisible. Re-scans whenever `key` changes (the routed view), so sections
// mounted by a new view get observed. Honors prefers-reduced-motion by
// revealing everything at once (the CSS kill switch forces visibility too, so
// this is belt-and-braces and keeps things visible if the observer is absent).
export function useReveal(key: string): void {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal, .reveal-stagger"),
    );
    if (nodes.length === 0) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -10% 0px" },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [key]);
}
