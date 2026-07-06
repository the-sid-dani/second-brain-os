---
name: design-simple-deck
description: 'Generates a single-file horizontal-swipe HTML deck as one self-contained artifact. Built by copying the seed `assets/template.html` (carries the proven 5-rule iframe nav script — never rewrite it) and pasting slide layouts from `references/layouts.md`, with an explicit theme-rhythm plan (light/dark/hero) before any HTML. Pitch decks, product overviews, talks, study material. Use when the user says "deck", "slides", "presentation", "ppt", "pitch". Do NOT trigger for weekly team status decks (design-weekly-update), single-page docs (design-web-prototype and friends), real .pptx files (anthropic-skills:pptx), changes to an existing deck (design-tweaks), or a review of one (design-critique).'
---

# design-simple-deck

One single-file horizontal-swipe HTML deck, composed from the bundled seed + slide library. Rhythm first, HTML second.

## Resource map

```
design-simple-deck/
├── SKILL.md                ← you are here
├── assets/
│   └── template.html       ← seed: tokens + slide primitives + proven nav script (READ FIRST)
└── references/
    ├── layouts.md          ← 8 paste-ready slide layouts + theme-rhythm rules
    └── checklist.md        ← P0/P1/P2 self-review + rhythm spot-check
```

## When to use

- "make a deck about X" / "slides for the pitch" / "presentation for Y"
- "turn this doc into slides" / "6-slide overview of Z"

Do NOT trigger for:
- Weekly status decks — `design-weekly-update` (fixed slide taxonomy).
- A real PowerPoint file — `anthropic-skills:pptx`.
- One-page summaries — `design-web-prototype` / `design-meeting-notes`.
- "fix slide 5" on an existing deck — `design-tweaks`. "review this deck" — `design-critique`.

## Process

1. **Pre-flight (once):**
   1. Read `assets/template.html` end-to-end — through the `<style>` block AND the `<script>` block. The script solves five iframe-specific bugs (real scroller detection, dual capture-phase listeners, auto-focus, no `scrollIntoView`, position persistence). **Do not rewrite it.**
   2. Read `references/layouts.md` — the 8 layouts and the "Theme rhythm" section. Rhythm is the single biggest determinant of whether the deck feels alive or sleepy.
   3. Read root `DESIGN.md` (repo root, next to CLAUDE.md) — map its tokens to the six `:root` variables in the seed. If missing → stop, tell the user to run `/use-design <brand>`.
2. **Copy the seed.** Start from `assets/template.html` as the artifact body. Replace the six `:root` variables and the `<title>`.
3. **Decide slide count + theme rhythm BEFORE any slide HTML.** Default 6 slides unless the brief says otherwise:

   | Audience / format | Slides |
   |---|---|
   | Product overview / lightning talk (5–10 min) | 6 |
   | Pitch deck (15 min) | 8–10 |
   | Investor update / longer talk (20–30 min) | 12–18 |

   Write the rhythm as a numbered sketch (see Example below) and **show it to the user before writing slide HTML** — they redirect cheaply at this stage. A healthy sequence: no 3+ same theme in a row; ≥ 1 `hero dark` AND ≥ 1 `hero light` for 8+ slides; a dark "breath" every 3–4 slides.
4. **Paste and fill.** For each planned slide, copy the matching `<section>` from `layouts.md` into the body. Replace bracketed text with real, specific copy from the brief — no filler, no lorem, no invented metrics. If a slide feels empty, the layout is wrong; pick another. Tag every slide `data-screen-label="01 Cover"`, `"02 Problem"`, … in order (the seed's first slides show the pattern).
5. **Self-check.** Run `references/checklist.md`. The rhythm spot-check at the end is non-negotiable:

   ```bash
   grep 'class="slide' index.html
   ```

   Read the class sequence. `light × 3+` in a row → swap one to `dark`. No `hero dark` in an 8+ deck → promote a big-stat or closing slide.
6. **Emit the artifact** per the contract below.

## Hard rules

- **Theme class on every slide** — exactly one of `light` | `dark` | `hero light` | `hero dark`. Bare `class="slide"` = regression.
- **No 3+ same theme in a row.**
- **Display = serif via `var(--font-display)`** — `.h-hero` / `.h-xl` / `.h-md` already enforce.
- **One accent per slide, used at most twice.** On stat slides the number itself is the only accent.
- **All colors from DESIGN.md tokens** via the `:root` variables — no raw hex outside `:root`.
- **Don't rewrite the nav script. No `scrollIntoView()`.** Both break the iframe.
- **`data-screen-label` on every slide** — chat uses it for "edit slide 5".
- **Inline SVG only for any graphic; no external requests, no emoji icons, no JS chart libraries.**

## Output contract

```
<artifact identifier="deck-slug" type="text/html" title="Deck Title">
<!doctype html>
<html>...</html>
</artifact>
```

One sentence before the artifact, nothing after.

## Example — rhythm sketch of a great 8-slide pitch (shown to user first)

```
Deck: "Relay — Series A" · 8 slides · Ferrari DS

01  hero light center   Cover — "Stop syncing by meeting."
02  light                Problem — status lives in 4 tools
03  hero dark center     Big stat — 11 hrs/wk lost per eng
04  light                Three points — why now
05  dark                 Pipeline — how Relay works
06  hero light center    Quote — design partner CTO
07  light                Before / after — one team, 90 days
08  hero dark center     Ask — $8M, 24-month plan

Rhythm check: L L D L D L L D → no 3-in-a-row, has hero dark + hero light. ✓
```

## Failure modes

| Symptom | Fix |
|---------|-----|
| Root `DESIGN.md` missing | Stop. Tell user: `/use-design <brand>` |
| Brief is a topic with no content | Ask for the 3–5 points the deck must land before planning slides |
| Rhythm sketch is all `light` | Rebalance before writing HTML — cheapest possible fix point |
| Slide feels empty after paste | Wrong layout — swap it; never pad with filler |
| Tempted to "improve" the nav script | Don't. It's proven; every rewrite has reintroduced an iframe bug |
| 3 numbers on one stat slide | Split into 3 stat slides |
