---
name: design-critique
description: 'Runs a 5-dimension expert design review on an EXISTING HTML artifact — Philosophy consistency / Visual hierarchy / Detail execution / Functionality / Innovation, each scored 0–10 with cited evidence — and returns a WRITTEN markdown critique in chat (verdict, score table, per-dimension evidence, Keep / Fix / Quick-wins lists). No HTML artifact is produced; this skill judges, it does not change anything. Use when the brief asks for a "design review", "design critique", "design audit", "what is wrong with my design", "is this deck any good", "compare these two variants". Do NOT trigger when the user wants changes APPLIED (design-tweaks — user wants edits, output is a modified artifact), when generating something new (the design-* generators), or for code review of app logic (engineering:code-review). Rule of thumb: user wants an OPINION → this skill; user wants CHANGES → design-tweaks.'
---

# design-critique

Score an existing artifact across 5 dimensions, with evidence, and say what to keep, fix, and quick-win. Output is written markdown — judgment, not modification.

Scope boundary (mutually exclusive with `design-tweaks`):
- **critique** — user wants *judgment*. Output: markdown critique in chat. No artifact.
- **tweaks** — user wants *changes*. Output: modified HTML artifact. If the user says "now fix it" after a critique, hand the Fix list to `design-tweaks`.

## When to use

- "review the deck you made" / "what's wrong with this design" / "design audit"
- "is this landing page any good" / "which of these two variants is stronger"
- As a self-check the agent runs on its own output — **only on explicit request** ("now critique what you just made"), never unprompted in the same turn.

Do NOT trigger for:
- "make the hero darker" or any applied change — `design-tweaks`.
- Generating a page/deck — the design-* generators.
- Reviewing application code — `engineering:code-review`.

## The 5 dimensions

Each dimension is independent — a deck can be 9/10 on Innovation and 4/10 on Hierarchy, and the critique should say so plainly. Don't average away interesting failures. Bands: 0–4 *Broken* · 5–6 *Functional* · 7–8 *Strong* · 9–10 *Exceptional*.

### 1. Philosophy consistency

Does the artifact pick one clear direction and hold it through every micro-decision (chrome, kicker, spacing, accent)?

Evidence to look for: one declared direction vs three styles in a trench coat; kicker vocabulary staying in one register (not "Vol.04 · Spring" on page 3 and "BUT WAIT 🔥" on page 7); accent / serif / mono used by the same rule throughout.
**0–4** styles fighting each other · **5–6** one direction, half the elements drift · **7–8** coherent, edge-page drift · **9–10** every element argues the same thesis.

### 2. Visual hierarchy

Can a stranger tell what to read first, second, third — without being told?

Evidence: largest type is the most important thing on each screen; mono/serif/sans roles match information roles (meta/body/display); clear primary → secondary → tertiary tiers vs everything shouting.
**0–4** everything shouts · **5–6** works on hero screens, breaks in body · **7–8** clear tiers, occasional collision · **9–10** zero friction.

### 3. Detail execution

The 90/10 stuff — alignment, leading, baseline behavior of big numbers, image framing, chrome polish, edge-case spacing.

Evidence: big stats sitting on a baseline vs floating; column tops aligned in split grids; caption typography consistent across pages; mono labels sharing letter-spacing and uppercase rules; orphaned `<br>` making 1-character lines.
**0–4** visible tape and string · **5–6** mostly clean, 1–2 ragged pages · **7–8** polished, expert finds 2–3 misses · **9–10** magazine-grade.

### 4. Functionality

Does the artifact *work* for its intended use?

Evidence: deck — keyboard/wheel/touch nav intact, iframe-safe (no `scrollIntoView`); landing — CTA above the fold, mobile reflow, no horizontal scroll; docs — code blocks copyable, no smart quotes; presentation-distance readability.
**0–4** pretty but doesn't do its job · **5–6** core flow works, edges broken · **7–8** robust in normal use · **9–10** defensively engineered (iframe / fullscreen / paste / print).

### 5. Innovation

Does it push past the median — one element that makes people lean in?

Evidence: one unexpected layout/typographic/motion move that *serves* the direction, vs 100% safe agency-median, vs innovation grafted on (random WebGL on a slow-living editorial).
**0–4** generic AI-slop median · **5–6** competent and unmemorable · **7–8** one memorable moment · **9–10** multiple steal-worthy moves, each earning its place.

