# /os-guide `--sync` — full specification

> Extracted from `os-guide/SKILL.md` to keep it under the 500-line ceiling. Load on demand when running `/os-guide --sync`; not needed for normal read-only lookups.

## --sync mode (self-update)

`/os-guide --sync` is the sole mutation mode. The skill's Routing Table is hardcoded in this body for safety (no hidden dynamic state), but new things get added to the OS constantly — new skills, new MCPs, new design brands, new locked decisions. `--sync` detects what's changed and proposes routing-table updates without ever auto-applying them.

### Trigger surfaces

- **Explicit command**: `/os-guide --sync` or `/os-guide refresh`
- **Natural language**: "sync the os guide", "refresh /os-guide", "I added new tools — update the guide", "I added a new skill, update /os-guide"
- **Future (deferred)**: PostToolUse hook on Edit/Write to canonical files (TOOLS.md, .mcp.json, CLAUDE.md) that suggests `--sync` without auto-running it

### Five-phase behavior

#### Phase 1 — Inventory snapshot (no mutations)

Glob the filesystem against every known convention, produce a current-state snapshot:

```bash
# All from <workspace.root>/<workspace.resources>/ — resolve via Configuration first
SKILLS=$(find .claude/skills -maxdepth 2 -name SKILL.md | wc -l)
BRANDS=$(find "$WORKSPACE_RESOURCES/design-systems" -maxdepth 2 -name DESIGN.md | wc -l)
CONTACTS=$(ls "$WORKSPACE_RESOURCES/contacts/"*.md 2>/dev/null | grep -v README | wc -l)
REFDOCS=$(ls "$WORKSPACE_RESOURCES/reference/"*.md 2>/dev/null | wc -l)
PROJECTS=$(find "$WORKSPACE_PROJECTS" -maxdepth 2 -name CLAUDE.md | wc -l)
# Optional — only if your fork maintains a design-log file
# DECISIONS=$(grep -c "^| [0-9]\+ |" "$DESIGN_LOG")
MCPS=$(jq -r '.mcpServers | keys[]' .mcp.json 2>/dev/null | wc -l)
```

Also capture lists, not just counts:
- Skill slug list (sorted)
- Design brand slug list (sorted)
- Reference doc filename list (sorted)
- MCP name list (from `.mcp.json`)
- TOOLS.md status flag hash (sha256 of the lines matching `^- [✅⏳⚠️❌]`)
- Configuration section line range (grep for `^## Configuration` and the next `^## ` header)

#### Phase 2 — Diff against last-sync state

Read `.claude/skills/os-guide/state/last-sync.json` (if exists). If first sync, every item is NEW; skip the diff and report everything as initial state. Otherwise compute per-category deltas: items added, items removed, status-changed.

#### Phase 3 — Drift detection on canonical sources

For each routing-table entry pointing at a specific path:
- Verify the file exists (`test -f`)
- If the entry has a hardcoded line range (e.g., "CLAUDE.md:17-58"), grep for the section header and verify the range still matches the actual section

For each known canonical-section anchor (e.g., `## Configuration`, `## Project Map`, `## Operating Principles`):
- Find current line range via `grep -n "^## " <file>`
- Compare to last-sync stored range; flag if moved

Flag in the report — don't auto-fix.

#### Phase 4 — Markdown report

Compose a report like:

```markdown
# /os-guide --sync report (YYYY-MM-DD)

## Inventory delta since last sync (YYYY-MM-DD)
- **Skills**: +N new (slug list), -M removed
- **Design brands**: +N new
- **Contacts**: count changed N→M (enumeration deferred to /contact)
- **Reference docs**: +N new (filename list)
- **Locked decisions**: +N new (titles of new rows)
- **TOOLS.md status changes**: <tool> ⏳→✅
- **MCPs in .mcp.json**: +N new, -M removed
- **Active projects**: count changed N→M

## Drift on canonical sources
- **Stale routing entries** (file moved/renamed): list
- **Section-range drift**: list (e.g., "CLAUDE.md ## Configuration moved 17-58 → 17-62")
- **Reopened locked decisions**: list

## Proposed routing-table updates
<inline diff block showing exact SKILL.md edits>

## Items requiring manual action (cannot auto-propose)
- **New top-level canonical files at repo root**: list (e.g., "found WORKFLOW.md — is this a canonical source?")
- **New directory patterns under Resources**: list (e.g., "found experiments/ — is this a new convention to add a glob for?")
- **Semantic drift detected**: list (always empty — `--sync` cannot detect this; surface explicitly)
```

#### Phase 5 — `<user.name>` review + apply (the mutation gate)

After the report is shown, prompt:

