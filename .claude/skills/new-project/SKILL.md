---
name: new-project
description: Scaffolds a new workspace project using the PROJ or COD naming convention, or creates an Area-owned app repository with optional GitHub integration. Use when the user wants to start, kick off, scaffold, set up, or create a project, app, or repo. Routes personal one-video projects to /new-video-project.
allowed-tools: Read Write Bash AskUserQuestion Skill
---

# new-project

Scaffolds any new project — <assistant.name> meta-project OR Area-owned app repo. The two cases share 90% of the logic; the differences (folder location, git init, GitHub repo, app manifest) live in a single branch on the project-type question.

**Before you begin: read the Configuration section in root CLAUDE.md.** All paths, the user's name, and their GitHub username come from there. Throughout this skill, references like `<workspace.projects>` and `<user.github>` resolve to whatever's defined in that section. Don't hardcode.

## Why this exists

Per-project YAML frontmatter is the source of truth for project discovery. Every new project must start with that frontmatter populated correctly, or `/prune-projects` and frontmatter queries break. Doing this by hand is error-prone — date prefix, status field, project-type enum, template selection, and (for code) GitHub remote setup all need to be right. This skill makes the happy path one command.

**OKF structure (Pass 7, 2026-06-28 — corrected same day):** every non-code project scaffolds a machine-generated `index.md` alongside `CLAUDE.md` + `memory.md`. The index is a *derived view* of frontmatter — never hand-edited — so it doesn't violate the "no static INDEX" rule (decision #15, amended #15a to permit machine-generated indexes). It answers "what exists here", the fix for ad-hoc file recreation. **Do NOT pre-create folders** — no forced `inputs/`/`working/`/`outputs/` base-3 (that lifecycle scaffold was repealed; it's not part of OKF, which organizes by *concept*). Per C10, concept folders emerge as the project's content arrives, named for what they hold.

Code projects fold into this skill rather than living in a separate `/new-code-project` because the *shape* is the same: a folder with CLAUDE.md + memory.md + status frontmatter. New app repos live under the owning Area's `apps/` subtree, initialize their own git, optionally create a GitHub remote, and carry `app.manifest.json` for discovery. `<workspace.coding>/` is grandfathered for existing repos only.

## When to use

Trigger phrases (intentionally broad — over-trigger rather than miss):
- "let's start a new project on X" / "create a project for X" / "kick off X"
- "scaffold a project for X" / "set up the X work / prep / planning"
- "I want to track X properly" / "make a project to handle X"
- **Code-flavored:** "new MCP server for X", "scaffold a new agent", "spin up a repo for Y", "build a new tool", "new TypeScript/Python/Rust project for Z", "new library", "new CLI tool", "new bot"

Do NOT trigger for:
- Personal YouTube long-form videos or Shorts — use `/new-video-project`
- Tasks the user wants done *now* without a project folder ("draft an email", "summarize this transcript") — those don't need a scaffold
- Updates to existing projects — append to its memory.md instead
- One-off scripts that don't deserve their own repo — put them in a project's `scripts/` folder, or `<workspace.inbox>/` if nothing owns them yet

## Process

The skill is interactive. Confirm before writing files — the user can correct typos.

### Step 0: Connect before create — `/find` first

**Before any scaffolding, search.** Per SOUL.md Operating Principles ("Connect before create" / "Revive before scaffold" / "Capture before commit"), the second brain's whole purpose is knowing what already exists — AND not promoting half-formed ideas to full project scaffolds.

Run `/find <proposed-slug>` and `/find <topic-keywords>` across `<workspace.root>/<workspace.projects>/`, `<workspace.root>/<workspace.archive>/`, `<workspace.root>/<workspace.areas>/*/apps/`, and grandfathered `<workspace.root>/<workspace.coding>/`. Then ask the user via `AskUserQuestion` — the option set depends on what was found:

