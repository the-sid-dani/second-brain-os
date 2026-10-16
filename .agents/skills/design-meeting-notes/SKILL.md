---
name: design-meeting-notes
description: 'Renders a single-screen meeting-notes page as one self-contained HTML artifact — title bar with date/attendees, agenda checklist, a visually loud decisions block, action-items table with owners and due dates, open questions, and a next-meeting footer. Brand tokens come from root DESIGN.md. Use when the brief mentions "meeting notes", "minutes", "1:1 notes", "all-hands recap", "sync notes", "make these notes presentable", or "会议纪要". Do NOT trigger for meeting PREP (that is `/briefing` / meeting-prep outputs, plain markdown), for logging an interaction with a person (`/contact-log`), or for a slide deck recap (`/design-weekly-update` or `/design-simple-deck`).'
---

# design-meeting-notes

Turn raw meeting content into one polished, single-screen HTML notes page — decisions and action items impossible to miss.

**Before you begin: read root `DESIGN.md`.** All colors, type, spacing come from its tokens. If it's missing, stop and tell the user to run `/use-design <brand>` (presets at `<workspace.root>/<workspace.resources>/design-systems/`).

## What makes this layout distinct

A vertical single-page document with a **decisions panel** as the visual anchor (accent-bordered, highest contrast block on the page) and an **action-items table** directly below it. No sidebar, no charts, no slides. If the output has an app shell or pagination, you drifted into another skill's territory.

## When to use

- "turn these meeting notes into a page" / "make minutes for the Bridge sync"
- "all-hands recap" / "1:1 notes with <person>"
- "clean up this transcript into notes"
- "/design-meeting-notes"

Do NOT trigger for:
- Meeting **prep** — that's `/briefing`-adjacent markdown, not an HTML artifact.
- Logging who said what to a contact file — `/contact-log`.
- A multi-slide recap deck — `/design-weekly-update` or `/design-simple-deck`.
- Raw transcript storage — transcripts live under `<workspace.root>/<workspace.resources>/meetings/`, untouched.

## Process

1. **Read root `DESIGN.md`.** Extract palette, type tokens, radius, spacing mood. Missing → stop, point at `/use-design`.
2. **Extract from the brief** (or supplied transcript): meeting title, date/time, location or video link, attendees, agenda items, decisions, action items (owner + due + status), open questions, next meeting. Anything missing → generate plausible content consistent with the named meeting; never emit "TBD" rows or lorem ipsum.
3. **Lay out, top to bottom:**
   - Header bar: meeting title (largest type), date · time · location on one metadata line, attendees as a row of name chips.
   - Agenda checklist: 4–6 items, each with a done/skipped check state.
   - **Decisions panel**: bulleted, accent left border or accent heading — the strongest-styled block on the page. 2–4 decisions max.
   - Action-items table: columns `Owner | Item | Due | Status` — status as a pill (Done / In progress / Not started) using DS semantic tokens.
   - Open questions: short bulleted list with an owner chip per question where known.
   - Footer: next meeting date/time + "notes by <assistant.name>".
4. **Write one self-contained HTML document**: `<!doctype html>` through `</html>`, all CSS in a single inline `<style>` block, semantic HTML (`<header>`, `<main>`, `<section>`, `<table>`).
5. **Self-check** against the hard rules table below.

## Hard rules

| Rule | Detail |
|------|--------|
| Tokens only | Every color from DESIGN.md. No hex values it doesn't define. |
| Accent sparingly | Decisions border + at most one other use (e.g., status pill). |
| No JS libraries | No chart/framework CDNs. This page needs zero JS. |
| No network | No external fonts, images, or fetches. System font stack fallback. |
| No placeholders | No "Attendee A", no lorem ipsum — plausible, domain-specific content. |
| Single screen bias | If content overflows, trim agenda detail before trimming decisions/actions. |

## Output contract

One sentence before the artifact, nothing after.

```
<artifact identifier="notes-<meeting-slug>" type="text/html" title="Meeting Notes — <Meeting Title>">
<!doctype html>
<html>...</html>
</artifact>
```

## Example of a great result (structure sketch)

```
Meeting Notes — Bridge UI v2 Rework Sync
├─ Header: "Bridge UI v2 Rework Sync" · 2026-07-02 · 10:00 ET · Zoom
│    Attendees: Alex · Priya (Eng) · Morgan (Design) · Dana (PM)
├─ Agenda (5-item checklist)
│    ✓ Reporting skill status   ✓ PRD 4–5 review   ✓ v2 rework scope
│    ✓ UMS data contract        ○ Timeline (deferred)
├─ Decisions (accent-bordered panel)
│    • Prototype stays uncommitted until v2 plan is approved
│    • Reporting skill ships behind a feature flag for pilot users only
├─ Action items (table)
│    Alex   | Circulate v2 rework plan        | Jul 9  | [In progress]
│    Priya  | Spike UMS contract validation   | Jul 11 | [Not started]
│    Morgan | Update PRD 5 wireframes         | Jul 9  | [Done]
├─ Open questions
│    • Who owns the UMS data contract long-term? (Dana to confirm)
└─ Footer: Next meeting Jul 9, 10:00 ET · notes by Ralph
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Root `DESIGN.md` missing | No active brand | Stop; tell user: *"Run `/use-design <brand>` first — presets at `<workspace.root>/<workspace.resources>/design-systems/`."* |
| No transcript or details supplied | Brief is just a meeting name | Generate plausible content for that meeting; state the assumption in the one pre-artifact sentence. |
| 20+ action items | Big meeting dump | Table caps at ~10 rows; add a final row "+ N more — see transcript". |
| Dark cinematic DS (e.g., Ferrari) | Notes read badly on black | Use the DS's light editorial surface for the body; keep dark for header/footer only. |
| User asks to email/Slack the notes | Out of scope | Draft only — never auto-send (Boundaries in root CLAUDE.md). |
