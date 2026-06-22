# 2-Areas

Evergreen **HQ workstations** — one folder per long-running area of responsibility. This is the "A" in PARA.

## Purpose

An Area (HQ) is a workstation that **accumulates monotonically** — strategy, playbooks, durable artifacts for one ongoing area of responsibility. Unlike a project, it has no "done" state: it grows from completed projects, never empties, and is owned indefinitely.

Each HQ lives at `<workspace.root>/2-Areas/<name>/` and holds its own:

```
2-Areas/<name>/
├── CLAUDE.md      # the HQ's operating rules + routing triggers
├── memory.md      # the HQ's working memory (durable, curated)
└── resources/     # playbooks, locked artifacts, reference for this area
```

**This folder is empty on a fresh fork.** You don't need it on day one. HQs emerge as your work develops recurring, long-running threads — a client, a program, a product line, a team you support.

## Project vs Area — the distinction

| | `1-Projects/` | `2-Areas/` |
|---|---|---|
| Lifespan | Time-bound, has a "done" | Evergreen, never "done" |
| Example | "Q3 pricing redesign" | "Pricing & packaging" (the ongoing area) |
| On completion | Archived to `5-Archive/` | Receives the project's durable artifacts |
| Frontmatter | `status: active\|done` | n/a (always live) |

A project names its parent area with `parent_hq:` frontmatter (the bare HQ name, e.g. `parent_hq: pricing`). When the project completes, `/archive-project` promotes its durable artifacts into `2-Areas/pricing/` and archives the tactical residue.

## What belongs here

- ✓ "Client X" — an account you support across many projects over time
- ✓ "Hiring" — the ongoing function, accumulating playbooks + req history
- ✓ "Newsletter" — a recurring publication with evolving voice + back-catalogue
- ✓ "Platform team" — a group you partner with indefinitely

## What doesn't belong here

- ✗ A bounded deliverable with a deadline → `1-Projects/`
- ✗ A one-off reference doc or saved article → `4-Resources/`
- ✗ A code repo → `3-Coding/`
- ✗ A half-formed idea → `0-Inbox/`

## HQ routing (progressive context loading)

Once you have HQs, **don't pre-load them all** at session start — that bloats context. Keep a routing-map table in your root `memory.md` mapping task type → HQ. At the start of each turn, match the task and load **only** the matched HQ's `CLAUDE.md` + `memory.md`. When nothing matches, work from root context alone. The HQ model in root `CLAUDE.md` documents this in full.

## How `<assistant.name>` uses this folder

- Reads the matched HQ's `CLAUDE.md` + `memory.md` when a task routes to it
- Promotes durable artifacts here when `/archive-project` completes a project whose `parent_hq:` points at this HQ
- Applies a freshness check on every file promoted — stale-on-promotion pollutes the evergreen OS

## Creating an HQ

There's no dedicated skill — an HQ is a deliberate decision, not a scaffold. When a workstream has clearly earned evergreen status:

1. `mkdir 2-Areas/<name>/` with `CLAUDE.md` + `memory.md` + `resources/`
2. Write the HQ's operating rules + routing triggers into its `CLAUDE.md`
3. Add a row to the routing-map table in root `memory.md`
4. Point relevant projects at it via `parent_hq: <name>`
