---
name: design-web-prototype
description: 'General-purpose desktop web prototype as one self-contained HTML artifact. Built by copying the seed `assets/template.html` and pasting section skeletons from `references/layouts.md` — never CSS from scratch. The FALLBACK generator for any page with no more specific skill: docs index, portfolio, homepage, generic marketing/editorial page, one-off mockup. Use when the user says "prototype", "mockup", "single page", "homepage", "wireframe this". Do NOT trigger when a specialist matches — SaaS landing (design-saas-landing), pricing (design-pricing-page), article (design-blog-post), deck (design-simple-deck), dashboard (design-dashboard) — nor for changes to an existing artifact (design-tweaks) or a review of one (design-critique).'
---

# design-web-prototype

The fallback page generator — compose the bundled seed + layout library into one self-contained HTML prototype. Never write CSS from scratch; the seed already encodes the defaults (typography, spacing, accent budget).

## Resource map

```
design-web-prototype/
├── SKILL.md                ← you are here
├── assets/
│   └── template.html       ← seed: tokens + class system + chrome (READ FIRST)
└── references/
    ├── layouts.md          ← 8 paste-ready section skeletons + class inventory
    └── checklist.md        ← P0/P1/P2 self-review + anti-slop spot-check
```

## When to use

- "mock up a page for X" / "prototype the homepage" / "single-page site for Y"
- "docs index page" / "portfolio page" / any page with no specialist skill

Do NOT trigger for:
- SaaS product landing — `design-saas-landing`. Pricing — `design-pricing-page`.
- Article/blog — `design-blog-post`. Deck — `design-simple-deck`. Dashboard — `design-dashboard`.
- "adjust the prototype you made" — `design-tweaks`. "review this prototype" — `design-critique`.

## Process

1. **Pre-flight (once, before writing anything):**
   1. Read `assets/template.html` end-to-end, at minimum through the `<style>` block. Every class in the inventory at the top of `references/layouts.md` must be defined there; if one is missing, add it to `<style>` — never re-define inline per section.
   2. Read `references/layouts.md` — know the 8 skeletons. Don't invent a section type; pick the closest layout and adapt.
   3. Read root `DESIGN.md` (repo root, next to CLAUDE.md). Map its colors onto the six `:root` variables in the seed (`--bg --fg --muted --border --accent --surface`); don't introduce new tokens. If DESIGN.md is missing → stop, tell the user to run `/use-design <brand>`.
2. **Copy the seed.** Start from `assets/template.html` as the artifact body. Replace the six `:root` variables with the brand tokens, the `<title>`, and the topnav brand.
3. **Plan the section list before writing copy.** Default rhythms from `layouts.md`:

   | Page kind | Default rhythm |
   |---|---|
   | Landing-ish | 1 hero → 3 features → 4 stats *or* 5 quote → split → 6 cta |
   | Marketing / editorial | 1 hero-center → 7 log list → 6 cta |
   | Pricing-ish (when not routed to specialist) | 1 hero-center → 8 comparison table → 6 cta |
   | Docs index | 1 hero-center → 7 log list → 6 cta |

   **State the chosen list to the user in one sentence before writing** — they can redirect cheaply now, not after 200 lines of HTML.
4. **Paste and fill.** Copy each chosen `<section>` block from `layouts.md` into `<main id="content">`. Replace every bracketed `[REPLACE]` string with real, specific copy from the brief. No filler — if a slot stays empty, the section is the wrong choice; pick a different layout.
5. **Self-check.** Run `references/checklist.md` top to bottom. Every P0 must pass (no raw hex outside `:root`, serif display font, accent ≤ 2 per screen, no emoji icons, no invented metrics, `data-od-id` on every section, mobile reflow intact, no `scrollIntoView()`). Finish with the anti-slop spot-check.
6. **Emit the artifact** per the contract below.

## Hard rules (the seed protects most of these — don't fight it)

- **Single accent, at most twice per screen.** Eyebrow + primary CTA is the default budget.
- **Display font is serif** (Iowan Old Style / Charter / Georgia in the seed) unless DESIGN.md overrides. Sans for body, mono for numerics/captions/eyebrows.
- **Image placeholders, not external URLs.** Use `.ph-img` — never link a stock-photo CDN. No external network requests of any kind.
- **Mobile reflow ships with the seed** (media query at 920px). Don't break it with fixed widths.
- **`data-od-id` on every `<section>`** so comment mode can target it.

## Output contract

```
<artifact identifier="kebab-case-slug" type="text/html" title="Human Title">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.

## Example — section plan + skeleton of a great result

```
Plan (stated to user first): "Docs index for the gws CLI —
hero-center → log list of 6 doc sections → cta-strip."

<main id="content">
  <section class="section hero" data-od-id="hero">
    <div class="container hero-center">
      <p class="eyebrow">GWS CLI · DOCS</p>                <!-- accent use 1 -->
      <h1>Every Workspace surface, one binary.</h1>
      <p class="lead">Auth once, then script Gmail, Calendar, Drive, Sheets.</p>
    </div>
  </section>
  <section class="section" data-od-id="doc-list">
    <div class="container stack">
      6 × <div class="log-row"><span class="num">01</span> Getting started · 1-line excerpt</div>
    </div>
  </section>
  <section class="section" data-od-id="cta">
    <div class="container row-between">Install in 60 seconds
      <button class="btn btn-primary">brew install gws</button></div>  <!-- accent use 2 -->
  </section>
</main>
```

## Failure modes

| Symptom | Fix |
|---------|-----|
| Root `DESIGN.md` missing | Stop. Tell user: `/use-design <brand>` |
| Needed class not in seed | Add it to the seed's `<style>` block once — never inline per section |
| No layout fits the section | Adapt the closest skeleton; don't hand-roll a new section type |
| Brief is one vague noun | Propose a section plan and ask for a one-line confirm before filling copy |
| Specialist skill matches better mid-task | Say so and switch — don't build a worse pricing page here |
