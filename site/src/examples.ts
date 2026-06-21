// The starter sources for the playground. The first two are the repo's own
// examples (examples/comparison.mdp and examples/tidewater.mdp) so the hub and
// the CLI show the same thing. The third is a short release note, to exercise a
// different mix of blocks (stats, tip and warning callouts, a quote).

export type Example = { id: string; label: string; source: string };

const comparison = `---
mdp: 1
theme: studio
forms: [page, slides, flyer]
kicker: Decision brief
title: Two ways to run the nightly digest
---

# Two ways to run the nightly digest
{.lead} Both paths produce the same email and use the same model. They differ in where the work runs and who maintains it.

\`\`\`mdp:flow
Collect the day's data -> The model writes the summary -> Send one message
\`\`\`

---

\`\`\`mdp:compare
# Managed platform
badge: no code
note: A visual builder. The pipeline is boxes wired together.
cta: [See the scenario](https://example.com/managed)
- See and edit the pipeline yourself, no code.
- Runs on a third-party platform and account.

# Self-hosted script
badge: in your stack
note: A small script that runs inside your own environment.
cta: [See the project](https://example.com/self-hosted)
- Everything stays in your account, no extra subscription.
- A maintainer keeps the code current for you.
\`\`\`

---

:::callout cost
Neither option is entirely free. Both need a model API key, a few dollars a month. The managed platform also runs on paid credits beyond a small free tier; the self-hosted script runs free inside your own environment.
:::

:::callout recommendation
Recommendation: start self-hosted, since everything stays in your account with no platform cost. Move to the managed platform later if you would rather see and edit the pipeline yourself.
:::

---

## Built and tested
Both options were built and verified on real data before this brief.
`;

const tidewater = `---
mdp: 1
theme: teal
forms: [page, slides, flyer]
title: Tidewater Coffee
---

# Tidewater Coffee
{.lead} A single-origin subscription for people who care where their coffee comes from.

---

## The opportunity
Specialty coffee at home grew 34% in two years, but most subscriptions still
ship anonymous blends. Drinkers who want single-origin beans and a story behind
them are underserved.

---

## Who it's for
- Home brewers who already own a grinder
- Gift buyers looking for something with a narrative
- Office managers stocking a better break room

---

## Early numbers
\`\`\`mdp:stats
Trial to paid: 41%
Monthly churn: 4.2%
Avg order value: $28
\`\`\`

---

> "I finally know the name of the farm in my cup."
> {.cite} Pilot subscriber, week 3

---

## Next steps
Lock the three launch origins, finalize packaging, and open the waitlist by the
end of the month.
`;

const release = `---
mdp: 1
theme: amber
forms: [page, slides, flyer]
kicker: Release
title: Orchard 2.0 is live
---

# Orchard 2.0 is live
{.lead} A faster core, a calmer interface, and one number that finally moved.

\`\`\`mdp:stats
Build time: 1.2s
Bundle size: 96 kB
Lighthouse: 100
\`\`\`

---

:::callout tip
Upgrade in one step: pull main and rebuild. No config changes are needed.
:::

:::callout warning
The legacy export flag is removed. Switch to the new command before you upgrade.
:::

---

> "It feels like the app lost ten pounds."
> {.cite} Early tester, release week
`;

export const EXAMPLES: Example[] = [
  { id: "comparison", label: "Decision brief", source: comparison },
  { id: "tidewater", label: "Product brief", source: tidewater },
  { id: "release", label: "Release note", source: release },
];
