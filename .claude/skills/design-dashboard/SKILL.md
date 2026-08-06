---
name: design-dashboard
description: 'Renders an admin/analytics dashboard as one self-contained single-screen HTML artifact — fixed left sidebar with nav, top bar with search + user, main grid of 3–4 KPI cards, one primary inline-SVG chart, one secondary chart or table. Brand tokens from root DESIGN.md. Use when the brief asks for a "dashboard", "admin panel", "analytics screen", "control panel", "ops view", or "monitoring screen mockup". Do NOT trigger for a working dashboard wired to real data (that is project work in `<workspace.root>/<workspace.coding>/`, e.g. the CTO dashboard POCs — this skill produces a static mockup), for finance-period reports (`/design-finance-report`), OKR trackers (`/design-team-okrs`), weekly status decks (`/design-weekly-update`), or tweaks to an existing artifact (`/design-tweaks`).'
---

# design-dashboard

Produce a static, single-screen admin/analytics dashboard mockup that looks like a real product screen — app chrome, KPIs, charts, believable data.

**Before you begin: read root `DESIGN.md`.** All colors, type, spacing come from its tokens. If it's missing, stop and tell the user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`).

## What makes this layout distinct

The only skill in this batch with **app chrome**: a fixed left sidebar + top bar wrapping a scrollable main grid. If the output has no sidebar, it isn't this skill's output. It is a **mockup** — static HTML, no data wiring; real dashboards are code-repo work.

## When to use

- "build a dashboard mockup" / "admin screen for X"
- "analytics view for the SLM classifier" / "ops control panel"
- "/design-dashboard"

Do NOT trigger for:
- A real, data-connected dashboard — that's a repo under `<workspace.root>/<workspace.coding>/` (`/new-project`, code-repo branch).
- Period financial reports — `/design-finance-report`.
- OKRs — `/design-team-okrs`. Weekly status — `/design-weekly-update`.
- Modifying an existing dashboard artifact — `/design-tweaks`; judging one — `/design-critique`.

## Process

1. **Read root `DESIGN.md`.** Missing → stop, point at `/use-design`.
2. **Classify the domain** from the brief (sales, traffic, model quality, incidents, ops…). Generate specific, plausible metric names and values for that domain — e.g., for an ad-tech domain: panel reach, classifier precision, report SLA, ingestion lag. Never "Metric A / Metric B".
3. **Lay out three regions:**
   - **Left sidebar** (220–260px, fixed): brand mark top, 6–8 nav links with simple inline-SVG icons, exactly one active item styled with the DS accent.
   - **Top bar** (sticky): page title left; search input + user avatar (initials chip) + status dot right.
   - **Main** (scrolls independently):
     - Row 1: 3–4 KPI cards — label, big number, delta vs prior period (direction + %).
     - Row 2: one primary chart, full-width or 2/3 — inline SVG line/area/bar from the same numbers the KPIs reference.
     - Row 3: one secondary chart OR a table (recent events, top items) — pick whichever the domain suggests; state which in the pre-artifact sentence.
4. **Write one self-contained HTML document**: `<!doctype html>` through `</html>`, one inline `<style>` block, CSS Grid for the shell, Flexbox inside cards, semantic tags (`<aside>`, `<header>`, `<main>`, `<section>`). Tag each logical region with `data-od-id="slug"` for comment mode.
5. **Charts**: inline SVG only. Line = one `<polyline>` + subtle area fill; bars = N `<rect>`s. Axis labels muted and small. Chart numbers must agree with KPI-card numbers where they describe the same thing.
6. **Self-check** against the hard rules table.

## Hard rules

| Rule | Detail |
|------|--------|
| Tokens only | Every color from DESIGN.md. |
| Accent max twice | Active nav item + one chart highlight. |
| No JS libraries | No Chart.js/D3/CDN anything; charts are hand-drawn SVG. Zero `<script>` needed. |
| No network | No external fonts/images; avatars are initials chips. |
| No placeholders | Domain-specific metric names with plausible values and deltas. |
| Sticky chrome | Sidebar + top bar fixed; main scrolls independently. |
| Density follows DS | Airy DSes get padding; dense DSes (trading/crypto) tighten rows. |

## Output contract

One sentence before the artifact, nothing after.

```
<artifact identifier="dashboard-<domain-slug>" type="text/html" title="<Domain> Dashboard">
<!doctype html>
<html>...</html>
</artifact>
```

## Example of a great result (structure sketch)

```
SLM Classifier Ops — dashboard mockup
├─ Sidebar (fixed, 240px): Acme mark · Overview(●active) · Models ·
│    Eval Runs · Signals · Devices · Alerts · Settings
├─ Top bar: "Classifier Operations" · search · JA avatar · green status dot
├─ Row 1 — KPI cards
│    IAB tier-1 precision 91.4% (▲1.2pt) · On-device p95 latency 38ms (▼4ms)
│    Devices reporting 2.1M (▲6%) · Signal coverage 87% of ad requests
├─ Row 2 — primary chart (SVG area): daily precision over 30 days,
│    accent stroke, annotation at model v0.9 rollout
├─ Row 3 — table: recent eval runs
│    run-142 | v0.9 | 91.4% | Jul 5 | [passed]
│    run-141 | v0.8 | 90.2% | Jul 1 | [passed]
│    run-140 | v0.8-rc | 88.7% | Jun 27 | [regressed]
└─ data-od-id on sidebar / topbar / kpis / trend / runs-table
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Root `DESIGN.md` missing | No active brand | Stop; tell user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`). |
| User wants live Databricks data | Mockup ≠ product | Say so; route to the owning code project (e.g., CTO dashboard repo) — this skill is static HTML only. |
| Domain unclear | Bare "make a dashboard" | Default to the user's most active domain (check recent project context); name the assumption in the pre-artifact sentence. |
| >6 KPI cards requested | Overloaded row 1 | Cap at 4; move the rest into the row-3 table. |
| Chart and KPI numbers disagree | Generated independently | Derive both from one internal series before writing HTML. |