**If matches surface:**
```
Found existing work that may match:
  · 1-Projects/2026-01-ai-task-force-execution/  (active, last touched 2026-04-14)
  · 5-Archive/2025-12-old-attempt/                (archived, last touched 2025-12-15)

How do you want to proceed?
  [1] Continue in the active project (open <path>)
  [2] Revive the archived one (mv to 1-Projects/, flip frontmatter status: done → active,
      append "revived: <date> — <reason>" to memory.md)
  [3] Start fresh — this is genuinely a different scope
  [4] Capture to <workspace.inbox>/<slug>/ — uncertain, decide later via /inbox-process
  [5] Cancel — I'll pick the existing path manually
```

**If no matches:**
```
No existing work found for "<topic>".

How do you want to proceed?
  [1] Scaffold a full project now — this is real, scoped work
  [2] Capture to <workspace.inbox>/<slug>/ — uncertain or exploratory, decide later
  [3] Cancel
```

**The "capture to Inbox" branch (option [4] with-matches / [2] without-matches):** create `<workspace.root>/<workspace.inbox>/<slug>/` (or single `<slug>.md` file if the user is capturing a thought, not a folder of material) — NO `CLAUDE.md`, NO frontmatter, NO `memory.md`. Just the slug folder/file with whatever initial content the user has. Then stop. `/inbox-process` (Friday triage) will revisit and either promote to `1-Projects/`, file in `4-Resources/`, or archive. The signal that something belongs in Inbox vs Projects: **uncertainty about whether it's a project at all.** Half-formed ideas, exploratory captures, "I might want to look at this later," generated artifacts (decks/dashboards/reports) without a project owner — all Inbox. Things with a clear scope, deliverables, and commitment to follow through — those earn the `1-Projects/` scaffold.

**Step 0 is mandatory — not skippable on a judgement call.** The only waiver is an explicit, in-the-prompt user statement (*"yes, start a fresh project — I know <topic> exists / I'm sure this is project-scoped"*). Absent that exact signal, the `/find` + capture-vs-commit precheck always runs. Backstop: even if this step is somehow skipped, the `connect-before-create` PreToolUse guard fires when the skill writes to a new `1-Projects/` path and surfaces the closest existing matches for confirmation — so dedup is enforced at two layers, not one. The cost is one /find call (cheap); the benefit is preventing two failure modes: (a) `<topic>-revival` / `<topic>-v2` siblings that fragment lineage, AND (b) the unmigrated-folder graveyard in `1-Projects/` (folders without CLAUDE.md that should have been Inbox captures).

For the app-repo branch, `/find` should hit every Area's `apps/` subtree plus grandfathered `<workspace.coding>/` to surface existing repos. The `<topic>-revival` anti-pattern applies there too. App repos do NOT have a "capture to Inbox" branch — by the time you're scaffolding a repo, you've committed. Code uncertainty stays in chat or a scratch file.

If the user picks "scaffold full project" (or there were matches and they picked [3] start fresh) → proceed to Step 1. If they picked "capture to Inbox" → execute the capture (mkdir or write file), confirm to user, stop.

### Step 1: Get the project name

`AskUserQuestion` is multi-choice only — don't use it for free text:

1. **Check the invocation context first.** If the user named the thing in the trigger prompt ("let's start a project on the Q3 newsletter" or "scaffold an MCP server for the Anthropic admin API"), extract the name. For code projects, derive a reasonable kebab-case identifier (`anthropic-admin-mcp`).
2. **Otherwise ask in plain chat.** Print the question and wait for the next user message. Don't call `AskUserQuestion` for a free-text response — that creates a stutter (forces "Other → type" pattern).

### Step 2: Ask for the project type

Use `AskUserQuestion` with these choices:

- `design` — system design, architecture, planning meta-work
- `research` — exploratory investigation, deep-dives, literature reviews
- `execution` — operational rollout, project management, delivering an outcome
- `content` — YouTube, writing, talks, decks
- `meeting` — single-meeting prep packages
- `ongoing` — recurring duties (manager 1:1s, office hours, etc.)
- `code-repo` — an independently deployed app, service, MCP server, agent, library, CLI, or prototype with its own git repo

Why force the choice: this drives folder location, template selection, and downstream lifecycle. An `ongoing` project is never stale at 90 days; an `execution` project usually is; a `code-repo` lives under its owning Area's ignored `apps/` subtree. Misclassification breaks the lifecycle.

