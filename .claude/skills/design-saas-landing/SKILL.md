---
name: design-saas-landing
description: 'Generates a single-page SaaS/product landing as one self-contained HTML artifact — hero with dual CTAs, 3–6 feature tiles, social proof, optional pricing tiers, footer CTA band. Reads brand tokens from root DESIGN.md; emits between <artifact> tags. Use when the brief asks for a "saas landing", "product landing", "marketing page", "homepage for the product", or "launch page". Do NOT trigger for a standalone pricing page (design-pricing-page), long-form articles (design-blog-post), decks (design-simple-deck), generic non-SaaS mockups (design-web-prototype is the fallback), changes to an existing landing (design-tweaks), or a review of one (design-critique).'
---

# design-saas-landing

One single-page SaaS landing — hero, features, proof, optional pricing, CTA — on the active brand.

## When to use

- "landing page for X" / "marketing page for the product" / "launch page"
- "homepage for my SaaS" / "product page with pricing and testimonials"

Do NOT trigger for:
- A dedicated pricing page — `design-pricing-page`.
- Editorial/article pages — `design-blog-post`. Decks — `design-simple-deck`.
- Docs pages, portfolios, non-product pages — `design-web-prototype` (the general fallback).
- "make the hero shorter" on an existing artifact — `design-tweaks`.
- "what do you think of this landing" — `design-critique`.

## Process

1. **Read root `DESIGN.md`** (repo root, next to CLAUDE.md). Extract palette, display/body fonts, grid + max-width, spacing, component patterns, depth rules. If missing → stop, tell the user to run `/use-design <brand>` (library at `<workspace.root>/<workspace.resources>/design-systems/`).
2. **Extract from the brief:** product name, one-line value proposition, target buyer, whether pricing belongs on the page. If the brief gives none of these, ask one question: "what is the product and what is the one-line pitch?" Everything else you can generate plausibly.
3. **Build sections in this exact order:**
   1. **Hero** — wordmark, headline (≤ 14 words, display font), 1–2 sentence subhead, primary CTA + secondary CTA.
   2. **Features** — 3–6 tiles: inline-SVG monoline icon, short title, 1–2 sentence body naming user value, not technology. No emoji icons.
   3. **Social proof** — 4–6 logo placeholders or 2–3 testimonials. Skip entirely if the brief gives nothing to anchor it — an empty proof section is worse than none.
   4. **Pricing** — 2–3 compact tiers, only if the brief wants pricing on-page. For a full comparison table, point the user to `design-pricing-page` instead.
   5. **Footer CTA** — accent band, one line, one button.
   6. **Footer** — minimal links + copyright.
4. **Apply the design system strictly:**
   - Every color from DESIGN.md tokens — never invent hex values.
   - Display font for headlines only; body font everywhere else.
   - Respect grid, max-width, section spacing, and Depth & Elevation rules (no shadows if the brand says minimal).
   - Accent budget: hero primary CTA + footer CTA band. Links may share the accent. Nothing else.
5. **Write one self-contained HTML document.** All CSS in one `<style>` block in `<head>`. Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`). System font fallbacks. No external JS, images, or fonts fetched at render time. `data-od-id` on every top-level `<section>` and each editable headline/CTA.
6. **Self-check before emitting:**

| Check | Pass condition |
|-------|----------------|
| Colors | Every CSS color is a DESIGN.md token or an alpha/`color-mix()` variant of one |
| Copy | Product-specific, zero lorem, zero "Feature One" |
| Metrics | No invented numbers ("10× faster", "99.9% uptime") unless the brief supplied them |
| Accent | ≤ 2 structural uses (hero CTA + footer band) |
| Responsive | Reads correctly at 1440 / 768 / 375 — grids collapse, no horizontal scroll |
| Icons | Inline SVG monoline only — no emoji, no icon-font CDN |

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="landing-slug" type="text/html" title="Product Name — Landing">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.

## Example — structure sketch of a great result

```html
<!-- "Relay" team-sync tool — Ferrari DS: black hero, white panels, red x2 -->
<header>Relay wordmark · Product / Docs / Pricing · [Sign in]</header>
<section class="hero" data-od-id="hero">        <!-- black, cinematic -->
  <h1>Stop syncing by meeting.</h1>             <!-- display font, 4 words -->
  <p class="lead">Relay turns status threads into a live team surface.</p>
  <button class="btn-primary">Start free</button>  <!-- accent use 1 -->
  <button class="btn-ghost">See it live</button>
</section>
<section class="features grid-3" data-od-id="features">  <!-- white panel -->
  3 tiles: [SVG mark] "One thread per decision" · "Async by default" · "Slack in, Relay out"
</section>
<section class="proof" data-od-id="proof">2 testimonials, name + role, no logos (brief had none)</section>
<section class="cta-strip" data-od-id="cta">One line + [Start free]</section>  <!-- accent use 2 -->
<footer>links · © 2026 Relay</footer>
```

## Failure modes

| Symptom | Fix |
|---------|-----|
| Root `DESIGN.md` missing | Stop. Tell user: `/use-design <brand>` |
| Brief has no product/pitch | Ask one question: product + one-line pitch |
| No proof material in brief | Skip the proof section — never fabricate logos or quotes |
| Brief wants deep plan comparison | Do a compact tier row here; suggest `design-pricing-page` for the full table |
| Page looks like every AI-startup homepage | Replace one feature tile with something concrete (screenshot placeholder, sample output); remove one accent |
