---
name: bootstrap
description: Interactive first-run setup for a fresh fork of the second-brain-os — THE entry point every fork user runs once to configure their identity, name their assistant's persona (no default name — fork users always name their own), pick a design system, create the PARA workspace, and write the Configuration token block in root CLAUDE.md. A short, plain-language guided walkthrough for knowledge workers (~8-10 min) with AskUserQuestion gates and a brief why-it-matters intro on each step; nothing is installed, nothing is committed, every write asks first. When core setup finishes, it offers two OPTIONAL go-further steps — learning your writing voice from your own sent Slack/Gmail messages (with consent), and bringing your existing work in via `/migrate-work`. Detects re-runs via `setup_completed:` and refuses gracefully. Use after cloning the repo, or to reconfigure identity / persona / workspace — phrases like "/bootstrap", "I just cloned this", "first-time setup", "configure the assistant". Tiger invariants T1-T4 (never overwrite user-edited persona files, never re-run on a configured fork, never auto-commit, never install tools) live in SKILL.md body.
allowed-tools: Read Write Edit Bash AskUserQuestion Skill
---

# bootstrap

First-run setup. Walks a freshly-cloned fork through identity, naming your assistant (you always name your own — no default), a design system, the PARA workspace, configuration, and a quick smoke test — then offers two optional extras (writing voice from your sent messages; bringing in your existing work). **A short, plain-language walkthrough — about 8-10 minutes for the core.**

**Why this is the most important skill:** every fork user runs it exactly once, and the whole harness is built on what it writes. A broken `/bootstrap` ships a broken second brain to every fork.

**Design principle — warm, brief, in control.** This is for knowledge workers, not engineers. Open each step with one or two plain sentences on *why* it matters — not a script, not a wall of text, no jargon. Every write gets a preview + an `AskUserQuestion` gate before it happens; nothing is installed; nothing is committed. The feel is a sharp colleague walking you through it, never an "automated wizard." When in doubt, fewer words.

## Tiger invariants (LOAD-BEARING — DO NOT VIOLATE)

The four tiger invariants are referenced by ID throughout this file. Canonical statements live here only.

### T1 — NEVER overwrite user-edited persona files without explicit confirmation

If a root persona file (`SOUL.md`, `USER.md`, `IDENTITY.md`, `CLAUDE.md`, `README.md`, `TOOLS.md`) has been edited beyond what the persona template would produce, the apply step MUST detect this via `git diff --quiet HEAD -- <file>` and ask before overwriting. Default behavior: skip. Only overwrite when the user explicitly confirms.

### T2 — NEVER re-run on an already-configured fork without explicit user action

Step 1 detects re-run via `grep -E "^- \`setup_completed\` = " CLAUDE.md`. If found, refuse and print: *"This fork is already configured (setup_completed: <date>). To re-run /bootstrap, delete the `setup_completed` line in CLAUDE.md and invoke /bootstrap again. For partial edits, update the root Configuration section and the relevant persona file directly with the user's approval."* Do NOT proceed past Step 1. (The two optional go-further steps are separately re-invokable — see Step 6 — and do not trip T2.)

### T3 — NEVER auto-commit

After writes complete, surface the diff (or path list) and tell the user to commit manually. NEVER run `git add` or `git commit`.

### T4 — NEVER install tools

