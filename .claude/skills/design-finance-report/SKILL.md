---
name: design-finance-report
description: 'Renders a monthly/quarterly financial report as one self-contained single-screen HTML artifact — masthead with confidentiality badge, four-card KPI strip (revenue, net new MRR, gross margin, cash runway), inline-SVG revenue trend and cost breakdown charts, P&L summary table with prior-period deltas, top accounts table, outlook paragraph. Brand tokens from root DESIGN.md. Use when the brief mentions "financial report", "Q3 report", "MRR review", "P&L", "board finance page", or "财报". Do NOT trigger for personal budgeting from bank CSVs (`/budget-tracker`), a live operational dashboard (`/design-dashboard`), a weekly status deck (`/design-weekly-update`), or actual accounting/analysis work — this skill renders a report from numbers given or plausibly generated, it does not audit them.'
---

# design-finance-report

Render a period's financials as one confident single-screen report — every number tied to a chart or table, every delta showing direction.

**Before you begin: read root `DESIGN.md`.** All colors, type, spacing come from its tokens. If it's missing, stop and tell the user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`).

## What makes this layout distinct

The only skill in this batch pairing a **P&L table with two financial charts** (trend line/area + cost bars) under a formal masthead with a "Confidential — Finance" badge. Document-formal, chart-heavy, no app chrome, no slides. Deltas everywhere: every KPI and P&L row shows direction (▲/▼ glyph or +/-) and percentage vs prior period.

## When to use

- "make the Q3 finance report" / "render the MRR review"
- "P&L one-pager for the board" / "monthly financials page"
- "/design-finance-report"

Do NOT trigger for:
- Personal spending from bank exports — `/budget-tracker`.
- Live metrics screens — `/design-dashboard`.
- Weekly team status — `/design-weekly-update`.
- Verifying or reconciling the numbers themselves — out of scope; render what's given.

## Process

1. **Read root `DESIGN.md`.** Missing → stop, point at `/use-design`.
2. **Classify** period (monthly / quarterly / yearly) and entity (company, division, project) from the brief. Unspecified → quarterly SaaS-style report for `<user.company>`-plausible numbers. Real numbers supplied → use verbatim; generated numbers → internally consistent (revenue − costs ties to net; runway = cash ÷ monthly burn).
3. **Lay out, top to bottom:**
   - **Masthead**: entity name, period label, "Confidential — Finance" badge, prepared-by line.
   - **KPI strip** (4 cards): Revenue, Net new MRR, Gross margin, Cash runway — each with big number + delta vs prior period (direction + %).
   - **Revenue trend chart**: inline SVG line with subtle area fill, one point per month in period + 2 prior periods for context; axis labels in muted token.
   - **Cost breakdown chart**: inline SVG horizontal or vertical bars by category (People, Infra, Data, GTM, Other) + a 2–3 bullet caption naming the biggest mover.
   - **P&L summary table**: rows Revenue / COGS / Gross profit / Opex / Net; columns current, prior, delta %. Negative deltas use the DS warning/danger token, positive the success token.
   - **Top accounts table**: 4–6 rows — account, plan, ARR, status badge. Text-mark logos (initials in a chip), never external images.
   - **Outlook**: one paragraph, forward-looking, ending with author + signature line (`<user.full_name>`).
4. **Write one self-contained HTML document**: single inline `<style>`, semantic sections.
5. **Self-check**: every headline number appears again in a chart or table; all deltas have direction + %; accent used at most twice.

## Hard rules

| Rule | Detail |
|------|--------|
| Tokens only | Every color from DESIGN.md; up/down states from its semantic tokens. |
| Accent max twice | One chart highlight + masthead badge, typically. |
| No JS libraries | Charts are hand-drawn inline SVG (`<polyline>`, `<rect>`); zero `<script>`. |
| No network | No CDN fonts, no logo images — initials chips instead. |
| No placeholders | No "Account A / $X" — plausible named accounts and consistent math. |
| Numbers reconcile | Gross profit = revenue − COGS; net = gross − opex. Check before emitting. |
| No emojis | Formal doc (USER.md rule). Deltas via glyphs/±, not emoji. |

## Output contract

One sentence before the artifact, nothing after.

```
<artifact identifier="finance-report-<entity>-<period>" type="text/html" title="<Entity> Finance Report — <Period>">
<!doctype html>
<html>...</html>
</artifact>
```

## Example of a great result (structure sketch)

```
Finance Report — CTO Office Cost Center · Q2 FY26   [Confidential — Finance]
├─ KPI strip
│    Platform spend $1.84M (▼ 6.2% vs Q1) · Databricks $412K (▲ 11%)
│    POC budget used 58% · Runway vs annual plan: 5.1 months of headroom
├─ Trend chart (SVG line+area): monthly platform spend, Jan–Jun,
│    annotation on April dip ("legacy vendor wind-down")
├─ Cost breakdown (SVG bars): People 54% · Infra 22% · Data licensing 15%
│    · Tooling 6% · Other 3% — caption: "Data licensing down $88K after
│    vendor exit; infra up on live refresh workloads"
├─ P&L-style table: Budget / Actual / Delta% per line, danger token on
│    the one overage row (Infra +9%)
├─ Top vendors table: Databricks · AWS · Snowflake · Figma (initial chips,
│    plan, annual cost, status badge)
└─ Outlook paragraph + "Prepared by Alex Chen · Jul 6, 2026"
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Root `DESIGN.md` missing | No active brand | Stop; tell user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`). |
| Supplied numbers don't reconcile | Source data inconsistent | Render as given but flag the discrepancy in the pre-artifact sentence — never silently "fix" the user's numbers. |
| No numbers at all | Bare brief | Generate internally consistent figures; state they're illustrative in the pre-artifact sentence. |
| DS lacks red/green semantics | Minimal palette | Encode deltas with ▲/▼ glyphs + weight; keep color neutral rather than inventing hues. |
| Asked to send to the board/CFO | Out of scope | Artifact only — never auto-send (Boundaries in root CLAUDE.md). |
