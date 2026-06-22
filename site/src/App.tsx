import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Gap from "./components/Gap";
import Forms from "./components/Forms";
import Steps from "./components/Steps";
import Playground from "./components/Playground";
import Format from "./components/Format";
import Brand from "./components/Brand";
import Themes from "./components/Themes";
import Install from "./components/Install";
import Library from "./components/Library";
import Extend from "./components/Extend";
import FinalCta from "./components/FinalCta";
import Footer from "./components/Footer";
import Docs from "./components/Docs";
import { useReveal } from "./useReveal";

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

  // Wire the scroll-reveal motion across whichever view is mounted. Re-scans when
  // the routed view changes (home / docs / playground each mount different DOM).
  const viewKey = isPlayground ? "playground" : isDocs ? "docs" : "home";
  useReveal(viewKey);

  if (isPlayground) {
    const q = hash.includes("?")
      ? new URLSearchParams(hash.slice(hash.indexOf("?") + 1))
      : null;
    const initialId = q?.get("src") ?? undefined;
    const initialKind = q?.get("kind") ?? undefined;
    return (
      <>
        <Nav active="playground" />
        <main id="top" className="pg-page">
          <div className="pg-page-head wrap">
            <div className="masthead reveal">
              <p className="eyebrow eyebrow-accent">Live playground</p>
              <h1 className="h2">Change a line. Watch every form change.</h1>
            </div>
          </div>
          <div className="pg-page-stage">
            <Playground variant="full" initialId={initialId} initialKind={initialKind} />
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
      <main id="top">
        <Hero />
        <Gap />
        <Forms />
        <Steps />

        <section className="sec" id="playground">
          <div className="sec-rail-wide">
            <div className="masthead reveal">
              <p className="eyebrow eyebrow-accent">Live playground</p>
              <h2 className="h2">Change a line. Watch every form change.</h2>
            </div>
            <Playground variant="embed" />
          </div>
        </section>

        <Format />
        <Brand />
        <Themes />
        <Install />
        <Library />
        <Extend />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
