---
name: prune-projects
description: "Friday staleness review of the active project list: finds stale projects (active 90+ days untouched, paused 60+, done but not archived), shows them for approval with their last memory entry, and hands each approved one to /archive-project. Skips ongoing projects. Use for \"what's stale?\", \"Friday review\", \"what should I archive?\", \"prune projects\", \"review my projects\", \"what's gone cold?\", or any clean-up language about the project list."
allowed-tools: Read Bash AskUserQuestion Skill
---

# prune-projects

One-line purpose: Friday-cadence cleanup of `<workspace.root>/<workspace.projects>/` — <assistant.name> detects stale candidates deterministically, the user approves in one multiselect, `/archive-project` handles each move.

**Before you begin: read the Configuration section in root CLAUDE.md.** Path tokens like `<scripts.project_query>` and `<workspace.projects>` resolve from there — don't hardcode.

## Why this exists

Active projects rot if nobody triggers cleanup. A pure auto-move on a 90-day timer eats live work — projects in long planning phases look dead. So: <assistant.name> does the *detection* (fast, deterministic, scriptable), the user does the *judgment* (a 30-second multiselect), once a week. No drift, no surprise mass-archives. **Archive = MOVE, never delete** — every disposition here is reversible with one `mv`.

The two prerequisites already ship:
- `<scripts.project_query>` — the project table with `days` and a `STALE` flag.
- `/archive-project` — per-project archive (retro + status flip + folder move).

This skill is just the orchestration: query → filter → ask → chain.

## When to use

Trigger phrases (intentionally broad):
- "what's stale?" / "any stale projects?"
- "Friday review" / "Friday cleanup"
- "what should I archive?" / "prune projects"
- "review my projects" / "what can I clean up?"
- "anything I should close out?" / "what's gone cold?"

Do NOT trigger for:
- Archiving a *specific* known project — `/archive-project` directly.
- One project's status — just read its `CLAUDE.md`.
- Inbox items or unmigrated `<workspace.projects>/` folders (no CLAUDE.md) — that's `/inbox-process`.
- Shipped Area apps under `<workspace.area_apps>/` — maintained software, not time-bounded projects. A COD project's `app/` is reviewed with its project.

## Process

### Step 1: Run the query

```bash
bash <scripts.project_query> --tsv --status all
```

`--status all` matters: without it the script returns only `active` rows, so the paused and done rules below never see a project and unmigrated folders never show up.

The TSV output has these columns (tab-separated, no header):
```
slug   status   type   created   touched   days   flag
```

Parse it. If the script errors (missing dir, etc.), abort and tell the user.

### Step 2: Filter stale candidates

A project is a candidate if **any** of:

| Rule | Condition |
|------|-----------|
| Stale active | `status == active` AND `type != ongoing` AND `days >= 90` |
| Stale paused | `status == paused` AND `days >= 60` |
| Slipped done | `status == done` (any age — should already be in `<workspace.archive>/`) |

Always **skip** `type == ongoing` — recurring duties (1:1s, office hours) don't go stale by inactivity.

Rows with `status == "unmigrated"` (flag `NEEDS_SCAFFOLD`) are folders without a `CLAUDE.md`. They are never archive candidates. Count them for the note in Step 6 and leave them out of everything else.

If zero candidates, print:

```
Nothing stale right now. Active projects look healthy. ✨
```

…and stop. No questions.

### Step 3: Pull last-memory context per candidate

Read `<workspace.root>/<workspace.projects>/<slug>/memory.md` and extract:
- The last `## ` heading (most recent decision)
- The first non-blank line below it (1-line preview)

If `memory.md` is missing, use the literal `(no memory.md)`. This context goes into the multiselect labels so the user decides without opening each project.

### Step 4: Ask which to archive

If `AskUserQuestion` is not available (a subagent, scheduled or headless run), stop here: print the candidates with their Step 3 context, say "Nothing archived. Run /prune-projects in an interactive session to choose.", and end. No archive happens without the user's pick.

