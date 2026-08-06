---
name: inbox-process
description: >-
  Confirmation-gated intake and cleanup for three surfaces: the workspace Inbox, misplaced workspace-root items, and loose Mac Desktop or Downloads files. Also surfaces unmigrated Projects folders missing CLAUDE.md. Use for "process inbox", "Friday cleanup", "clean up root", "organize my desktop", "clean up downloads", "triage inbox", or "what's unmigrated?". Routes known items to existing homes, sends uncertain items to Inbox, and never deletes or moves before showing a plan and getting approval. Sister skill to `/prune-projects`.
allowed-tools: Read Write Bash AskUserQuestion Skill
---

# inbox-process

One intake surface for four related cleanup jobs: Inbox triage, unmigrated Projects triage, workspace-root audit, and a loose-file sweep of Desktop or Downloads. Every mode is propose-and-confirm; deletion receives its own explicit confirmation.

**Before you begin: read the Configuration section in root CLAUDE.md.** Path tokens like `<workspace.inbox>` resolve to whatever's defined there.

## Why this exists

Two graveyard surfaces share the same triage shape:

1. **`0-Inbox/`** — capture zone. Items land fast (drag-drop, Drive download, paste). Without periodic triage, it graveyards. Research (§2 constraint #1) is unambiguous: surviving systems either skip Inbox entirely or have a discipline for clearing it. `<user.name>` kept Inbox per their README, so we need the discipline as a skill.

2. **Unmigrated `1-Projects/<slug>/` folders** (those missing `CLAUDE.md`) — folders placed in Projects without going through `/new-project`. Same disease: stuff dropped into the wrong location, never properly scaffolded, slowly accumulating. The workflow defect surfaced 2026-05-06 (9 of 12 Projects folders had no CLAUDE.md). Per SOUL Operating Principle "Capture before commit," these belonged in `0-Inbox/` until a deliberate decision to promote them — but absent a triage flow, they sat in `1-Projects/` unscaffolded.

These surfaces share the same triage flow: list candidates, inspect enough to route safely, show the full plan, confirm, then act. `/prune-projects` handles the *next* lifecycle stage (scaffolded projects that have gone stale).

`/save-resource` handles individual save-this-now operations. `/inbox-process` is the **iteration wrapper** that goes through everything weekly across both surfaces.

## When to use

Trigger phrases (broad — over-trigger rather than miss):
- "process inbox" / "process my inbox"
- "Friday inbox review" / "Friday inbox" / "Friday cleanup"
- "what's in inbox?" / "what's in my inbox?"
- "clear my inbox" / "clean up inbox"
- "triage inbox" / "go through inbox"
- "inbox-process" / "/inbox-process"
- "clean up root" / "tidy the workspace root" / "what shouldn't be in root?"
- "organize my desktop" / "sort my screenshots" / "clean up downloads"

Do NOT trigger for:
- A specific known item the user wants saved now ("save 0-Inbox/X to research") → use `/save-resource` directly
- Projects pruning (status review of `1-Projects/`) → that's `/prune-projects`
- Outputs <assistant.name> generates (briefings, meeting-prep, organization-reports) — those go to dedicated subdirs in `<workspace.resources>/`, not Inbox

## Choose the mode

- **Inbox mode** (default): run the process below for Inbox and unmigrated Projects.
- **Root-audit mode**: scan only the top level of `<workspace.root>`, preserve the canonical allowlist from root `CLAUDE.md`, and consult `references/root-routing.md`. Inspect every unknown item before proposing a destination. Prefer `git mv` for tracked items. Runnable code must go to an owning Area app at `<workspace.areas>/<area>/apps/<app-name>/`; `<workspace.coding>` is grandfathered and receives no new apps. If ownership is unclear, propose a standalone repository outside the committed workspace. Never move anything until the user approves the displayed plan.
- **Desktop-sweep mode**: scan loose files only (`find "$HOME/Desktop" -maxdepth 1 -type f`), plus `$HOME/Downloads` only when asked. Leave folders untouched. Route images to an existing media/screenshots home after listing `<workspace.resources>`; route a document to an active project only on an unambiguous filename match; otherwise route to Inbox. Never overwrite—add a numeric suffix on collision. Show the complete move plan and get approval first.

Root-audit and Desktop-sweep end with a short chat summary. Write a report only when the user asks for one; cleanup should not create documentation by default.

## Process

### Step 1: List candidates from BOTH surfaces

**Surface A — Inbox items:**
```bash
ls -1tr <workspace.root>/<workspace.inbox>/    # oldest first
```

**Surface B — unmigrated `1-Projects/` folders** (those missing `CLAUDE.md`):
```bash
for d in <workspace.root>/<workspace.projects>/*/; do
  [ -d "$d" ] && [ ! -f "$d/CLAUDE.md" ] && echo "$d"
done
```

Tag each candidate with its source surface so the disposition step can offer the right options. Inbox items get the standard 5-option set; unmigrated `1-Projects/` items add scaffold-in-place, route-code-app, and move-to-inbox.

If both surfaces empty:
```
Inbox is empty AND every 1-Projects/ folder has CLAUDE.md. ✨ Nothing to process.
```
…and stop.

### Step 2: Show the user the candidates

Print one numbered table per surface (or merged with surface column — your call based on volume):

```
=== 0-Inbox/ — N items (oldest → newest) ===

  1. <item-name>     <YYYY-MM-DD>   <size>   <preview>
  2. <item-name>     <YYYY-MM-DD>   <size>   <preview>
  ...

=== 1-Projects/ — M unmigrated folders (no CLAUDE.md) ===

  1. <folder-name>   <last-mtime>   <N items inside>   <preview>
  2. <folder-name>   <last-mtime>   <N items inside>   <preview>
  ...
```

**Preview** depends on the item:
- `.md` / `.txt` files → first non-empty line of the file (`head -n 5 | grep -v '^$' | head -1`)
- Folders → top-3 file/subdir names (e.g., `README.md, plan.md, mockups/`) so the user can guess content type
- Other files → just the file extension

This helps the user decide quickly without opening each file.

### Step 3: Iterate — ask disposition per item, then act

For each candidate, in oldest-first order (interleave both surfaces by mtime, OR finish Inbox surface first then 1-Projects surface — your call based on volume):

```
[Inbox] Item N of M: <item-name> (<YYYY-MM-DD>, <size>)
Preview: <preview>
```

OR

```
[1-Projects unmigrated] Item N of M: <folder-name> (last-mtime <YYYY-MM-DD>, <N items inside>)
Preview: <preview>
```

**For Inbox items**, use `AskUserQuestion` with the standard 5 choices:
- `promote` — file this in Resources (chains to `/save-resource`)
- `project` — turn this into a project (chains to `/new-project`, treats inbox content as initial material)
- `archive` — move to `<workspace.archive>/inbox-<today>/` (kept but out of the way)
- `delete` — gone (will ask to confirm)
- `keep` — leave in Inbox (skip for now)

**For unmigrated `1-Projects/` folders**, use `AskUserQuestion` with the extended 7-choice set:
- `scaffold-in-place` — keep the folder where it is, just add `CLAUDE.md` + `memory.md` (chains to a minimal `/new-project`-equivalent that scaffolds in the existing path; asks for type to populate frontmatter)
- `route-code-app` — this is runnable code. Ask which Area owns it, then propose `<workspace.root>/<workspace.areas>/<area>/apps/<name>/`; if no Area owns it, propose a standalone repository outside the committed workspace. Never place new code in grandfathered `<workspace.coding>`.
- `move-to-inbox` — wasn't actually project-scoped, demote back to `<workspace.inbox>/<folder-name>/` so it can be triaged like a normal Inbox item next pass
- `promote` — turn into Resources (chains to `/save-resource`); use when the folder is reference material, not a project (e.g., a Confluence dump, a research dump)
- `archive` — move to `<workspace.archive>/<folder-name>/` (no `inbox-<date>/` bucket since the folder already has a meaningful name)
- `delete` — gone (will ask to confirm)
- `keep` — leave it as-is in `1-Projects/` (skip for now — comes back next triage)

**Sequence: ask → act → next.** Don't batch all questions then act. The reason: `project` / `promote` / `scaffold-in-place` / `route-code-app` chain into other decisions; interleaving keeps each item's flow coherent.

### Step 4: Execute disposition

#### promote (both surfaces)
Invoke `/save-resource` via the `Skill` tool, passing the source path. For Inbox: `<workspace.inbox>/<item>`. For unmigrated 1-Projects: `<workspace.projects>/<folder>`. `/save-resource` handles the rest (asks for type, topic, filename, confirms, moves). It will move the source out of its origin location automatically when done.

#### project (Inbox surface only)
Invoke `/new-project` via the `Skill` tool. After the project is scaffolded at `<workspace.projects>/YYYY-MM-<slug>/`:

```bash
mv <workspace.inbox>/<item> <workspace.projects>/YYYY-MM-<slug>/<item-name>
```

The inbox content becomes the initial material in the new project's root. The user's `/new-project` answers (name, type) drive the slug; we just need the resulting path to do the final `mv`.

#### scaffold-in-place (1-Projects surface only)
The folder already lives at `<workspace.projects>/<folder-name>/` — just add the missing scaffold without moving it. Steps:

1. Ask the user via `AskUserQuestion` for project type (same choices as `/new-project` Step 2: design / research / execution / content / meeting / ongoing).
2. Read template at `<workspace.root>/<workspace.resources>/<templates.project_claude>` and write `<workspace.projects>/<folder-name>/CLAUDE.md` with frontmatter:
   - `status: active`
   - `created: <today YYYY-MM-DD>`
   - `project-type: <chosen type>`
   - `stakeholders: [<user.name>]`
3. Read template at `<workspace.root>/<workspace.resources>/<templates.project_memory>` and write `<workspace.projects>/<folder-name>/memory.md` with an initial entry:
   ```markdown
   ## YYYY-MM-DD — Scaffolded retroactively
   Decision: Folder pre-existed without CLAUDE.md. Triaged via `/inbox-process` and scaffolded in place.
   Why: <leave blank for user>
   Next: <leave blank>
   ```
4. Confirm to user: `✅ Scaffolded in place: <path>. CLAUDE.md + memory.md added.`

Don't `mv` the folder. Don't rename it. Existing content untouched.

#### route-code-app (1-Projects surface only)
The folder contains runnable code misplaced in tracked Projects. Steps:

1. Ask which existing Area owns the app. List `<workspace.areas>` rather than inventing a new Area.
2. If an Area owns it, compute `<workspace.root>/<workspace.areas>/<area>/apps/<folder-name>/`; validate the target does not exist; confirm the exact move; then move the folder. The app must own its own git, dependencies, secrets, deployments, and `app.manifest.json`.
3. If no Area owns it, stop and propose a standalone repository outside the committed workspace. Do not revive `<workspace.coding>` for new work.
4. Do not append to `<indexes.code_projects>`; that index describes grandfathered repositories only.

#### move-to-inbox (1-Projects surface only)
The folder wasn't project-scoped — demote back to Inbox for normal triage.

```bash
mv <workspace.projects>/<folder-name> <workspace.inbox>/<folder-name>
```

That's it. Next `/inbox-process` run picks it up as a regular Inbox item.

#### archive (both surfaces, slightly different)
**For Inbox items** — bucketed by date (multiple Inbox items on same triage day group):
```bash
bucket="<workspace.root>/<workspace.archive>/inbox-$(date +%Y-%m-%d)"
mkdir -p "$bucket"
mv "<workspace.inbox>/<item>" "$bucket/"
```

**For 1-Projects unmigrated folders** — keep folder name (it's already meaningful), no bucket:
```bash
mv "<workspace.projects>/<folder-name>" "<workspace.root>/<workspace.archive>/<folder-name>/"
```

After the move, optionally scaffold a minimal CLAUDE.md inside the archive folder with `status: done` so the retro-archive looks like a properly-archived project (matches the convention `/archive-project` produces). Same template as scaffold-in-place but with `status: done` and `completed: <today>`. Optional — skip if you want the move to be the only mutation.

#### delete (both surfaces)
**Confirm before deleting**:

```
AskUserQuestion: "Permanently delete <item>? This cannot be undone."
   Choices: yes / cancel
```

If `yes`: `rm -rf <path>` (folders need `-r`).
If `cancel`: skip — treat as "keep" for this run.

The double-confirmation is intentional. Inbox/Projects loss is real loss; it has no recycle bin behind it.

#### keep (both surfaces)
Do nothing. Item stays where it is. Move to next.

### Step 5: Failure handling

If a chained skill fails (e.g., `/save-resource` errors mid-flow), capture the error, log it, **continue with the next item**. Don't abort the whole triage on one bad disposition — `<user.name>` will be partway through and want to finish. Surface failures in the Step 6 summary.

### Step 6: Summary

After the loop, print:

```
✅ Triage complete: <N> Inbox items + <M> unmigrated 1-Projects/ folders processed.

Inbox dispositions:
  Promoted to Resources:  K   (saved via /save-resource)
  Made into projects:     L   (scaffolded via /new-project)
  Archived:               M
  Deleted:                P
  Kept in Inbox:          Q

1-Projects/ unmigrated dispositions:
  Scaffolded in place:    A   (CLAUDE.md + memory.md added at existing path)
  Routed as Area apps:    B
  Demoted to Inbox:       C   (will re-triage next pass)
  Promoted to Resources:  D
  Archived:               E
  Deleted:                F
  Kept (skipped):         G

Failed:                   R   <list each error: item, disposition, why>

Inbox now has Q items. 1-Projects/ now has G unmigrated folders.
Next Friday review: <next Friday's date>.
```

Compute next Friday relative to today (a date in the future, suggesting cadence without enforcing a cron).

If everything was kept (all action counters 0):
```
Nothing dispatched. State unchanged.
```

If both surfaces clear post-triage (Q=0 AND G=0):
```
Inbox cleared, 1-Projects/ fully scaffolded. ✨
```

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Both surfaces empty when invoked | Nothing to triage | Friendly message, stop. Step 1 handles. |
| `/save-resource` chained call fails mid-batch | Source already moved, type unclear, etc. | Log, continue, surface in summary |
| `/new-project` chained call fails | Name collision, slug error | Log, continue. Source stays put for next time. |
| `route-code-app` target already exists | Same app name already exists under the owning Area | Surface conflict; inspect the existing app before proposing a merge or new name |
| `scaffold-in-place` overwrites existing CLAUDE.md | Race — folder gained CLAUDE.md between Step 1 scan and Step 4 act | Re-check before write; if CLAUDE.md now exists, skip scaffold and treat as "keep" |
| User picks `delete` on everything | Possibly accidental | Each delete still requires its own confirm — that's the safety net. Trust the user after explicit confirmation. |
| `AskUserQuestion` not available (subagent context) | Worker subagents lack the tool | Pre-extract dispositions from invocation prompt. Treat the prompt as authoritative ("promote X to research, archive Y, scaffold-in-place Z as execution"). |
| Configuration values missing | Fresh fork | Error: tell user to run `/bootstrap` (TBD) or fill in Configuration manually first. |
| 1-Projects scan misses a folder that has an unrelated CLAUDE.md | Some legacy folder might have a `CLAUDE.md` that's not a real scaffold | Acceptable false-negative. The scan is "missing CLAUDE.md ⇒ unmigrated" — folders with CLAUDE.md are assumed scaffolded. If the user wants to re-scaffold one, they can `rm` its CLAUDE.md and re-run, OR use a future `/retro-project` skill. |

## Output format

Standard summary block (Step 6). Include the "Next Friday review:" line as a soft cadence prompt — it makes the weekly rhythm visible without requiring a cron.
