# Routing Rules — where misplaced root items go

Used by `/inbox-process` root-audit mode when proposing destinations. Each row has a pattern, the destination, the reason, and an example.

## Daily memory files

**Pattern:** A file at root named `YYYY-MM-DD.md` (e.g., `2026-05-29.md`).

**Destination:** `memory/YYYY-MM-DD.md`

**Why:** The daily memory directory is `memory/`. A daily-named file at root is almost always a stray write that missed the directory prefix.

**Example:** `2026-05-29.md` (0 bytes, May 29) → `memory/2026-05-29.md`. If it's empty, also offer to delete instead of move.

## Predecessor / versioned files

**Pattern:** Files like `.X.previous`, `X-V2.md`, `X.old`, `X-draft.md` sitting next to a canonical `X.md` or `X`.

**Destination:** `_archive/` next to the canonical file, or `<workspace.root>/5-Archive/` if there's no logical local archive folder.

**Why:** Rule 2 in CLAUDE.md (documentation maintenance): "Supersede = move out same day." Predecessors next to canonicals confuse readers about which is current.

**Example:** `.DESIGN.md.previous` at root, next to `DESIGN.md`. If DESIGN.md is itself moving to `4-Resources/reference/`, the predecessor goes to `<workspace.root>/5-Archive/DESIGN.md.previous`.

## Code repositories (folders with their own `.git/`)

**Pattern:** A folder at root that contains its own `.git/` directory.

**Destination:** `<workspace.root>/<workspace.areas>/<owning-area>/apps/<slug>/`, or a standalone repository outside the committed workspace when no Area owns it.

**Why:** New runnable code never enters the outer repository. Area-owned apps live in the Area's ignored `apps/` subtree and own their git, dependencies, secrets, and deployments. `<workspace.coding>` is grandfathered for existing repositories only.

**Caveat:** Confirm with <user.name> before moving — moving a code repo can break IDE configs, hardcoded paths in scripts, or active checkouts. Ask: "Is anything actively pointing at the current path?"

## Project-like folders (working drafts, no `.git/`)

**Pattern:** A folder at root containing drafts, notes, working files, but no `.git/`. Often has a name that reads like a project (e.g., `continuum/`, `brand-concepts/`).

**Destination:** `<workspace.root>/1-Projects/<PROJ-YYYY-MM-slug>/`

**Why:** Active projects belong in `1-Projects/`. The C9 naming convention (PROJ-YYYY-MM- for non-code) means renaming during the move.

**Required questions for <user.name>:**
1. Confirm the slug — what's the short topic name?
2. What month did this start? (Determines the YYYY-MM- prefix.)
3. What's the `parent_hq:`? (None is a smell per CLAUDE.md.)
4. Should it scaffold the base 3 subdirs (`inputs/`, `working/`, `outputs/`) per C10?

**Example:** `continuum/` (no .git, has notes and drafts inside) → ask <user.name> → maybe `<workspace.root>/1-Projects/PROJ-2026-05-continuum/` with `parent_hq: 2-Areas/ai-task-force`.

## Standalone reference docs

**Pattern:** A `.md` file at root that's not in the OS-7 allowlist and not memory.md. Often docs like `DESIGN.md`, `EXAMPLE-CONFIG.md`, `INSTALL.md`, `AGENTS.md`.

**Destination:** `<workspace.root>/4-Resources/reference/`

**Why:** Reference material that future-<assistant.name> might consult but isn't load-bearing on session start. Resources is the PARA bucket for "things I might reference later, organized by topic."

**Caveat:** Some `.md` files at root are intentional — e.g., a project might want INSTALL.md at the visible root for fork users following README. Ask <user.name>: "Is this discoverable on purpose, or can it live in Resources?"

## Stub / near-empty files

**Pattern:** A file at root that's under ~5 lines or is mostly placeholder content. Examples: `index.md` (39 bytes), empty `.md` files.

**Destination:** Delete (with explicit confirmation) or `<workspace.root>/5-Archive/` if <user.name> wants to keep the trail.

**Why:** Stubs at root take up visual real estate without earning it. Either commit to filling them in or get rid of them.

## Test / scratch folders

**Pattern:** Folders named `test/`, `scratch/`, `tmp/`, `experiments/` at root.

**Destination:** `<workspace.root>/5-Archive/` if <user.name> wants the work preserved, or delete if it's truly throwaway. If it's an active experimental project, treat as a project folder (above) and route to `1-Projects/`.

**Why:** Scratch at root tends to grow forever. Either it matures into a project (and gets the proper PROJ- slug) or it gets archived. The middle state is the bad state.

## `tools/` folder at root

**Pattern:** A `tools/` folder at root.

**Destination:** Depends on contents. **Inspect before proposing.**

- If it contains Python helper scripts that match the `.claude/tools/` pattern (the bundled harness per CLAUDE.md), it might be a duplicate or an older version — ask <user.name>.
- If it contains runnable project-specific code, route it to an owning Area's `apps/<slug>/` subtree or a standalone repository outside the committed workspace. Tracked Projects may hold plans and outputs, not runnable source.
- If it's bundled framework code that genuinely belongs at root, leave it. (The CLAUDE.md mentions `.claude/tools/` for the Python harness — root `tools/` is not on the allowlist.)

## macOS junk

**Pattern:** `.DS_Store` files anywhere in the tree.

**Destination:** Delete. They're already gitignored per `.gitignore`.

**Why:** Pure noise. Use `find <workspace-repo-root> -name .DS_Store -delete` as a one-liner. Still ask before running it — destructive ops need confirmation per CLAUDE.md.

## When no rule matches

If a root item doesn't fit any pattern above, **don't guess**. Present it to <user.name> with:
- What it is (file size, folder size, contents preview)
- Last modified date
- Two or three possible destinations with the tradeoffs
- "I don't have a clean rule for this — where should it go?"

Inventing new top-level destinations or new naming patterns defeats the PARA + HQ system. Better to ask once and codify the decision than to silently sprawl.

## After the move — book-keeping

For every move that lands a file into `1-Projects/`, `4-Resources/`, or an HQ, the receiving location might want an entry in its own README or memory.md noting what arrived. The cleanup skill itself doesn't write those entries — but it should remind <user.name> to consider them, or offer to do it as a follow-up.
