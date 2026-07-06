---
name: design-docs-page
description: 'Renders a three-column documentation page as one self-contained HTML artifact — sticky left nav with grouped links, centered article body (~720px) with real prose, code blocks, callouts and a table, sticky right-rail "On this page" TOC. Brand tokens from root DESIGN.md. Use when the brief asks for a "docs page", "documentation mockup", "API reference page", "developer guide page", or "tutorial page". Do NOT trigger for writing actual project documentation into a repo (that is `engineering:documentation` / normal markdown work), for questions about how THIS OS works (`/os-guide`), for blog articles (`/design-blog-post`), for PRDs (`/design-pm-spec`), or for generic non-docs pages (`/design-web-prototype`).'
---

# design-docs-page

Produce a three-column docs page that reads like a shipped developer-docs site — real API names, runnable-looking commands, working anchor links.

**Before you begin: read root `DESIGN.md`.** All colors, type, spacing come from its tokens. If it's missing, stop and tell the user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`).

## What makes this layout distinct

The only skill in this batch with **dual sticky rails**: grouped left nav + right-rail TOC flanking a centered prose column. Text-dense and code-heavy — no KPI cards, no charts, no slides. Anchors actually work: every H2/H3 has an `id` the TOC links to.

## When to use

- "mock up a docs page for the reports API" / "API reference page"
- "developer guide page for X" / "tutorial page mockup"
- "/design-docs-page"

Do NOT trigger for:
- Writing real docs into a code repo — `engineering:documentation`, plain markdown.
- "How does X work in this OS" — `/os-guide`.
- Long-form editorial articles — `/design-blog-post`.
- Product specs — `/design-pm-spec`. Generic pages — `/design-web-prototype`.

## Process

1. **Read root `DESIGN.md`.** Missing → stop, point at `/use-design`. Use its body type token for prose, mono token for code, and respect its line-height/max-width rules.
2. **Pick the topic** from the brief. Invent concrete, internally consistent API surface: endpoint paths, parameter names, a realistic auth scheme. Plausible topics look like a reports API endpoint or a metrics SDK — never "MyAPI /endpoint1".
3. **Lay out three regions** (CSS Grid):
   - **Left nav** (240–280px, sticky): 3–5 groups of 4–8 links each; current page bold with a left-edge accent stripe.
   - **Article body** (max-width ~720px, centered): H1, lede paragraph, 3–5 H2 sections, at least one shell command, one code snippet of 5–15 lines, one callout (note or warning), one parameters table, inline links, lists. Minimum 350 words of believable prose.
   - **Right TOC** (200–240px, sticky): "On this page" listing the H2/H3 anchors; current section visually marked (static highlight is fine — no scroll-spy JS required).
4. **Write one self-contained HTML document**: single inline `<style>`, sticky positioning for both rails, anchor `id` on every H2/H3, copy-button affordance on code blocks (visual only, no JS), `data-od-id` on nav, article, and TOC.
5. **Responsive check**: readable at 1280w; below ~900w the TOC drops out and the left nav collapses to a top strip (media query, no JS).
6. **Self-check** against the hard rules table.

## Hard rules

| Rule | Detail |
|------|--------|
| Tokens only | Every color from DESIGN.md; code blocks use its mono token, never bare `monospace`. |
| Accent restrained | Active nav item, inline links, one callout border. Never body text. |
| No JS | Zero `<script>`; anchors and CSS handle everything. |
| No network | No CDN fonts, no external images or syntax-highlighter scripts. |
| No placeholders | Real-sounding endpoints, params, and outputs; no lorem ipsum, no `foo/bar` unless idiomatic in a snippet. |
| Line length | Prose wraps at 60–75 chars — the ~720px column enforces it. |
| Working anchors | Every TOC entry resolves to an existing `id`. |

## Output contract

One sentence before the artifact, nothing after.

```
<artifact identifier="docs-<topic-slug>" type="text/html" title="Docs — <Page Title>">
<!doctype html>
<html>...</html>
</artifact>
```

## Example of a great result (structure sketch)

```
Docs — Reports API · Creating a Scheduled Report
├─ Left nav (sticky): Getting started (5) · Reports (7, "Creating a scheduled
│    report" ●active w/ accent stripe) · Audiences (6) · Webhooks (4) · Errors (5)
├─ Article (~720px)
│    H1 "Creating a scheduled report" + lede
│    H2 Prerequisites — API key note callout
│    H2 Create the report
│       $ curl -X POST https://api.acme.com/v2/reports \
│           -H "Authorization: Bearer $ACME_API_KEY" ...
│       12-line JSON request body snippet (mono token, copy affordance)
│    H2 Parameters — table: name | type | required | description (6 rows:
│       campaign_id, date_range, dma_split, frequency_caps, …)
│    H2 Poll for completion — warning callout on rate limits (10 req/min)
│    H2 Next steps — inline links to Audiences and Webhooks pages
└─ Right TOC (sticky): the five H2 anchors, "Create the report" highlighted
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Root `DESIGN.md` missing | No active brand | Stop; tell user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`). |
| No topic given | Bare "make a docs page" | Pick a topic from the user's active-project context; name the choice in the pre-artifact sentence. |
| DS has no mono token | Sparse design system | Use a system mono stack (`ui-monospace, SFMono-Regular, Menlo`) — stack fallback, not a CDN font. |
| Prose balloons past ~900 words | Over-generation | Cap at ~600 words; docs mockups demonstrate structure, not exhaustive coverage. |
| Dark cinematic DS | Long-form code/prose on pure black | Use the DS's lifted dark surface or light editorial panel for the article column; reserve pure black for the rails. |
