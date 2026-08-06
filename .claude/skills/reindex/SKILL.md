---
name: reindex
context: fork
description: Rebuild machine-generated OKF `index.md` files or audit the grandfathered code-repository index. Use for "/reindex", "rebuild the indexes", "regenerate index.md", "the project index is stale", "sync indexes", "check for orphan repos", or "audit code repos". Default mode deterministically rebuilds Projects, Areas, and Resources indexes. Code-index audit mode compares `<workspace.coding>` with `<indexes.code_projects>` and changes that markdown table only after explicit approval.
allowed-tools: Bash Read Edit AskUserQuestion
---

# reindex

Regenerates the OKF `index.md` files across the workspace. Each `index.md` is a **machine-generated, never-hand-edited** view of the markdown files in its directory — file name, OKF `type`, and one-line `description` pulled from frontmatter, plus a subdirectory listing. It answers "what already exists here and where do new files go" cheaply, which is the fix for the file-recreation problem (OKF Pass 7, 2026-06-28).

**Why this doesn't violate decision #15 ("no static INDEX file"):** #15 banned *hand-maintained* index files because they drift. A machine-generated index is a derived cache of the frontmatter that #15 already calls the source of truth — it cannot drift, it just gets regenerated. #15 was amended 2026-06-28 to permit machine-generated indexes only. Every `index.md` carries an `AUTO-GENERATED` header; the generator refuses to clobber any `index.md` that lacks it (so a human-authored one is surfaced, never overwritten).

## When to use

- After moving / renaming files in bulk (the live hook only fires on single edits).
- During the project retrofit (Pass 7.5) — generating indexes for projects that never had them.
- When an `index.md` looks stale or you want a full rebuild.
- `/reindex` with no args = full rebuild of each child bundle under `1-Projects/`, `2-Areas/`, and `4-Resources/`.
- `/reindex code-audit` or "sync indexes" = audit the grandfathered code index; do not generate OKF files.

The everyday case is handled automatically by `.claude/hooks/okf-index-regen.mjs` (PostToolUse) — you rarely need to run this by hand.

## Process

All paths resolve from the Configuration section in root CLAUDE.md (`workspace.root`, `workspace.projects`, `workspace.areas`). The runner script is at `.claude/skills/reindex/reindex.sh`; the generator it calls is `.claude/hooks/lib/okf-index.mjs`.

### Default — full rebuild (no args)

Reindex every project under `1-Projects/`, every HQ under `2-Areas/`, and every Resources subfolder under `4-Resources/` (the primary OKF surface) as its own bundle root. **Never** generate an `index.md` at the `1-Projects/` or `2-Areas/` root itself — those roots are managed by `inject-projects.mjs` (project discovery) and are too broad for a file-level index.

```bash
bash .claude/skills/reindex/reindex.sh "<workspace.root>/<workspace.projects>" --each-child
bash .claude/skills/reindex/reindex.sh "<workspace.root>/<workspace.areas>" --each-child
bash .claude/skills/reindex/reindex.sh "<workspace.root>/<workspace.resources>" --each-child
```

### Area indexes (thin-Areas model, 2026-07-10)

Each `<workspace.areas>/<name>/index.md` is generated differently from a project index: it's a **project listing for that Area**, built from project `CLAUDE.md` frontmatter (`parent_hq: <name>`) scanned across BOTH `1-Projects/` (active) AND `5-Archive/` (done). It lists active + archived projects with status and one-line description, so an Area's history stays discoverable after projects archive whole. Same rules as every other index: machine-generated, `AUTO-GENERATED` header, never hand-edited — `/archive-project` Step 8 and this skill regenerate it.

**Nested git repos are auto-skipped.** The generator skips any directory containing a `.git` (cloned forks in `4-Resources/github-forks/`, code repos in `3-Coding/`) — those are external repos, not OKF knowledge bundles. Don't special-case them; the skip is built into the generator.

### Targeted — one project or path

```bash
bash .claude/skills/reindex/reindex.sh "<workspace.root>/<workspace.projects>/<slug>"
```

This recursively reindexes that one bundle (root + base-3 subdirs).

### Code-index audit mode

This mode reconciles the grandfathered `<workspace.coding>` directory with `<indexes.code_projects>`. It does not make `<workspace.coding>` a destination for new work.

1. Read root Configuration. List direct, non-hidden directories under `<workspace.root>/<workspace.coding>` and parse the markdown table in `<indexes.code_projects>` by repo name (the last path segment also matches legacy nested paths).
2. Compute `ADD` candidates present on disk but missing from the table, `MISSING` rows whose folder is gone, and `MATCH` rows. For additions, best-effort read `git remote get-url origin` and the last commit date; leave unknown fields as `(needs review)`.
3. Display the diff. Make no changes when the user asked only to audit. Before mutation, get explicit approval for every selected addition or missing-row status change. Default a missing row to `status: MISSING`; deleting a historical row requires a separate confirmation.
4. Apply only approved edits to `<indexes.code_projects>`, then report added, flagged, removed, skipped, and total rows. Never auto-add a newly discovered repo simply because it exists.

If the directory or index is absent, report the resolved path and treat the index as empty only after confirming Configuration is populated.

### Report

The generator prints `written\t<path>` for each changed index, `refused\t<path>` for any hand-written index it left alone, and a `done: N written, M refused` summary. Relay that to the user — especially any `refused` lines, which mean a human-authored `index.md` exists where the generator expected to manage one (resolve by renaming the human file or converting it).

## Boundaries

- **Default mode only mutates generated `index.md` files.** Code-index audit mode may edit only `<indexes.code_projects>` after approval. Never touches concept docs, frontmatter, or folder structure.
- **Never overwrites a hand-written `index.md`** (one without the `AUTO-GENERATED` marker) — it's reported as `refused`.
- **Never indexes nested git repos** — any dir with a `.git` (code repos in `3-Coding/`, cloned forks in `4-Resources/github-forks/`) is skipped automatically. They're external repos, not OKF bundles.
- Deterministic + idempotent: re-running with no file changes writes nothing.

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `not a directory` | Wrong path / typo | Check the path resolves under the workspace |
| `refused` lines in output | A hand-written `index.md` exists | Rename it (e.g. `overview.md`) or delete it so the generator can manage `index.md` |
| Index lists `—` for type/description | Source file lacks OKF frontmatter | Add `type:` + `description:` to that file's frontmatter, then reindex |
| `node: command not found` | Node not on PATH in this shell | Generator requires Node (same as every other hook); ensure Node is installed |
