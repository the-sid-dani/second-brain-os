---
name: migrate-work
description: Bring a user's EXISTING work into their second-brain-os PARA workspace by reading their past Claude Cowork sessions (local transcripts on disk) — discovering the projects they've actually been working on, then scaffolding the chosen ones as organized PARA entries (1-Projects or 4-Resources) with a CLAUDE.md + memory.md seeded from the session context. Read-only discovery + a fan-out of scout subagents (one per discovered project) + a SINGLE approval gate, then copy-never-move writes. Offered at the end of `/bootstrap` and re-invokable anytime. Use when the user says "/migrate-work", "bring in my existing work", "import my projects", "I have existing projects to bring over", "organize my past work", "migrate my cowork sessions". Hard invariants live in SKILL.md body — copy-never-move, read-only discovery, one approval gate, no fabrication, runnable code routes to the coding bucket (`<workspace.coding>`), never auto-commit.
allowed-tools: Read Bash Glob AskUserQuestion Skill Task
---

# migrate-work

Pulls your existing work into your PARA workspace. The signal is your **past Claude Cowork sessions** (stored locally on your Mac) — not a blind scan of your folders. It reads what you've actually been working on, shows you the distinct projects it found, and — for the ones you pick — scaffolds clean PARA entries with a `CLAUDE.md` + `memory.md`, copying any real work files in (never moving them).

**Why sessions, not a folder scan:** your work could live anywhere; your Cowork sessions are the reliable record of *what you actually do*. Each session carries a title, a working directory, and a transcript — enough to recognize a project and seed its memory.

## Hard invariants (DO NOT VIOLATE)

- **M1 — COPY, NEVER MOVE.** Originals are never moved, renamed, or deleted. Bring work in with `cp`; the user's source folders stay exactly where they are. A move that loses someone's only copy of real work is unrecoverable.
- **M2 — DISCOVERY IS PURE READ.** Phase 1 (enumerate sessions, read transcripts, scout-summarize) touches nothing on disk. No write happens before the approval gate. Every probe verb is read-only.
- **M3 — ONE APPROVAL GATE.** Exactly one human stop: the barrier between discovery and writes. Nothing is scaffolded or copied until the user explicitly selects items. Low-confidence/flagged items are never auto-applied.
- **M4 — NO FABRICATION.** Every discovered "project," summary, and seeded memory line traces to real session content. Never invent a project, a purpose, or a decision the transcript doesn't show. If a session is ambiguous, flag it for the user — don't guess. (Recency-derived *metadata* — `suggested_status`, date range — is allowed ONLY as a LABELED inference confirmed at the approval gate; transcript-derived claims — summary, decisions, seed_memory — must be grounded in actual session content.)
- **M5 — CODE PLACEMENT.** Any runnable code (a git repo, a `package.json`/`pyproject`/`Cargo.toml` tree, scripts) routes to `<workspace.coding>/` (gitignored) or stays a standalone repo with a pointer — NEVER copied into `1-Projects/`, `4-Resources/`, or `0-Inbox/`. (Locked code-placement rule.)
- **M6 — NEVER AUTO-COMMIT.** Writes create new files in the workspace; stop at the diff and surface a manual commit command. Never `git add`/`git commit`.

All paths resolve from the Configuration section in root `CLAUDE.md` (`<workspace.root>`, `<workspace.projects>`, `<workspace.resources>`, `<workspace.coding>`). Read those first.

---

## Phase 1 — Discover (read-only)

### 1a. Enumerate Cowork sessions

Cowork (Claude Desktop local-agent mode) stores sessions on disk as standard JSON/JSONL:

```bash
COWORK="$HOME/Library/Application Support/Claude/local-agent-mode-sessions"
# metadata file per session (title, cwd, model, createdAt, lastActivityAt) — small to read via jq
find "$COWORK" -maxdepth 3 -name 'local_*.json' -not -path '*/local_*/*' 2>/dev/null
# transcript per session
find "$COWORK" -maxdepth 4 -name 'audit.jsonl' 2>/dev/null
```

