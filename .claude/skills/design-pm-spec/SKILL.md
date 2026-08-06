---
name: design-pm-spec
description: 'Renders a product spec / PRD as one self-contained single-page HTML artifact — header strip with status pill and owner, three-line summary, problem panel with a sourced quote, goals vs non-goals two-column block, success-metrics table, user stories, scope milestone tracker, open questions with assignee chips. Brand tokens from root DESIGN.md. Use when the brief mentions "PRD", "spec", "product spec", "feature brief", "one-pager for feature X", or "需求文档". Do NOT trigger for WRITING spec content collaboratively (that is `engineering:write-prd` or `/thinking-partner` — this skill renders), for engineering design docs / architecture (different genre), for publishing to Confluence (`/confluence-publish-markdown`), or for OKR/status pages (`/design-team-okrs`, `/design-weekly-update`).'
---

# design-pm-spec

Render a feature's PRD as one scannable single-page HTML doc — a reviewer should grasp problem, goals, and scope without scrolling back up.

**Before you begin: read root `DESIGN.md`.** All colors, type, spacing come from its tokens. If it's missing, stop and tell the user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`).

## What makes this layout distinct

A **long-scroll document page** with a fixed section skeleton (below) — the only skill in this batch built around prose-plus-tables document structure. No app chrome, no slides, no charts beyond the milestone tracker. It is a formal external-adjacent document: **no emojis anywhere** (USER.md rule for formal docs), status shown as pills, not 🟢🟡🔴.

## When to use

- "render this PRD" / "make the spec presentable"
- "one-pager for the reporting agent feature" / "feature brief for X"
- "/design-pm-spec"

Do NOT trigger for:
- Drafting/ideating the spec content — `engineering:write-prd` or `/thinking-partner`, then render here.
- Engineering design docs, RFCs, system-design writeups — different genre; keep those markdown.
- Confluence publishing — `/confluence-publish-markdown`.
- Docs/tutorial pages — `/design-docs-page`.

## Process

1. **Read root `DESIGN.md`.** Missing → stop, point at `/use-design`.
2. **Extract from the brief**: feature name, owner (default `<user.name>`), status (default Draft), audience, and any real spec content supplied. Supplied content is used verbatim (light copy-edit only); gaps are filled with plausible, domain-consistent content — never lorem ipsum.
3. **Render this exact section skeleton, in order:**
   - **Header strip**: title, status pill (Draft / In review / Approved), date, owner, one-line audience tag.
   - **Summary**: exactly three lines — what, who it's for, why now.
   - **Problem**: one tight paragraph + one indented quote attributed to a plausible customer or internal partner (e.g., "— data analyst, June office hours").
   - **Goals & non-goals**: two-column block, 3–4 bullets each. Non-goals are as specific as goals.
   - **Success metrics**: table `Metric | Target | How measured` — 3–4 rows, every target a number.
   - **User stories**: 3–5 items in as-a / I-want / so-that form, each on one line.
   - **Scope**: horizontal milestone tracker, 3–4 phases with names + dates; current phase marked with the accent.
   - **Open questions**: bulleted, each ending with an assignee chip.
4. **Write one self-contained HTML document**: single inline `<style>`, semantic HTML, prose column max-width ~760px.
5. **Self-check** against the hard rules table.

## Hard rules

| Rule | Detail |
|------|--------|
| Tokens only | Every color from DESIGN.md. |
| Accent max twice | Status pill + current milestone marker. Nowhere else. |
| No JS | Static document; zero `<script>`. |
| No network | No CDN fonts/scripts/images. |
| No placeholders | Metrics have numbers; quotes have attributions; no "TBD" cells. |
| No emojis | Formal-doc rule from USER.md. Pills and text labels only. |
| Fixed skeleton | Sections in the listed order, all present — reviewers rely on it. |

## Output contract

One sentence before the artifact, nothing after.

```
<artifact identifier="spec-<feature-slug>" type="text/html" title="Spec — <Feature Name>">
<!doctype html>
<html>...</html>
</artifact>
```

## Example of a great result (structure sketch)

```
Spec — Reporting Agent Skill                     [In review] · Jul 6 · Alex
├─ Summary (3 lines): Automates report cloning in the platform ·
│    for data analysts · manual setup costs ~40 analyst-hrs/month now
├─ Problem: one paragraph + quote
│    "I spend Monday mornings cloning last week's report and fixing
│     dates by hand." — data analyst, June office hours
├─ Goals ∥ Non-goals
│    Goals: clone-with-overrides · batch setup (N reports) · QA diff view
│    Non-goals: net-new report types · replacing Bridge UI · billing changes
├─ Success metrics (table)
│    Setup time/report | < 5 min (from 25) | Bridge audit log
│    Batch adoption    | 12 pilot users by Q3 end| weekly actives
│    Error rate        | < 2% cloned-report QA failures | QA diff pass rate
├─ User stories (4, as-a / I-want / so-that)
├─ Scope tracker: Alpha (Jul) → Beta (Aug, ●current) → GA (Sep) → Batch v2 (Oct)
└─ Open questions: "Rate limits on the reports API?" [Priya] · "Perms model?" [Dana]
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Root `DESIGN.md` missing | No active brand | Stop; tell user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`). |
| Brief is one sentence | No real spec content | Generate a plausible full spec; flag in the pre-artifact sentence that content is scaffold-for-review. |
| User supplies a 10-page PRD | Too much for one page | Render summary-level; densest sections (stories, metrics) capped, with "condensed from source doc" note in the header strip. |
| Asked to publish to Confluence/Jira | Out of scope | Hand off to `/confluence-publish-markdown` / `/jira-decompose-epic`; never auto-publish. |
| Dark cinematic DS | Long prose on black strains | Use the DS's light editorial surface for the document body; dark reserved for the header strip. |