```javascript
AskUserQuestion({
  question: "Apply these updates to /os-guide's routing table?",
  options: [
    { label: "Apply all", description: "Edit SKILL.md per the diff; update last-sync.json" },
    { label: "Apply some", description: "Multi-select which updates to apply (next round of AskUserQuestion)" },
    { label: "Skip — defer for later", description: "Write report to state/sync-deferred-<date>.md; no SKILL.md edit" },
    { label: "Cancel", description: "Exit without writing anything" }
  ]
})
```

- **Apply all** / **Apply some**: Use `Edit` to update the Routing Table section only (never touch other sections of SKILL.md). Then `Write` updated state to `.claude/skills/os-guide/state/last-sync.json`. Surface final summary: *"Routing table updated; N entries added, M flagged stale for manual review."*
- **Skip**: `Write` report to `.claude/skills/os-guide/state/sync-deferred-YYYY-MM-DD.md`. Do NOT update `last-sync.json`. Surface: *"Deferred. Report saved to state/sync-deferred-<date>.md. Re-run `--sync` when ready."*
- **Cancel**: Exit immediately. Write nothing.

### State file schema

`.claude/skills/os-guide/state/last-sync.json`:

```json
{
  "last_sync": "YYYY-MM-DDTHH:MM:SS-07:00",
  "schema_version": "1",
  "skills": {
    "count": 51,
    "list": ["archive-project", "bootstrap", "..."]
  },
  "design_brands": {
    "count": 73,
    "list": ["airbnb", "anthropic", "..."]
  },
  "contacts": { "count": 21 },
  "reference_docs": {
    "count": 4,
    "list": ["MCP-Server-Reference-Guide.md", "README.md", "..."]
  },
  "active_projects": { "count": 9 },
  "locked_decisions": { "count": 25, "latest_id": 25 },
  "tools_status_hash": "sha256:...",
  "mcp_servers": ["gemini-vision", "exa", "slack", "atlassian", "figma"],
  "configuration_section_range": [17, 58],
  "operating_principles_section_range": [66, 82]
}
```

Schema versioned so future shape changes don't break drift detection. Bump `schema_version` when adding fields; old `last-sync.json` files are treated as first-sync (full reset).

### Tiger invariants for `--sync`

Mirror `/bootstrap`'s T1-T4 — they're the contract that makes mutation safe:

- **T1 — Never auto-apply**. Every routing-table edit MUST be gated behind `AskUserQuestion` approval. The skill MUST NOT batch-apply without explicit go-ahead per invocation.
- **T2 — Never delete routing entries automatically**. If a canonical file got renamed/moved, FLAG it in the report and surface as manual-action; do not silently remove the routing entry. The user removes or remaps.
- **T3 — Never commit, never push**. Surface `git add` / `git commit` commands as text in the closing message; never execute them. Same rule as `/bootstrap` T3 and `/contact-log` E1.
- **T4 — Never touch files outside `.claude/skills/os-guide/`**. The only files `--sync` may write to are: `SKILL.md` (Routing Table section only — body sections like voice, protocol, boundaries are NEVER edited) and `state/last-sync.json` + `state/sync-deferred-<date>.md`.

### Scope limits (honest about what `--sync` doesn't catch)

`--sync` covers ~80% of routine OS evolution. It does NOT catch:

1. **New top-level canonical files** at repo root that don't match any existing convention (e.g., if you add `WORKFLOW.md` at root, `--sync` surfaces "found unknown top-level .md files" for manual decision — doesn't add to routing automatically).
2. **New convention patterns entirely** (e.g., if `<workspace.resources>/experiments/<slug>/EXPERIMENT.md` becomes a new pattern, `--sync` finds the directory but doesn't know to add a glob — surfaces as "new directory pattern detected").
3. **Semantic drift** where the file path stayed the same but the content's meaning changed (e.g., README.md PARA section got rewritten with different folder counts). `--sync` cannot detect this; only structural drift.

These 3 cases are listed explicitly in the Phase 4 report under "Items requiring manual action" so the user is never surprised by what was silently missed.

### When to run `--sync`

- **After adding a new skill** via `/skill-creator`
- **After adding a new MCP** to `.mcp.json` and authorizing it via `/mcp`
- **After adding a new design-system brand** to `<workspace.resources>/design-systems/`
- **After locking a new decision** in your fork's design log (if you keep one)
- **After major doc edits** that may have moved section line ranges (CLAUDE.md restructure, README rewrite)
- **On schedule** — once a week as a maintenance ritual, similar to `/prune-projects` Friday batch (manual at first; cron only after value is proven, per the heartbeat lesson)

---

