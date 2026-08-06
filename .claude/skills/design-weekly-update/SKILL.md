---
name: design-weekly-update
description: 'Renders a weekly team update as a single-file horizontal-swipe HTML deck (6–8 slides, each 100vw, arrow-key + click navigation) — cover, headline, shipped, in flight, blocked, metrics, asks. Brand tokens from root DESIGN.md. Use when the brief mentions "weekly update", "team update slides", "weekly status deck", "what we shipped this week", or "周报演示". Do NOT trigger for a general-purpose presentation on any other topic (`/design-simple-deck`), a static single-page status doc (`/design-meeting-notes` or a markdown status report), an OKR/quarter view (`/design-team-okrs`), or a live-metrics screen (`/design-dashboard`).'
---

# design-weekly-update

One-file horizontal-swipe deck that tells a squad's week in 6–8 slides: what shipped, what's moving, what's stuck, what we need.

**Before you begin: read root `DESIGN.md`.** All colors, type, spacing come from its tokens. If it's missing, stop and tell the user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`).

## What makes this layout distinct

The only skill in this batch that produces a **paged deck**: a horizontal strip of `100vw` slides with arrow-key/click navigation and a dot indicator. Fixed narrative slide order (below) — never reordered, so run-to-run outputs are comparable week over week. If the brief wants one scrolling page, this is the wrong skill.

## When to use

- "weekly update for the team" / "status slides for this week"
- "what did we ship this week — make it a deck"
- "/design-weekly-update"

Do NOT trigger for:
- Any other deck topic (strategy, pitch, review) — `/design-simple-deck`.
- Single-page written status — plain markdown or `/design-meeting-notes`.
- Quarter-level goals — `/design-team-okrs`.
- Always-on metrics screens — `/design-dashboard`.

## Process

1. **Read root `DESIGN.md`.** Missing → stop, point at `/use-design`.
2. **Extract from the brief**: squad/team name, week range (compute ISO week from dates if only "this week" is given), author (default `<user.name>`), audience (squad-internal vs cross-functional — cross-functional gets less jargon, more context lines).
3. **Build slides in this exact order** (drop 8 only if there's nothing to thank/close on; never drop 1–7):
   1. **Cover** — squad name, week label ("W28 · Jul 6–10"), author, date.
   2. **Headline** — one sentence + the single number that mattered this week, set huge.
   3. **Shipped** — 3–5 items, each one line + link-style affordance (visual only).
   4. **In flight** — 3–5 items with owner initials-chips and a % or stage tag.
   5. **Blocked** — 1–3 items, each with a named blocker AND a clear ask; warning-toned card per item.
   6. **Metrics** — 1–2 inline SVG charts (line or bar) with real-looking weekly numbers and a one-line takeaway each.
   7. **Asks for next week** — bulleted, each with a named owner and a date.
   8. **Closing** — one thank-you line + next update date.
4. **Write one self-contained HTML document**: single inline `<style>`, slides as flex children of a `100vw`-per-slide track; small inline `<script>` for arrow-key/click navigation and dot state — hand-written vanilla JS only, no libraries.
5. **Self-check** against the hard rules table.

## Hard rules

| Rule | Detail |
|------|--------|
| Tokens only | Every color from DESIGN.md. |
| Accent sparingly | Headline number + blocked-slide ask emphasis, max. |
| No JS libraries | Nav is ~15 lines of vanilla JS; charts are inline SVG, never Chart.js/D3. |
| No network | No CDN fonts/scripts/images. |
| No placeholders | No "Project A shipped Feature B" — name real-sounding work items. |
| Fixed slide order | 1–8 as listed; consistency week-over-week is the point. |

## Output contract

One sentence before the artifact, nothing after.

```
<artifact identifier="weekly-update-<team>-w<NN>" type="text/html" title="Weekly Update — <Team> · W<NN>">
<!doctype html>
<html>...</html>
</artifact>
```

## Example of a great result (structure sketch)

```
Weekly Update — CTO Office · W28 (Jul 6–10) · 8 slides, ←/→ nav, dot rail
1 Cover     CTO Office · W28 · Alex Chen · Jul 10
2 Headline  "The ops dashboard hit its first live Databricks refresh."  — 11 min
            (refresh latency, down from 42; number set in accent, 96px)
3 Shipped   • dashboard live-data wiring   • reporting skill v0.3 to 4 pilot users
            • SLM eval harness for IAB tier-1 labels
4 In flight [JA] Bridge v2 rework plan — drafting · [PR] UMS contract spike — 40%
5 Blocked   ⚠ Vendor sign-off waiting on legal — ASK: Dana escalate by Tue
6 Metrics   SVG line: dashboard refresh latency by day (42→11 min)
            SVG bars: reporting skill weekly active users (1·2·2·4) — "adoption doubling"
7 Asks      • Dana: legal escalation (Tue) · • Priya: contract spike readout (Fri)
8 Closing   "Thanks for a sharp week — next update Jul 17."
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Root `DESIGN.md` missing | No active brand | Stop; tell user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`). |
| Nothing blocked this week | Genuinely clean week | Keep slide 5 with one line "No blockers — flag early if that changes" rather than dropping it (slot stability). |
| 10+ shipped items | Big week | Top 5 on the slide, "+N more" footnote line. |
| User says "send it to the team" | Out of scope | Deck only — never auto-send to Slack/email (Boundaries in root CLAUDE.md). Offer a draft message instead. |
| Only vague metrics given | No numbers in brief | Generate plausible weekly series consistent with named work; say so in the pre-artifact sentence. |