**If type = `code-repo`, branch to Step 2a–2b. Else continue to Step 3 (non-code path).**

New app repos are grouped by owning Area: `<workspace.root>/<workspace.areas>/<area>/apps/<name>/`. The repository folder itself remains stable lowercase-kebab. (Forks live separately at `<workspace.root>/<workspace.resources>/github-forks/` — they're reference material, not active development.)

### Step 2a (code-repo only): Ask for stack

`AskUserQuestion` with options + Other:

- TypeScript / Node
- Python
- Rust
- Markdown only (for docs / reading-list / reference repos)
- TBD (when the user is exploring and doesn't know yet — agent loops, prototypes, anything that might pivot)
- Other (free text in next chat message)

`TBD` is intentional. Forcing a commitment at scaffold time is wrong for exploratory work. If TBD, write `stack: []` (empty YAML array) and the user fills it in once the repo's purpose firms up.

### Step 2b (code-repo only): GitHub repo?

`AskUserQuestion` with two choices:

- `yes` — create a private GitHub repo under `<user.github>` and push the initial commit
- `no` — local repo only; the user can `gh repo create` later

### Step 2c (code-repo only): Choose the owning Area

Scan `<workspace.root>/<workspace.areas>/*/` and select the Area whose responsibility owns the app. This is required for new workspace-owned apps. If no existing Area fits, stop and ask whether to create a new evergreen Area or use a standalone repository outside the committed workspace. Never fall back to grandfathered `<workspace.coding>/` for new work.

### Step 3 (non-code only): Compute the prefixed, date-based slug

Choose the C9 prefix before creating the path:

- `COD-` when the project tracks or plans a code effort but the runnable repo itself lives separately under an Area's `apps/` subtree.
- `PROJ-` for every other non-video project.
- Never use `VID-` here; route one-video projects to `/new-video-project`.

Then add today's month (`date +%Y-%m`) and slugify the name (lowercase, spaces→hyphens, strip non-alphanum-hyphen, collapse hyphens, trim).

```bash
slug=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 -]//g' | tr -s ' ' '-' | sed 's/^-*//;s/-*$//')
date_prefix=$(date +%Y-%m)
# Set to COD for a code-effort tracker; otherwise PROJ.
project_prefix="PROJ"
folder="<workspace.root>/<workspace.projects>/${project_prefix}-${date_prefix}-${slug}"
```

For code-repos, **don't** date-prefix the folder — repo names are stable identifiers (and become GitHub identifiers). Use the name as-is, just kebab-case it lightly. Path: `<workspace.root>/<workspace.areas>/<area>/apps/<name>/`.

### Step 4: Confirm the path with the user

Show the full plan via `AskUserQuestion` (yes/no), substituting the resolved paths from root CLAUDE.md:

**Non-code:**
```
Will create: <workspace.root>/<workspace.projects>/<PROJ|COD>-2026-MM-<slug>/
  Type: <type>
Proceed?
```

**Code-repo:**
```
Will create:
  Owner:  <workspace.areas>/<area>/
  Path:   <workspace.root>/<workspace.areas>/<area>/apps/<name>/
  Stack:  <stack or "TBD">
  GitHub: <github.com/<user.github>/<name> or "local-only">
  Discovery: app.manifest.json
Proceed?
```

If no, ask for a corrected name and retry from Step 1.

### Step 5: Validate uniqueness

```bash
[ -d "$folder" ] && error "already exists"
```

Don't auto-rename. Tell the user the path, ask for a different name.

For code-repos, create the owning Area's `apps/` directory if it is missing. The outer workspace `.gitignore` must ignore `2-Areas/*/apps/*` before writing app source.

### Step 6: Read the right template

Templates live at `<workspace.root>/<workspace.resources>/templates/`:

| Type | CLAUDE template | Memory template |
|------|-----------------|-----------------|
| Non-code | `<templates.project_claude>` | `<templates.project_memory>` |
| `code-repo` | `<templates.code_claude>` | `<templates.project_memory>` (same) |

Read both with the `Read` tool.

### Step 7: Populate frontmatter and write `CLAUDE.md`

**Non-code substitutions:**
- `status: active`
- `created: <today YYYY-MM-DD>`
- `project-type: <chosen type from Step 2>`
- `stakeholders: [<user.name>]` (default — user can add more later)
- `parent_hq: <hq-name | none>` — see "HQ linkage" below
- `# <project-slug>` heading replaced with actual slug

**HQ linkage (added 2026-05-20):**

Before writing the frontmatter, detect existing HQs by scanning `<workspace.root>/<workspace.areas>/*/` (i.e. `workspace/2-Areas/*/`). If at least one HQ exists, ask via `AskUserQuestion`:

> *"Which HQ does this project belong under?"*

Options = each HQ found (`ai-task-force`, `email`, `newsletter`, `briefings`, etc) + `none` (standalone). Default to whichever HQ's routing triggers best match the project name/description (e.g., "ai-champions" → `ai-task-force`). Single-select.

Write the chosen value (sans `hq-` prefix) to `parent_hq:`. If user picks "none", write `parent_hq: none`. The HQ's `memory.md` Active projects section should be updated by the user later (manual for now — future: hook).

If no HQs exist (fresh fork), skip the prompt and write `parent_hq: none`.

**Code-repo substitutions:**
- `status: active`
- `created: <today YYYY-MM-DD>`
- `stack: [<chosen stack>]` (proper YAML array — `[TypeScript, Node]`, `[Python]`, etc.; or empty `[]` if TBD)
- `github: github.com/<user.github>/<name>` if Step 2c = yes, else `github: <none>`
- `deploy: local-only` (placeholder; user edits later)
- `# <repo-name>` heading replaced

Leave the summary, project-specific rules, and key-links/build-test-deploy sections as their template placeholders — the user fills them in as the project grows.

Write to `<folder>/CLAUDE.md`.

### Step 8: Populate `memory.md` and write it

Read the memory template. Replace `<project-slug>` heading with the actual slug.

Append an initial decision-log entry (don't replace the template's example — append a real one):

```markdown
## YYYY-MM-DD — Project created

Decision: Scaffolded project folder via `/new-project` skill. <type or stack summary>.
Why: <leave blank for the user to fill in>
Next: <leave blank>
```

For code-repos, include the stack in the Decision line: *"Stack: Python."*

Write to `<folder>/memory.md`.

For code-repos, also write `<folder>/app.manifest.json`:

```json
{
  "schema_version": 1,
  "app_id": "<name>",
  "name": "<human name>",
  "owner_area": "<area>",
  "status": "active",
  "visibility": "private",
  "stack": ["<stack>"],
  "purpose": "<one-line purpose>"
}
```

### Step 8.5 (non-code only): Generate index.md (no forced folders)

Per C10 (v1.2), do NOT pre-create any folders — no base-3, no type-specific dirs. The project starts as `CLAUDE.md` + `memory.md` + a machine-generated `index.md`. Concept folders emerge later, as content arrives, named for what they hold (OKF concept organization).

```bash
# Generate the machine-generated OKF index.md (project root). Derived view of frontmatter —
# never hand-edited. The okf-index-regen PostToolUse hook keeps it fresh as files are added.
node "$CLAUDE_PROJECT_DIR/.claude/hooks/lib/okf-index.mjs" "$folder"
```

When the user later adds material, create a folder **named for the concept** it holds (`meetings/`, `data/`, `decisions/`, `analysis/`, `drafts/`, `sources/` — see C10's per-type examples), only when there's content to put in it. Don't reach for `inputs/working/outputs` by default — that lifecycle scheme is optional and only fits genuine produce-a-deliverable pipelines. The index regenerates automatically as folders and files appear.

### Step 9 (code-repo only): git init + optional gh

```bash
cd <path>
git init -q
git checkout -b main
git add CLAUDE.md memory.md app.manifest.json
git commit -q -m "Initial scaffold"
```

If Step 2b was `yes`:
```bash
gh repo create <user.github>/<name> --private --source=. --remote=origin --push
```

If `gh` fails (not installed, not authenticated, network), capture stderr and surface to the user:
> *"`gh repo create` failed: `<stderr>`. Local repo is fine — run the `gh repo create` command manually when ready."*

Don't abort the whole skill on a `gh` failure; the local repo is still useful.

### Step 10 (code-repo only): Verify Area app discovery

Run the session-start inventory hook and confirm it discovers `<folder>/app.manifest.json` under the expected owner Area. Do not append new apps to the legacy `<indexes.code_projects>` table; that index remains for grandfathered `<workspace.coding>/` repos.

### Step 11: Confirm to user — and tell them to switch context for code-repos

**Non-code message:**

```
✅ Project created: <workspace.root>/<workspace.projects>/<PROJ|COD>-2026-MM-<slug>/

Files:
  CLAUDE.md       status: active · type: <type> · stakeholders: [<user.name>]
  memory.md       1 entry (Project created · YYYY-MM-DD)
  index.md        machine-generated — never hand-edit (regenerates on write)

No folders pre-created (OKF concept organization, C10 v1.2). Add a concept-named
folder when you have content for it (e.g. meetings/, data/, decisions/, drafts/).

Next: edit CLAUDE.md to add the one-line summary and any project-specific rules.
The index.md tracks what exists as the project grows.
```

**Code-repo message — different ending:**

```
✅ Code repo scaffolded: <name>
  Owner:  <workspace.areas>/<area>/
  Path:   <workspace.root>/<workspace.areas>/<area>/apps/<name>/
  Stack:  <stack or "TBD">
  GitHub: <url or "local-only">
  Discovery: app.manifest.json

Heads up: code repos work best when you open them in their own context. Recommended:
  - Open the folder directly in VS Code: `code <workspace.root>/<workspace.areas>/<area>/apps/<name>`
  - Or start a fresh Claude Code session inside the repo:
      cd <workspace.root>/<workspace.areas>/<area>/apps/<name> && claude

Claude Code's nested CLAUDE.md inheritance means the repo's own CLAUDE.md will auto-load when you work inside it, giving you the right code-flavored context (stack, build commands, key files) without the rest of the workspace getting in the way.

Next: edit CLAUDE.md to fill in build/test/deploy commands and keep app.manifest.json accurate as the app moves from prototype to production.
```

The "switch context" suggestion is real value — code work benefits from the repo being its own working directory, both for Claude Code's context loading and for the developer's own focus.

Stop. Don't auto-open files, don't propose follow-up scaffolding (no `npm init`, `pip install`, boilerplate). The skill creates the structure; the user does the actual coding.

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `mkdir: cannot create directory` | Wrong working directory | Run from the workspace root (where root CLAUDE.md lives). Check with `pwd`. |
| Templates not found | Template files missing under `<workspace.root>/<workspace.resources>/templates/` | Verify before reading; if missing, error and tell the user to restore from git |
| Slug came out empty | Name was all special chars | Re-prompt: "That name didn't slugify cleanly — try one with letters/numbers" |
| Folder exists | Same name was used before | Don't overwrite. Suggest a *different descriptive name* (NOT a `-v2` suffix — version suffixes violate the naming standard; the existing folder is likely the project to continue in, so route back to Step 0). |
| Code-repo: `gh repo create` fails | Not authenticated / network / GitHub name collision | Surface stderr, suggest manual `gh repo create` |
| Code-repo: owning Area has no `apps/` directory | First app in that domain | Create `apps/` after confirming the Area owns the app; verify the outer `.gitignore` rule first |
| AskUserQuestion not available | Subagent context | Pre-extract answers from invocation prompt; skip every AskUserQuestion call |
| Configuration values missing | Root CLAUDE.md doesn't have a Configuration section, or this is a fresh fork | Tell the user to run `/bootstrap` (TBD) or fill in the Configuration section by hand. Don't proceed with hardcoded fallbacks — that defeats the portability goal. |

## Output format

Two final-message templates above (Step 11). Use the right one based on whether `code-repo` was selected. Both end with a clear "Next:" line — `/prune-projects` and the UserPromptSubmit hook will scan transcripts for "Project created" / "Code repo scaffolded" patterns.
