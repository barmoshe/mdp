import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Self-hosted variable fonts: Fraunces (display, with the optical-size axis) and
// Inter Tight (body/UI). Vite fingerprints the woff2 under /mdp/assets/. The
// browser only fetches the latin subset for this LTR English site.
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/inter-tight/index.css";

// The design system, split into layers and loaded in order: tokens, then the
// base primitives, then the components.
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
