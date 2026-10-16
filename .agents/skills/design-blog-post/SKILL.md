---
name: design-blog-post
description: 'Generates a long-form article page as one self-contained HTML artifact — masthead, article header, hero figure, 600+ word real body with pull quote and figures, author footer, related posts. Reads brand tokens from root DESIGN.md; emits between <artifact> tags. Use when the brief asks for a "blog post", "article", "essay", "case study", "editorial page", or "write this up as a post". Do NOT trigger for marketing/landing pages (design-saas-landing), pricing (design-pricing-page), decks (design-simple-deck), generic page mockups (design-web-prototype), changes to an existing artifact (design-tweaks), or a judgment/review of one (design-critique).'
---

# design-blog-post

One long-form article page — editorial layout, real prose, zero marketing chrome.

Long-form is 70% type, 20% image, 10% chrome. If the page reads like a landing page with paragraphs, it failed.

## When to use

- "write a blog post about X" / "turn this into an article"
- "draft an essay page on Y" / "case study page for Z"
- "make this look like a magazine piece"

Do NOT trigger for:
- Product/marketing pages — `design-saas-landing` or `design-web-prototype`.
- Pricing — `design-pricing-page`. Decks — `design-simple-deck`.
- "tweak the article you made" — `design-tweaks`. "review this article page" — `design-critique`.
- Plain markdown writing with no visual deliverable — just write it, no artifact.

## Process

1. **Read root `DESIGN.md`** (repo root, next to CLAUDE.md). Extract: color tokens, display + body fonts, layout max-width, depth rules. If missing → stop, tell the user to run `/use-design <brand>` (library at `<workspace.root>/<workspace.resources>/design-systems/`).
2. **Pin the topic.** If the brief gives only a title, ask for two things before writing: the core argument and the audience. Never pad a vague brief with generic prose.
3. **Write the article first, HTML second.** At least 600 words across 4–6 H2 sections. Real claims, real specifics from the brief. No lorem, no invented statistics.
4. **Assemble sections in this exact order:**
   1. **Masthead** — small wordmark + 4–6 nav links, plain.
   2. **Article header** — category eyebrow, H1 headline (display font, large), 1–2 sentence deck, author name + role + date.
   3. **Hero figure** — 16:9 placeholder block using a DESIGN.md-tinted solid or gradient (no external images), 1-line caption.
   4. **Body** — prose paragraphs plus at least: 1 pull quote (display type, accent rule left), 1 figure with caption, 1 list, 1 inline blockquote.
   5. **Author footer** — initials-in-circle avatar, bio paragraph.
   6. **Related** — 3 cards: tiny image block, title, 1-line excerpt, date.
5. **Build one HTML document.** `<!doctype html>` through `</html>`, all CSS in one `<style>` block. Body column centered, max-width per DESIGN.md (typically 680–720px). Drop caps only if the brand mood is editorial/serif. `data-od-id` on headline, hero, body, pull quote, related grid. No JS, no external requests.
6. **Self-check before emitting:**

| Check | Pass condition |
|-------|----------------|
| Colors | Every value traces to a DESIGN.md token — no invented hex |
| Hierarchy | H1 unambiguous; pull quote never competes with it |
| Measure | Body line length 60–75 chars |
| Accent | ≤ 2 uses (eyebrow + pull-quote rule, or one link style) |
| Content | ≥ 600 real words, zero filler |
| Read test | Feels like a magazine, not a landing page |

## Output contract

Emit between `<artifact>` tags:

```
<artifact identifier="post-slug" type="text/html" title="Article Title">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.

## Example — structure sketch of a great result

```html
<!-- "Why On-Device Classification Wins" — Ferrari DS: white panel, red accent x2 -->
<header>wordmark · Product / Engineering / Research / About</header>
<article style="max-width:700px">
  <p class="eyebrow">ENGINEERING · EDGE AI</p>          <!-- accent use 1 -->
  <h1>Why on-device classification wins</h1>            <!-- display font -->
  <p class="deck">Latency, privacy, and cost all point the same way.</p>
  <p class="byline">Alex Chen · CTO Office · 2026-07-06</p>
  <figure class="hero-ph">[16:9 tinted block]<figcaption>Chipset inference path</figcaption></figure>
  <h2>The latency argument</h2> <p>…real prose…</p>
  <blockquote class="pull">"The round trip is the product tax."</blockquote> <!-- accent rule, use 2 -->
  <h2>What it costs to ship</h2> <ol>…3 items…</ol>
  <figure>[chart placeholder]<figcaption>Cost per 1M classifications</figcaption></figure>
</article>
<footer class="author">JA avatar · bio paragraph</footer>
<section class="related">3 cards: title · excerpt · date</section>
```

## Failure modes

| Symptom | Fix |
|---------|-----|
| Root `DESIGN.md` missing | Stop. Tell user: `/use-design <brand>` |
| Brief is just a title | Ask for core argument + audience before writing |
| Article under 600 words | Content problem, not layout — go deeper on the brief, don't pad |
| Brand is tech-minimal but drop caps look off | Skip drop caps; they are editorial-serif only |
| Tempted to embed a stock photo URL | Never — tinted placeholder block + caption |
