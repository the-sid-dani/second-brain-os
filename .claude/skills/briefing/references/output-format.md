# briefing — output format reference

Loaded on demand. The stable DOM contract so downstream tooling (eventually `/standup`, `/weekly-digest`) can parse the brief deterministically via `data-od-id` slugs.

The brief is a single self-contained HTML file. Section order is FIXED:

1. `<title>` — `Morning brief — <YYYY-MM-DD>`
2. `<nav class="topnav" data-od-id="topnav">` — nav anchors mirror the present sections (horizontal top nav, NOT a sidebar — T6)
3. `<header data-od-id="topbar">` — H1 + tagline + day-of-week pill
4. `<section data-od-id="kpis">` — 2-4 KPI cards (dynamic; from detection map + signal volume)
5. `<section data-od-id="what-needs-you">` — always present (mandatory floor — top 5-7 items merged from calendar / Gmail / Jira / Slack per priority signals)
6. `<section data-od-id="calendar">` — gated on `detection.cli.gws`
7. `<section data-od-id="projects">` — always present (mandatory floor — load-bearing chief-of-staff section with project-card grid + closing synthesis line)
8. `<section data-od-id="slack">` — gated on `detection.mcp.slack`
9. `<section data-od-id="jira">` — gated on `detection.mcp.atlassian`
10. `<section data-od-id="commitments">` — always present (file reads, no external dep); omitted if contacts dir is empty
11. `<section data-od-id="shipped">` — gated on `detection.cli.gh`
12. `<section data-od-id="notes">` — always tried; omitted if `/find` returned nothing useful
13. `<section data-od-id="tools-used">` — ALWAYS present, transparency footer per T4
14. `<p class="signoff">That's the lay of the land. Where do you want to start?</p>`

## Section behaviors
- Gated sections (6, 8, 9, 11) collapse out entirely if `detection.<key>` is false — no `<section>`, no nav anchor, no body. The `tools-used` footer documents the omission.
- Gated sections that DID get detection but errored at runtime: keep the `<section>` and its `<h3>`, render a single `<p class="warn">⚠️ <Tool> errored — <cause></p>` as the body, also log to footer.
- Mandatory-floor sections (5, 7, 10) always appear unless they have genuinely no content (e.g., empty contacts dir → omit section 10).
- The footer (13) is the source of truth: if a `<section>` is present in the DOM, the footer should list it under ✅ Composed; if absent, it goes under ⏳ Not configured, ⏭️ Skipped (Step 0.6 user demoted), or ⚠️ Errored. The four buckets are mutually exclusive — each tool appears in exactly one.

## Why HTML, not Markdown (v0.2.0 decision)
- <user.name> wanted a styled, scannable artifact he could open in a browser and (eventually) `/publish` for share. Dashboard mood beats prose for daily orientation.
- Parsing tradeoff: downstream skills that previously grepped `## What needs you today` now query by `data-od-id="what-needs-you"` instead. DOM slugs are stable across cosmetic CSS changes; H2 text could drift with voice tweaks.
- Self-contained constraint (no JS, no external assets) keeps briefings portable: opens offline, archivable, no link rot.