Use `AskUserQuestion` with `multiSelect: true`. Each option is one candidate; the label format is:

```
<slug> · <type> · <days>d · <last memory heading>
```

Prompt:

```
These N projects look stale. Pick the ones to archive — uncheck any to keep active.
```

Default: all candidates pre-selected. The user is more likely to glance and click *Archive* than to opt-in per project; a wrongly-archived project is one `mv` to undo, a missed cleanup persists.

If everything gets unchecked:

```
Nothing archived. Everything stays active. ✨
```

…and stop.

### Step 5: Chain to /archive-project per pick

For each approved slug, invoke `/archive-project` via the `Skill` tool, passing:
- The slug (so the chained skill skips its "which project?" prompt)
- "skip retro" as the retro answer (mass-asking 5 retros is noise; the user can append one later — retros are append-only)
- "yes" as the confirm answer (the multiselect WAS the confirmation)

**Run sequentially, not in parallel.** The shared archive directory makes parallel `mv` a race-condition trap, and sequential runs give a clean audit trail.

If one slug fails (folder already moved, permissions), capture the error, **continue with the rest of the batch**, surface the failure in the summary. Don't let one bad slug abort the prune.

### Step 6: Summary

```
✅ Prune complete: archived N, kept K active.

Archived:
  - <slug-1> (was 92d untouched)
  - <slug-2> (was 105d untouched)

Kept active (unchecked):
  - <slug-3>

Failed:
  - <slug-4>: <error message>

Next Friday review: <next-friday-date>
```

Compute next Friday relative to today. Skip empty sections (no "Failed:" if nothing failed).

If the query script flagged unmigrated folders, append:

```
Note: M folders in <workspace.projects>/ have no CLAUDE.md — triage them via /inbox-process.
```

Nudge only — don't auto-act on unmigrated folders. Stop after the summary: no auto-commit, no index edits.

## Example of a great run

```
> Friday review — what's gone cold?

These 2 projects look stale. Pick the ones to archive — uncheck any to keep active.
  [x] 2026-05-cto-travel-itinerary · execution · 48d… wait, 91d · "## 2026-04-06 — Flights booked"
  [x] 2026-05-2035-market-thesis · research · 97d · "## 2026-03-30 — Thesis v1 circulated"

→ user unchecks the market thesis (still simmering), approves the itinerary

✅ Prune complete: archived 1, kept 1 active.

Archived:
  - 2026-05-cto-travel-itinerary (was 91d untouched)

Kept active (unchecked):
  - 2026-05-2035-market-thesis

Next Friday review: 2026-07-10
```

Files changed: only what `/archive-project` changed for the approved slug (status flip + folder move).

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Query script not found | `<scripts.project_query>` deleted or moved | Abort with the path the user should restore from git |
| Candidate is an unmigrated folder (`status == "unmigrated"`, `NEEDS_SCAFFOLD`) | Folder has no CLAUDE.md | Never an archive candidate; count it for the `/inbox-process` note in Step 6 |
| All-archive batch picked | User clicked OK without unchecking | Trust the user — proceed; they can manually `mv` back from archive if regretted |
| `/archive-project` fails on first slug | Skill broken or moved | Abort the batch, surface the error, don't try the rest |
| `/archive-project` fails mid-batch | Per-slug issue (collision, etc.) | Continue, log to the Failed section of summary |
| `AskUserQuestion` not available (subagent, scheduled or headless run) | The tool is missing in that context | Report only. Print the candidate table from Steps 2 and 3, say that nothing was archived, and tell the user to run `/prune-projects` in an interactive session to choose. Never archive without the user's pick. |
| Configuration values missing | Root CLAUDE.md doesn't have a Configuration section, or this is a fresh fork | Tell the user to run `/bootstrap` first (two questions) or fill in the Configuration section by hand. Don't proceed with hardcoded fallbacks. |

## Output format

The Step 6 summary block, exactly — audit skills scan for "Prune complete:" lines. Always include "Next Friday review:" — it makes the cadence visible without requiring a cron.