For each session metadata file, extract just the lightweight fields (don't load the whole ~1MB blob). **The real top-level keys are camelCase epoch-ms** — `createdAt`, `lastActivityAt` (verified against live Cowork metadata; there is no `created_at`/`timestamp`):

```bash
jq -r '{title, cwd, model, created_ms: .createdAt, last_activity_ms: .lastActivityAt}' "$meta" 2>/dev/null
# human date from an epoch-ms value: date -r $(( <ms> / 1000 ))
```

**Graceful degradation (M2/M4):** if `$COWORK` doesn't exist, or there are zero sessions, say so plainly — *"I don't see any local Cowork sessions on this machine, so there's nothing to import from there."* — and stop (optionally mention the Claude Code CLI transcripts at `~/.claude/projects/<hash>/*.jsonl` as a secondary source if the user wants). Never pretend work exists.

### 1b. Group sessions into candidate projects

Sessions are noisy and repetitive — collapse them into distinct projects before showing the user:
- **Same `cwd` = same project** (strongest signal). Group all sessions sharing a working directory.
- **Similar titles** with no/!shared cwd → group by obvious title stem.
- Drop throwaway sessions (empty title, a couple of turns, scratch/test names) — flag-low, don't surface by default.

Produce a candidate list: `{ project_label, cwd (if any), session_count, date_range, sample_session_paths }`.

### 1c. Fan out scout subagents (one per candidate project)

For each candidate, spawn a **read-only scout** via the `Task` tool, in parallel (this is the fan-out — like `inbox-process` per-item, but parallel). Dispatch each scout with a **read-only tool set** (Read, Glob, and Bash limited to read verbs — NO Write/Edit), and make its contract explicit: *returns a proposal only, performs zero writes.* This makes M2 structural, not just prose. Each scout:
- Reads a SAMPLE of the candidate's transcript(s) — `head`/`tail` of `audit.jsonl`, or the first/last N user+assistant turns via `jq` — NOT the whole thing.
- If the session has a `cwd` that still exists, lists it shallow (read-only: `ls`, `git -C "$cwd" rev-parse`, doc count) to see if real files back the work.
- Returns a structured proposal (NEVER writes anything):
  - `project_name` + `one_line_summary` (from real transcript content; M4)
  - `suggested_bucket`: `1-Projects` (active, time-bound work) | `4-Resources` (reference/research/notes) — the only two targets unless it's clearly a code repo
  - `is_code`: true if `cwd` is a runnable code tree (→ M5: route to `3-Coding`, flag, don't fold into a project folder)
  - `suggested_status`: active | paused | done — an INFERENCE from recency (`lastActivityAt`), NOT a transcript fact; surfaced at the approval gate and only written as `status:` after the user confirms
  - `seed_memory`: 2-5 bullet points of durable context/decisions actually present in the transcript
  - `cwd_has_files`: whether real source files exist to optionally copy in
  - `confidence` + `flags` (ambiguous? mixed projects? code+docs?)

Collect all scout proposals (barrier).

---

## Phase 2 — Approve (the ONE gate, M3)

Present a single, scannable picture: *"From your Cowork sessions I found these projects."* Use `AskUserQuestion` (multi-select), one row per candidate, annotated with the evidence — label, what it was, session count + date range, suggested bucket, and any flag. Group by suggested bucket. Collapse low-confidence/throwaway candidates under a "maybe" note rather than selecting them.

The user picks which to bring in. For each picked item also confirm, in the same gate or a short follow-up:
- target bucket (`1-Projects` vs `4-Resources`) — default to the scout's suggestion,
- whether to **copy the work files** from its `cwd` too (default: scaffold the PARA entry seeded from the session; copy files only if the user says yes),
- code repos: confirm they go to `<workspace.coding>/` (M5), not into a project folder.

Nothing is written until the user has selected. Cancel = stop, zero changes.

---

## Phase 3 — Bring it in (writes, approved items only)

For each approved item, in sequence:

1. **Scaffold the PARA entry — non-code branch ONLY.** Dispatch to `/new-project` for the scaffold (it does classify + `YYYY-MM-<slug>` naming + frontmatter + templates + `parent_hq` linkage). Result:
   - `1-Projects/YYYY-MM-<slug>/` with `CLAUDE.md` (`status:` from the **user-confirmed** suggested_status, `created:` today, `project-type:`, one-line summary, ≤80 lines) + `memory.md`.
   - or a `4-Resources/<topic>/` entry for reference-type work.
   - **NEVER invoke `/new-project` with `type=code-repo` from here.** That branch runs `git add`/`git commit` and can `gh repo create … --push` — which would violate M6 (no auto-commit) and M5 (code gets a pointer, not a scaffold). Code candidates take the pointer path in step 3, never `/new-project`.
2. **Seed `memory.md`** (append-only) from the scout's real findings — e.g.:
   ```
   ## <today> — imported from Cowork sessions
   - Source: <N> Cowork sessions, <date range>, cwd `<cwd>`
   - What this was: <one_line_summary>
   - Context carried over: <seed_memory bullets — only what the transcript actually showed>
   ```
   Never fabricate (M4).
3. **Copy work files only if approved (M1 — copy, never move).**
   - **Sandbox guard:** if `<cwd>` is empty/unresolved, matches `*/sessions/*`, or lives under the Cowork `local-agent-mode-sessions` dir, it's a throwaway sandbox path — NOT real work. Skip the copy entirely and seed the entry from the transcript only.
   - **Mandatory secret pre-scan** (before any copy, regardless of is_code): `grep -rIlE '(api[_-]?key|secret|token|passwd|password|BEGIN [A-Z ]*PRIVATE KEY)' "<cwd>" 2>/dev/null` and check for `.env` / `*.pem` / `*.key`. If ANY hit, ABORT this item's copy and flag it for the user — never copy secrets into a committed workspace folder (the locked code-placement rule; the 2026-06-12 leak precedent).
   - **Copy with `rsync`** (BSD `cp -R` has no `--exclude`, so it would drag in `.git/` + secrets — never use it here). `.git/` is ALWAYS excluded:
     ```bash
     rsync -a --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='build' \
           --exclude='__pycache__' --exclude='.venv' --exclude='.env' --exclude='*.pem' --exclude='*.key' \
           "<cwd>/" "<dest>/"
     ```
   - Originals stay exactly where they are.
   - **If it's runnable code (M5):** do NOT copy into the project/resource folder at all — it belongs in `<workspace.coding>/`. Add a one-line pointer + an index row in `<workspace.resources>/code-projects.md` and leave the repo where it is (copy into `<workspace.coding>/` only if the user explicitly asks for a working copy there).
4. **Log** the migration (what was scaffolded, what was copied vs referenced).

After all approved items: print a summary of what was created, then surface the manual commit command as TEXT (M6 — never run it):

```
Brought in <N> projects. Originals untouched.
Created: <list of new workspace paths>
Review and commit when ready:
  git add -A && git commit -m "migrate-work: import <N> projects from Cowork sessions"
```

---

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Reported projects that don't exist in any session | M4 violated — fabrication | Every candidate traces to real session metadata + transcript; flag ambiguous, never invent |
| Moved/renamed a user's folder | M1 violated | COPY only (`cp`); originals are never touched. State this up front |
| Wrote files before the user picked | M3 violated | Phase 1+2 are read-only/selection only; Phase 3 runs only on explicitly approved items |
| Code repo folded into `1-Projects/` with its secrets | M5 violated | Runnable code → `<workspace.coding>/` + pointer; never into project/resource/inbox folders |
| Choked reading 1MB session metadata × N | loaded whole blobs | Extract only `title`/`cwd`/`createdAt`/`lastActivityAt` via jq; sample transcripts (head/tail/N turns), never load whole files |
| "No sessions" treated as an error | absent Cowork dir on this fork | Degrade gracefully — say there's nothing to import and stop; never assume work exists |
| Auto-committed the migration | M6 violated | Surface the commit command as text only |
| Delegated `/new-project` auto-committed or pushed a repo | routed a code candidate into `/new-project`'s code-repo branch | NEVER call `/new-project` with `type=code-repo`; code → pointer + `code-projects.md` row only (M5) |
| `.git/` or a `.env` copied into a project folder | used `cp -R` (no exclude) or skipped the secret pre-scan | Use the `rsync --exclude` command; run the mandatory secret pre-scan; `.git/` is always excluded |

## Boundaries

- **Copy, never move** (M1) · **discovery is read-only** (M2) · **one approval gate** (M3) · **no fabrication** (M4) · **runnable code → `<workspace.coding>/`** (M5) · **never auto-commit** (M6).
- Reads ONLY the user's own local Cowork/Claude Code session files — never anyone else's data, never the network.
- The two valid migration targets are `1-Projects/` (active, time-bound) and `4-Resources/` (reference/research). Evergreen areas (`2-Areas/`) and archive (`5-Archive/`) are not auto-created here — surface them as a suggestion if a candidate clearly fits, but let the user place those deliberately.