The environment check is READ-ONLY. If a tool or connector is missing, surface a hint (`/mcp` to authorize a connector; the tool's own installer for a CLI). Never run an installer.

---

## Process — 6 steps + 2 optional extras

### Welcome (intro beat, before Step 1)

Open with a short, warm welcome in your own words (you don't have a name yet — that comes in Step 4). Hit three beats, briefly: (1) we're making this fork *yours* — your assistant's name, personality, and writing voice; (2) it takes ~10 minutes and every change asks first — nothing installed, nothing committed; (3) say so if anything feels off. A few sentences, not a script. Then go straight into Step 1.

---

### Step 1: Fork-state check (T2 — never re-run on a configured fork)

```bash
grep -E "^- \`setup_completed\` = " CLAUDE.md 2>/dev/null
```

- **Match found**: print the T2 refusal copy and STOP.
- **No match**: print *"Fresh fork detected — let's set you up."* and continue.

---

### Step 2: Connectors + quick check (T4 — read-only)

One sentence on why: a couple of optional connectors make the everyday skills (briefing, contact lookup, writing-voice) richer — let's see what you've got and add what you use.

**Quick read-only check** (capture output; never let a missing tool fail the skill):

```bash
node --version 2>&1; git --version 2>&1          # required basics
jq '.mcpServers | keys[]' .mcp.json 2>&1          # MCPs registered by default
```

Note in one line what's present. (If `git`/`node` are missing — rare, since Claude Code needs node — give a one-line install hint, T4, and continue.)

**Optional connectors (opt-in).** Three universal MCPs ship by default (gemini-vision, exa, firecrawl). Offer the common knowledge-worker connectors — **Google Workspace and Slack are the two most people already use**, so recommend those:

| Question | Options (multi-select) |
|----------|---------|
| "Which of these do you use? I'll wire them up (you'll authorize with `/mcp` after setup)." | (a) **Google Workspace** (Gmail + Calendar + Drive) — *recommended* / (b) **Slack** — *recommended* / (c) **Atlassian** (Jira + Confluence) / (d) **Figma** / (e) **None for now** |

For each picked connector, append its canonical entry to `.mcp.json` via a small Python `json.load`/`dump` (preserves order, no jq dependency). **Canonical entries are the single source of truth in `.mcp.json` `_notes.opt_in_*`** (`opt_in_google_workspace`, `opt_in_slack`, `opt_in_atlassian`, `opt_in_figma`) — read them at runtime; do not hardcode JSON here. If `.mcp.json` is missing/malformed, write a minimal `{"mcpServers":{}}` shell first.

Closing line: *"Added <list>. Run `/mcp` after setup to authorize each (standard browser sign-in)."* If none picked: *"No problem — the 3 built-in tools cover search and image/doc analysis. You can add connectors later by re-running this or hand-editing `.mcp.json`."*

> Coding-tier forks only (`SBOS_TIER=coding` in `~/.second-brain-os.env`) also probe the dev CLIs (`bloks`/`tldr`/`fastedit`); on the default tier, skip this entirely.

---

### Step 3: Identity basics (AskUserQuestion-driven)

One sentence on why: these get substituted into every persona file and the Configuration block every skill reads. Prefill defaults so it's mostly confirming.

**Detect defaults** in parallel: `git config user.email`, `git config user.name`, `date +%Z`, `gh api user --jq .login` (skip silently if `gh` absent).

**Ask in 2-3 batched `AskUserQuestion` calls:**
- `user.full_name` / `user.name` (short) / `user.email`
- `user.timezone` / `user.github` / `user.company`
- `user.email_signature` / `workspace.root` (default `workspace`)

Light validation: no spaces in github username; email contains `@`.

**Echo back the 8 fields, single gate:** (a) **Confirm** / (b) **Edit one** / (c) **Start over**.

---

### Step 4: Name and shape your assistant

The affective heart. One AskUserQuestion, **four fields** — name, role, vibe, emoji. No default name.

**Narrate (keep the spirit — this is the moment the OS becomes theirs):**

> Now the fun part — your assistant. This is who you'll talk to every morning: drafting your emails, taking your notes, surfacing the projects you've been ignoring. It needs a name and a tone that feel like *yours*.
>
> A few names to spark ideas (pick anything you want): **Atlas** (strategic, holds the map) · **Echo** (reflective, mirrors your thinking) · **Sage** (deliberate, asks the right questions) · **Juno** (warm, attentive) · or Nova, Iris, Ren, Kai, Astra…

Most people arrive fresh, so go straight to naming. (Quiet footnote for the few who already customized their persona files by hand — option (b) keeps those untouched.)

| Question | Options |
|----------|---------|
| "Ready to name your assistant?" | (a) **Yes, let's do it** (default) / (b) **I already customized my persona files — keep them as-is** (the apply step reads existing values and skips persona regen) |

If (b): read `assistant.name`/`role`/`vibe`/`emoji` from current `IDENTITY.md`/`SOUL.md`; skip the collection batch.

**Collection batch — one AskUserQuestion call, four fields:**
- `assistant.name` — *"What do you want to call your assistant?"* (free text)
- `assistant.role` — *"Short role?"* (e.g., "Chief of Staff", "Research Companion", "Writing Partner")
- `assistant.vibe` — *"One line — how should it feel to talk to them?"*
- `assistant.emoji` — *"One emoji that represents them?"* (🎯 📚 ⚙️ 🧠 🪐 🌿 🦉 🗺️ 🔭)

**Echo back (the affective moment — keep it):**

```
Meet your assistant:

  Name:  <assistant.name>  <assistant.emoji>
  Role:  <assistant.role>
  Vibe:  <assistant.vibe>

This is who you'll be talking to.
```

Gate: (a) **Perfect** / (b) **Edit one** / (c) **Redo**.

---

### Step 5: Apply — persona files + workspace + design (T1)

Three quick sub-blocks; one short intro each.

**5a — Persona files (T1 git-diff guard).** Regenerate `SOUL.md`, `IDENTITY.md`, `USER.md`, `README.md` from the templates at `<workspace.root>/<workspace.resources>/templates/persona/`, substituting `<user.*>`, `<assistant.*>`, `<workspace.root>` (one `sed` pass). For each file:

```bash
git diff --quiet HEAD -- <file> && STATE=CLEAN || STATE=MODIFIED
```
- **CLEAN** → substitute + write. *"✅ Wrote `<file>`."*
- **MODIFIED** (T1) → `AskUserQuestion`: (a) **Skip — keep my edits** (default) / (b) **Show diff** / (c) **Overwrite** / (d) **Save regenerated copy to `<file>.bootstrap-suggested`**.

**Before substituting, verify the template exists** (`test -f <workspace.root>/<workspace.resources>/templates/persona/<file>-template.md`). If it's missing, do NOT run the substitution — a `sed ... > <file>` redirection truncates the existing file to empty before sed can fail. Skip that file, surface *"⚠️ Template for `<file>` missing — skipped, existing file untouched"*, and continue with the rest.

Skip ALL of 5a if Step 4 escape-hatch (b) was chosen.

**5b — Workspace skeleton (idempotent, T4-safe — `mkdir -p` only, never destructive).**

```bash
if [[ -d workspace && ! -d "${WORKSPACE_ROOT}" ]]; then mv workspace "${WORKSPACE_ROOT}"; fi
mkdir -p "${WORKSPACE_ROOT}"/{0-Inbox,1-Projects,2-Areas,3-Coding,4-Resources/{templates,research,reference,meetings,contacts,design-systems,onboarding},5-Archive}
```
Surface which subdirs were newly created.

**5c — Design system.** `AskUserQuestion` category-first (AI & LLM / Developer Tools / Productivity & SaaS / More + meta-options `(default)`, `(keep current)`). After pick: `cp <brand>/DESIGN.md DESIGN.md` (back up existing to `.DESIGN.md.previous`).

> **TOOLS.md is optional, not part of core setup.** A fork user doesn't need a tool inventory to start. Offer it as a one-line aside — *"Want a `TOOLS.md` snapshot of what's connected? (optional)"* — and only generate it (from the Step 2 check, honestly, never fabricated; T1 git-diff guard) if they say yes. Default: skip and move on.

---

### Step 6: Lock in + verify, then go-further (T3 — never auto-commit)

**6a — Configuration write.** One sentence: the Configuration block in `CLAUDE.md` is the single source of truth every skill reads. Write the **12 tokens** (`user.*` × 7, `assistant.*` × 4 [name/role/vibe/emoji], `workspace.root`) and append `setup_completed: <YYYY-MM-DD>` to the `### lifecycle` block (the T2 gate).

```
### user
- `user.name` = `<value>`
- `user.full_name` = `<value>`
- `user.email` = `<value>`
- `user.timezone` = `<value>`
- `user.github` = `<value>`
- `user.email_signature` = `<value>`
- `user.company` = `<value>`

### assistant
- `assistant.name` = `<value>`
- `assistant.role` = `<value>`
- `assistant.vibe` = `<value>`
- `assistant.emoji` = `<value>`

### workspace
- `workspace.root` = `<value>`

### lifecycle
- `setup_completed` = `<YYYY-MM-DD>`
```

Show diff, gate: (a) **Write** / (b) **Show diff again** / (c) **Skip — abort**. Append a daily-log entry to `memory/<YYYY-MM-DD>.md`.

**6b — Smoke test via `/new-project`.** Invoke `/new-project` (type `design`, name `bootstrap-smoke-test-<HHMMSS>`). Verify: folder exists under `<workspace.root>/<workspace.projects>/`; its `CLAUDE.md` contains the resolved `<user.name>` (not a literal `<user.name>`); `memory.md` has today's date.
- **PASS** → delete the throwaway, **guarded** (never an unguarded `rm -rf`): `P="<smoke-test-path>"; [[ -n "$P" && "$P" == *"/1-Projects/bootstrap-smoke-test-"* && -d "$P" ]] && rm -rf "$P"`. If it doesn't match, leave it and tell the user to remove it manually. *"✅ Setup verified — placeholders resolve end-to-end."*
- **FAIL** → leave the artifact. *"⚠️ Smoke test FAILED — inspect `<path>`; Configuration may need a look."*

**6c — Closing + the two optional extras.** Short "core setup done" + files-changed list + the manual-commit command as TEXT ONLY (T3 — never `git add`/`git commit`):

```
Done — your second brain is configured.

Your assistant: <assistant.name> <assistant.emoji> (<assistant.role>)
Active design:  <brand>   (swap anytime with /use-design <brand>)

Files written: SOUL.md, IDENTITY.md, USER.md, README.md, CLAUDE.md (Configuration),
DESIGN.md, memory/<YYYY-MM-DD>.md, <workspace.root>/ (PARA folders).

I did NOT commit anything. When you're ready:
  git add -A && git commit -m "fork bootstrap: configure as <user.name> / <assistant.name>"
```

Then offer the two OPTIONAL go-further steps — framed plainly, both skippable, both re-invokable anytime:

| Question | Options (multi-select) |
|----------|---------|
| "Two optional extras — want either now? (both can be done later)" | (a) **Teach me your writing voice** — so I draft like you / (b) **Bring in your existing work** — pull projects from your past Cowork sessions into your workspace / (c) **Not now** |

- If (a) → run **Optional Step A** below.
- If (b) → invoke the **`/migrate-work`** skill (`Skill` tool). It's standalone and re-invokable; it does its own consent + approval gating.
- If (c) → close with: *"You're all set. Try **'morning, what's on my plate?'** or **'let's start a new project for X.'** Ask **`/os-guide`** anytime to learn how this OS works, and run **`/migrate-work`** whenever you want to bring in existing work."*

---

### Optional Step A: Learn your writing voice (consent-gated, with fallback)

So the assistant can draft in your voice (emails, notes, updates). Re-invokable later; never part of the critical path.

**Detect available sources** — parse `.mcp.json` + the live tool list for connected message channels:
- Google Workspace / Gmail → `mcp__*workspace*` / `mcp__*gmail*` tools present
- Slack → `mcp__*slack*` tools present

**Consent gate BEFORE reading anything** (this is sensitive — required, never silent):

> "To learn your voice I can read **only messages you sent** — never anyone else's — from [Gmail / Slack, whichever is connected]. Or skip it and paste a sample instead."
> Options: (a) **Read my sent Gmail** (if connected) / (b) **Read my sent Slack** (if connected) / (c) **I'll paste a sample** / (d) **Skip for now**

- **Gmail** (if chosen): search the user's **sent** mail for ~10-20 recent messages (`from:me` / sent folder via the connected Workspace MCP).
- **Slack** (if chosen): resolve the user's own handle first (a user-lookup/auth call — NOT `from:me`), then search `from:<handle>` over ~last 30 days, ~10-20 messages.
- **Paste / file / describe** (fallback, always available): 1-3 paragraphs inline, a file path (read ≤200 lines), or three short descriptive questions (tone, structure, hard NEVERs).
- **Skip**: write a TODO starter to `memory/writing-style.md` and stop.

After fetching, **show what was read** (count + date range) for transparency. **Synthesize the voice profile from the fetched/pasted text ONLY — never fabricate phrases.** Sections (skip any the input doesn't cover): Voice character · Structure preferences · Word-choice quirks · Emoji rules · Hard NEVERs · Signature · Source.

**PREVIEW the profile before writing** (the affective gate — never skip): (a) **Save it** → `memory/writing-style.md` / (b) **Add another sample** / (c) **Edit a section** / (d) **Save, I'll hand-edit later**. Then: *"Saved. <assistant.name> reads this whenever drafting in your voice — edit any time."*

---

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Skill runs on an already-configured fork | T2 detection failed | Step 1 MUST grep for `setup_completed:` and refuse if found |
| Persona files overwritten despite user edits | T1 mechanism not concrete | 5a uses `git diff --quiet HEAD -- <file>`; default to skip on MODIFIED |
| Skill auto-committed | T3 violation | NEVER `git add`/`git commit` — 6c surfaces the command as text only |
| Skill installed a tool/connector | T4 violation | Step 2 + Optional A DETECT and hint only; authorize via `/mcp`, never install |
| Smoke test passed but new project still has a literal `<user.name>` | 6b ran before 6a | Order is FIXED: 6a (Configuration write) → 6b (smoke test) |
| Workspace skeleton clobbered existing content | 5b was destructive | `mkdir -p` only — never `rm -rf` |
| Persona file wiped to empty | 5a substitution ran with a missing template (`> <file>` truncates before sed fails) | 5a checks `test -f <template>` BEFORE substituting; missing template = skip + ⚠️, never write |
| Voice profile invented phrases the user never wrote | Optional-A synthesis hallucinated | Synthesize from fetched/pasted text only; the preview-before-write gate is the catch |
| Read someone else's messages, or read without asking | consent gate skipped | Optional A reads ONLY the user's own sent messages, ONLY after explicit consent |

## Boundaries

- **NEVER auto-commit** (T3).
- **NEVER install tools or connectors** (T4) — detect + hint, authorize via `/mcp`.
- **NEVER overwrite user-edited persona files without explicit confirmation** (T1) — default = skip.
- **NEVER re-run on an already-configured fork** without `setup_completed:` being deleted first (T2).
- **NEVER alter `3-Coding/` repos.** Independent gits.
- **NEVER write to `memory/`** other than today's daily log + `writing-style.md`. Append-only.
- **NEVER call Exa / WebSearch / WebFetch.** Bootstrap is local.
- **NEVER read anyone's messages without explicit per-run consent, and only the user's OWN sent messages** (Optional A).
- **NEVER fabricate** — tool status traces to a real Step 2 probe ("unverified" when unsure); voice content comes only from real fetched/pasted text.
- **NEVER default the assistant to a name from the original repo.** Step 4 always collects a fresh name (or honors hand-edited persona files).
- **NEVER skip a step's brief intro.** Each step opens with a short, user-visible why-it-matters sentence — not a verbatim script, not internal thinking.

## Re-run mechanism

Re-run gate = the `setup_completed: <date>` line in CLAUDE.md's `### lifecycle` section. Present = configured (refuse and point to direct, scoped Configuration/persona edits). Absent = fresh fork (proceed).

To re-run core setup: delete the `setup_completed` line, invoke `/bootstrap`. Steps 2 and 5b are idempotent; 5a protects user-edited files via T1; 6a overwrites Configuration with fresh values; 6b re-runs the smoke test.

The two optional extras are **independently re-invokable any time** (they don't depend on fresh-fork state): the writing-voice step protects an existing `memory/writing-style.md` with a keep/regenerate gate, and `/migrate-work` is its own skill. For lighter partial edits (just a name, brand, or persona file), edit only the canonical root Configuration/persona source after confirming the exact change.