## Scoring discipline (read before scoring)

- **Every score cites evidence** — "4 because the hero mixes the display serif and Inter on one line" beats "feels inconsistent". A number without a named element/class/slide is not a score.
- **Don't average up** — the score is the *worst sustained band*. If page 3 breaks hierarchy, hierarchy is not a 7 because pages 1–2 are fine.
- **Don't grade-inflate** — 7 means *strong*, not *acceptable*. If every score is 7+, you are not reviewing critically; a mean above 8 is suspicious.
- **Innovation is allowed to be low** — 5/10 is fine for production deliverables. Don't punish appropriate conservatism.
- **Judge against the artifact's own DESIGN.md** (root `DESIGN.md`) where token discipline is in question — off-brand hex values are a Philosophy/Detail finding.

## Process

1. **Acquire the artifact.** Three modes: (a) project file the user names — Read it; (b) HTML pasted in chat; (c) an artifact you emitted earlier in this conversation — re-read your own output. If multiple HTML files exist, ask which one — never review all. Never review your own artifact unprompted in the same turn it was generated.
2. **Read enough to score.** The entire `<style>` block, then 6–8 representative content blocks. Never score from frontmatter or declared intent — the score is about *executed* design.
3. **Score all 5 dimensions.** For each: score, band, and a 30–80 word evidence paragraph naming specific elements — class names, slide labels (`data-screen-label`), section ids (`data-od-id`), line numbers when reviewing a file.
4. **Build the action lists** from the evidence:
   - **Keep** (3–5 bullets) — working things the next iteration must not break. Cite by class/page/element.
   - **Fix** (3–6 bullets) — must-dos ordered by visual cost saved per minute spent. ≤ 1 sentence each.
   - **Quick wins** (3–5 bullets) — 5–15 minute tweaks with disproportionate impact.
5. **Write the critique in chat** using the exact format below. Do not emit an `<artifact>`. Do not modify the reviewed file. If the user wants a saved copy, offer `<workspace.root>/<workspace.inbox>/` — never write into `<workspace.projects>/` without asking.
6. **Offer the handoff:** end with one line — "Want the Fix list applied? Say so and I'll run it through `design-tweaks`."

## Output format (exact)

```markdown
## Design critique · <artifact name> · <YYYY-MM-DD>

**Verdict:** <one sentence — the single most important thing about this design>

| Dimension | Score | Band |
|---|---|---|
| Philosophy consistency | n/10 | <band> |
| Visual hierarchy | n/10 | <band> |
| Detail execution | n/10 | <band> |
| Functionality | n/10 | <band> |
| Innovation | n/10 | <band> |

### 1. Philosophy consistency — n/10
<30–80 word evidence paragraph naming specific elements.>
… (repeat for all 5 dimensions — partial reviews are not allowed)

### Keep
- <3–5 bullets, each citing class/page/element>

### Fix
- <3–6 bullets, ordered by visual cost saved per minute spent>

### Quick wins
- <3–5 bullets, 5–15 min each>

Want the Fix list applied? Say so and I'll run it through `design-tweaks`.
```

## Example — one great dimension block

```markdown
### 3. Detail execution — 6/10 (Functional)
Stat cards on slide 03 align cleanly (grid-6, 3×2), but slide 08's right
column foot sits ~2vh higher than the left because `.callout` carries a
3vh top margin the figure lacks. Image captions are mono on slide 05 and
sans on slide 07 — pick one. The `38×` stat floats above its baseline;
`line-height: 0.9` on `.stat-num` would seat it.

### Fix (excerpt)
- Slide 08: remove `.callout`'s 3vh top margin or mirror it on the figure.
- Unify caption typography — mono everywhere (matches `.meta`).
```

## Failure modes

| Symptom | Fix |
|---------|-----|
| No artifact to review | Nothing to judge — ask for the file, or route a generation request to a design-* generator |
| Multiple HTML files in scope | Ask which one; never review all |
| User actually wants changes made | Hand off to `design-tweaks` |
| Tempted to score from the skill/DESIGN.md intent | Read the executed HTML/CSS — intent doesn't score |
| All five scores landed 7+ | Re-read with a harsher eye; the mean-above-8 rule caught you |
| Asked to self-critique in the same turn as generation | Decline until the user has seen the artifact; explicit request only |
| Comparing two variants | Run the full 5-dimension pass on each, then a short head-to-head table — never a single blended review |
