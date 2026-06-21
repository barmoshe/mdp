import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Playground from "./components/Playground";
import PlaygroundPreview from "./components/PlaygroundPreview";
import Pitch from "./components/Pitch";
import HowItWorks from "./components/HowItWorks";
import Blocks from "./components/Blocks";
import Tools from "./components/Tools";
import Roadmap from "./components/Roadmap";
import Footer from "./components/Footer";
import Docs from "./components/Docs";

// A tiny hash router. Routes start with "#/" (so "#/docs/blocks" is a route),
// while plain anchors like "#playground" stay in-page scroll on the home view.
// Hash routing keeps GitHub Pages happy with no server rewrites or 404 trick.
function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const isDocs = hash.startsWith("#/docs");
  const isPlayground = hash.startsWith("#/playground");

  if (isPlayground) {
    return (
      <>
        <Nav active="playground" />
        <main id="top" className="pg-page">
          <div className="pg-page-head wrap">
            <div className="section-head wrap-narrow">
              <p className="eyebrow eyebrow-accent">Live playground</p>
              <h1 className="h2">Edit a source, watch it compile</h1>
              <p className="lead">
                This runs the real engine, bundled straight from{" "}
                <code>packages/core</code>. Change the source, switch the form,
                pick a theme. The same source becomes all three artifacts.
              </p>
            </div>
          </div>
          <div className="pg-page-stage">
            <Playground variant="full" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isDocs) {
    const pageId = hash.replace(/^#\/docs\/?/, "") || "getting-started";
    return (
      <>
        <Nav isDocs />
        <main id="top">
          <Docs pageId={pageId} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main>
        <Hero />

        <section className="section" id="playground" style={{ borderTop: "1px solid var(--mdp-border)" }}>
          <div className="wrap">
            <div className="section-head wrap-narrow">
              <p className="eyebrow eyebrow-accent">Live playground</p>
              <h2 className="h2">One source, three artifacts</h2>
              <p className="lead">
                This runs the real engine from <code>packages/core</code>. See it
                here, then open the full playground for room to edit.
              </p>
            </div>
            <PlaygroundPreview />
          </div>
        </section>

        <Pitch />
        <HowItWorks />
        <Blocks />
        <Tools />
        <Roadmap />
      </main>
      <Footer />
    </>
  );
}
