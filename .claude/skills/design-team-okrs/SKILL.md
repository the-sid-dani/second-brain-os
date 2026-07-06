---
name: design-team-okrs
description: 'Renders a single-screen OKR tracker as one self-contained HTML artifact — quarter banner with overall progress, three objective cards each holding key results as labelled progress bars (current → target), owner chips, status pills (On track / At risk / Off track), and an at-a-glance sidebar with top movers and blockers. Brand tokens from root DESIGN.md. Use when the brief mentions "OKRs", "key results", "objectives tracker", "quarterly goals page", or "目标". Do NOT trigger for a live-metrics operational screen (`/design-dashboard`), a weekly status recap (`/design-weekly-update`), or for WRITING the OKRs themselves — this skill renders OKRs the user already has (or plausible ones), it does not facilitate goal-setting (that is `/thinking-partner`).'
---

# design-team-okrs

Render a quarter's OKRs as one calm, single-screen tracker where progress is legible in three seconds.

**Before you begin: read root `DESIGN.md`.** All colors, type, spacing come from its tokens. If it's missing, stop and tell the user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`).

## What makes this layout distinct

**Objective cards with horizontal progress bars** are the signature element — no other skill in this set uses them. Two-column shell: objectives left (~2/3), at-a-glance sidebar right (~1/3). No app chrome (no nav sidebar, no top bar), no line/area charts. Progress bars are plain `<div>` fills or inline SVG rects — never a chart library.

## When to use

- "make an OKR page for the team" / "render our Q3 OKRs"
- "key results tracker" / "goals dashboard for the quarter"
- "/design-team-okrs"

Do NOT trigger for:
- Operational/analytics screens with live metrics and charts — `/design-dashboard`.
- "How did the week go" — `/design-weekly-update`.
- Helping the user *decide* what the OKRs should be — `/thinking-partner` first, then this skill to render.
- KPI-only finance views — `/design-finance-report`.

## Process

1. **Read root `DESIGN.md`.** Missing → stop, point at `/use-design`.
2. **Extract from the brief**: quarter label, date range, team name, objectives with key results (metric, current, target), owners, statuses. If the user supplies real OKRs, use them verbatim. If they supply fewer than 3 objectives (or KRs per objective), keep theirs verbatim and synthesize the missing ones to reach 3 × 3, marking synthesized entries plausibly for their domain. If none are supplied, generate exactly **3 objectives × 3 KRs each**, plausible for the user's domain (e.g., for an ad-tech engineering team: POC delivery, platform reliability, model quality — not generic "increase synergy").
3. **Lay out:**
   - Quarter banner (full width): quarter + fiscal label, date range, team name, one overall-progress chip (mean of all KR completion percentages, capped at 100 — e.g., "62% through Q3").
   - Left column — three objective cards, each with:
     - Objective title, owner chip (initials avatar), status pill: On track / At risk / Off track using DS semantic colors (green/warn/danger tokens — never invented hues).
     - 3 KR rows: KR text | `current → target` | progress bar with % label. Bar fill = DS accent for the single most important KR per card; neutral token for the rest.
   - Right sidebar: "This quarter at a glance" — 3 compact KPI stats, "Top movers" (2 KRs with biggest delta since last check-in), "Blockers" callout (1–2 items, warning-toned).
4. **Write one self-contained HTML document**: single inline `<style>`, CSS Grid for the two-column shell, semantic sections.
5. **Self-check** against the hard rules table.

## Hard rules

| Rule | Detail |
|------|--------|
| Tokens only | Every color from DESIGN.md; status colors from its semantic set. |
| Accent sparingly | Overall-progress chip + one highlighted KR bar per card, max. |
| No JS libraries | Zero JS needed; bars are styled divs/SVG rects. |
| No network | No external fonts/images/CDNs. |
| No placeholders | No "Objective 1 / KR A" — real-sounding metrics with numbers. |
| Exactly 3 objectives | More supplied → render top 3, note the rest in the sidebar. |

## Output contract

One sentence before the artifact, nothing after.

```
<artifact identifier="okrs-<team>-<quarter>" type="text/html" title="OKRs — <Team> <Quarter>">
<!doctype html>
<html>...</html>
</artifact>
```

## Example of a great result (structure sketch)

```
OKRs — CTO Office · Q3 FY26 (Jul 1 – Sep 30) · [62% through Q3]
├─ O1: Ship exec ops dashboard to weekly CTO use   Alex  [On track]
│    KR1 Dashboard in weekly staff review  3/6 wks → 6   ▓▓▓▓░░ 50%  (accent)
│    KR2 Databricks refresh < 15 min      42 → 15 min   ▓▓▓░░░ 45%
│    KR3 Vendor-replacement POC signed    1 → 1 sign-off ▓▓▓▓▓▓ 100%
├─ O2: Platform UI v2 foundation             Priya [At risk]
│    KR1 v2 rework plan approved          0 → 1         ░░░░░░ 0%
│    KR2 Reporting skill adoption         4 → 12 users  ▓▓░░░░ 33%
│    KR3 7 PRDs reviewed + prioritized    5 → 7         ▓▓▓▓░░ 71%
├─ O3: On-device classifier credibility     Alex [On track]
│    KR1 IAB tier-1 accuracy              78 → 90%      ▓▓▓▓░░ 65%
│    ...
└─ Sidebar: At a glance (3 stats) · Top movers (KR3-O1, KR3-O2) ·
   Blockers: "upstream data contract unowned — blocks O2/KR1"
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Root `DESIGN.md` missing | No active brand | Stop; tell user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`). |
| User supplies 5+ objectives | Real OKR doc is bigger | Render top 3 by stated priority; list the rest as one sidebar line. State the cut in the pre-artifact sentence. |
| No current/target numbers | Vague KRs ("improve quality") | Invent plausible baseline → target; mark status conservatively (At risk, not On track). |
| DS lacks semantic green/red | Minimal palettes | Encode status in the pill LABEL + neutral tone weight; never invent off-palette colors. |
| Progress adds to >100% | Bad weighting math | Overall chip = mean of all KR completion percentages, capped at 100 (same formula as the quarter banner). |
