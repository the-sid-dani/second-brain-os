---
name: design-pricing-page
description: 'Generates a standalone pricing page as one self-contained HTML artifact — hero, 2–4 plan tier cards with a marked recommended tier, grouped feature-comparison table, no-JS FAQ, footer CTA. Reads brand tokens from root DESIGN.md; emits between <artifact> tags. Use when the brief asks for "pricing", "plans", "subscription tiers", "compare plans", or "how much should the page charge for X". Do NOT trigger for a full landing page that merely includes a pricing section (design-saas-landing), a generic mockup (design-web-prototype), changes to an existing pricing artifact (design-tweaks), or a review of one (design-critique).'
---

# design-pricing-page

One pricing page — tier cards, comparison table, FAQ — that a real product could ship.

## When to use

- "make a pricing page for X" / "plans page" / "subscription tiers"
- "compare plans view" / "add a pricing page to the prototype" (as its own page)

Do NOT trigger for:
- A landing page with a pricing *section* — `design-saas-landing` owns that.
- Generic page mockups — `design-web-prototype`.
- "change the Pro tier price on the page you made" — `design-tweaks`.
- "is this pricing page any good" — `design-critique`.
- Actual pricing *strategy* (what to charge) — that is `/thinking-partner`, not a design job.

## Process

1. **Read root `DESIGN.md`** (repo root, next to CLAUDE.md). Use only its colors, type tokens, and component patterns. If missing → stop, tell the user to run `/use-design <brand>` (library at `<workspace.root>/<workspace.resources>/design-systems/`).
2. **Classify the product and pick a tier shape.** From the brief:
   - 3-tier (default): Free / Pro / Team or Starter / Growth / Enterprise.
   - 4-tier when the brief says "scale" or "enterprise plus".
   - 2-tier when it says "individual / business" or "personal / pro".
   If the brief names neither product nor audience, ask one question: "what is the product and who buys it?" — prices and features flow from that.
3. **Build sections in this exact order:**
   1. **Hero** — page title, one-line subhead, optional monthly/annual toggle (CSS-only).
   2. **Plan cards** — one per tier: name, price (display font, large number), 1-line positioning, 4–6 feature bullets, primary CTA. Recommended tier gets the accent border or a small badge — that is one of your two accent uses.
   3. **Comparison table** — feature rows × tier columns, ✓ / — / value cells, grouped into 2–3 sections (Core, Collaboration, Support/Security). Sticky header.
   4. **FAQ** — 4–6 `<details><summary>` items. No JS.
   5. **Footer CTA** — one line + one button.
4. **Write one self-contained HTML document.** `<!doctype html>` through `</html>`, CSS in one inline `<style>`. CSS Grid for the card row and the table. `data-od-id` on each tier card and each table row. Money rendering: display font for the big number, body font for currency and "/mo". No JS, no external requests.
5. **Self-check before emitting:**

| Check | Pass condition |
|-------|----------------|
| Colors | Every value traces to a DESIGN.md token |
| Prices | Plausible for this product — never "$X / month" |
| Accent | Recommended tier + one CTA only |
| Table | Clean at 1024px; stacks or scroll-x below 768px |
| Features | Every row reads like something the product would actually offer |
| Content | Zero lorem, zero "Feature One" |

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="pricing-slug" type="text/html" title="Pricing — Product Name">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.

## Example — structure sketch of a great result

```html
<!-- Pricing for "Relay" (team sync tool) — 3 tiers, Pro recommended -->
<section class="hero"><h1>Pricing</h1><p>Start free. Upgrade when the team does.</p></section>
<section class="tiers grid-3">
  <div class="card">Free · <span class="price">$0</span> · solo use · 5 bullets · [Start free]</div>
  <div class="card recommended">Pro · <span class="price">$12</span>/mo · per seat
       · 6 bullets · [Start 14-day trial]</div>   <!-- accent border = use 1 -->
  <div class="card">Enterprise · <span class="price">Custom</span> · SSO/SLA · [Talk to us]</div>
</section>
<section class="compare">
  <table> <!-- sticky header: Free / Pro / Enterprise -->
    Core: projects ✓/✓/✓ · history 7d/∞/∞
    Collaboration: guests —/10/∞ · roles —/✓/✓
    Security: SSO —/—/✓ · audit log —/—/✓
  </table>
</section>
<section class="faq">5 × <details><summary>Can I cancel anytime?</summary>…</details></section>
<section class="cta-strip">One line + <button class="btn-primary">Start free</button></section> <!-- accent use 2 -->
```

## Failure modes

| Symptom | Fix |
|---------|-----|
| Root `DESIGN.md` missing | Stop. Tell user: `/use-design <brand>` |
| Brief names no product | Ask: "what is the product and who buys it?" |
| Tempted to invent "$X" placeholder prices | Pick plausible real numbers for the category instead |
| Table unreadable on mobile | Scroll-x container or rotated headers — never shrink text below readable |
| FAQ wants JS accordion | `<details><summary>` — no JS, ever |
