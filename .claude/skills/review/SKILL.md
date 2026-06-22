---
name: review
description: >-
  Hybrid code review with structural grounding — anchors Claude's semantic judgment on deterministic tldr facts (impact radius, dead code, call-graph change-impact, diagnostics/lint+type), not LLM opinion alone. Use for 'review this code', 'review my changes', 'review my PR', 'check before I merge', 'what did I break', 'pre-push quality gate'. Phase 1 dispatches parallel agents running tldr diagnostics / impact / dead / change-impact; Phase 2 reasons over those facts plus the git diff. Modes via flags — uncommitted (default), staged, base-ref compare, quick, security-focus, or a PR number. Verdict: APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION. Prefer over /code-review when you want multi-agent structural grounding; use /code-review for a single-pass diff review.
user-invocable: true
allowed-tools: [AskUserQuestion, Agent, Bash]
---

Hybrid review anchoring LLM reasoning on deterministic structural analysis. Runs locally, no cloud, no cost per seat. You dispatch structural analysis to agents, keep main context for semantic reasoning over their findings.

Use for "review this code", "review my changes", "review my PR", "check before I merge", pre-push quality gates, "what did I break?"

**Tooling reality (tldr 1.5.2):** the only structural subcommands that exist are `diagnostics` (lint + type), `impact` (callers of a function), `dead` (unreachable code), `change-impact` (downstream + test blast radius), and `semantic` (code search). There is NO `bugbot`, `smells`, `hotspots`, `complexity`, `cognitive`, `secure`, `taint`, `vuln`, or `whatbreaks` subcommand — do not call them. Only `diagnostics` accepts `--format json`; `impact`/`dead`/`change-impact` emit text (capture it verbatim). Complexity and security are **Phase-2 reasoning**, not tools.

Architecture: Phase 1 runs `tldr diagnostics` + `tldr impact`/`dead`/`change-impact` via parallel agents for structural facts. Phase 2 applies Claude Code semantic reasoning over those facts + the git diff for a unified review.

Arguments: `/review` (full review uncommitted), `/review --staged` (staged only), `/review --base-ref main` (since main), `/review --quick` (diagnostics-only), `/review --security` (security reasoning focus), `/review <path>` (specific directory).

Parse arguments setting SCOPE (default `.`), BASE_REF (default `HEAD`), STAGED_FLAG (`--staged` if applicable), MODE (`full`/`quick`/`security`). Run `git diff --stat ${BASE_REF}` or `git diff --staged --stat` to understand changes. If no changes, stop. Extract the changed files and function names from the diff.

Launch 2 parallel agents for structural analysis:

Agent 1 (diagnostics): `subagent_type: "general-purpose"` with prompt "For each changed file [LIST FROM DIFF], run `tldr diagnostics <file> --format json` (this is the lint + type-check surface). Return ALL JSON output verbatim, do not summarize or filter."

Agent 2 (impact-analysis): `subagent_type: "general-purpose"` with prompt "For each changed function [LIST FROM DIFF], run `tldr impact <function_name> ${SCOPE}` to find callers. Run `tldr dead ${SCOPE}` to find newly-unreachable code. Run `tldr change-impact --git --git-base ${BASE_REF}` for the downstream + test blast radius. These emit text, not JSON — return ALL output verbatim, combined. Do not summarize."

Wait for both agents. Gather context by reading agent outputs plus running `git diff ${BASE_REF} --unified=5 ${SCOPE}` (or `git diff --staged --unified=5 ${SCOPE}`). If diff >500 lines, focus on files with the most diagnostics/impact findings.

Apply semantic reasoning over structural findings + actual code. You reason over computed facts, not guesses.

For diagnostics findings: read the actual code around each lint/type finding, assess whether it is a real issue or acceptable in context, suggest concrete code changes, and evaluate whether the reported severity matches the actual risk.

For impact + change-impact: identify touched high-centrality hub functions and map the downstream affected code. Check whether all callers of a changed signature were updated and which were missed. Use the `change-impact` test list to assess coverage of affected paths.

For dead code: flag functions/imports the `dead` pass shows became unreachable in this change — distinguish intentionally-staged code from forgotten code.

For complexity (reasoned, not tool-derived): tldr 1.5.2 has no complexity metric. From the diff, call out functions you can see growing hard to follow — present it as analyst judgment, not a number.

For security (when `--security` focus is on): tldr 1.5.2 has no taint/secure tool, so reason directly over the diff — unsanitized user input reaching sensitive sinks, resource leaks on error paths, and injection patterns (SQL injection, XSS, command injection). Present these as analyst findings, not structural facts, and elevate their severity in the output.

Output format:

## Review: [scope description]

**Verdict: APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION**

### Structural Facts (tldr)

| Category | Count | Detail |
|----------|-------|--------|
| Diagnostics (lint/type) | N | N error, N warning |
| Impact radius | N | functions affected downstream |
| Dead code introduced | N | unreachable functions / unused imports |
| Security concerns (reasoned) | N | (if `--security`) |

### Blocking Issues

[Issues MUST be fixed before merging:]
1. **[severity] [category]**: description
   - File: `path:line`
   - Structural fact: what diagnostics/impact/dead/change-impact found
   - Semantic analysis: why it matters
   - Suggested fix: concrete code change

### Warnings

[Worth fixing but not blocking:]
1. **[warning] [category]**: description
   - Structural fact + semantic context

### Observations

[Non-actionable notes: complexity trends, architecture observations, positive changes worth noting]

### Test Coverage

- Changed functions with tests: N/M
- Suggested test additions: [list]
- Run: `tldr change-impact --git --git-base ${BASE_REF} --run` to execute the affected tests

### Summary

[2-3 sentence human-readable summary]

Quick mode (`/review --quick`): skip Agent 2, run only `tldr diagnostics <file> --format json` on each changed file, and reason over the diff + diagnostics directly in main context — faster, less thorough.

Security-focus mode (`/review --security`): tldr 1.5.2 has no security subcommand, so this flag does NOT add a structural tool. It directs Phase-2 reasoning to scrutinize taint paths (unsanitized input → sensitive sink), resource leaks on error paths, and injection patterns over the diff, with elevated severity in the output.

PR mode (`/review PR #N`): run `gh pr diff N > /tmp/pr-diff.patch`, `gh pr view N --json files,additions,deletions`, `git fetch origin pull/N/head:pr-N`, `git diff main...pr-N`, then run the same pipeline with `--base-ref main`.

Constraints: never use Read, Edit, Write, Grep, or Glob yourself except git diff in context gathering — delegate structural analysis to agents. Phase 1 agents run deterministic tools producing facts, not opinions. Phase 2 is where you add value, reasoning over facts without hallucinating findings. Always present structural evidence alongside semantic judgment. Keep main context clean — agents gather facts, you synthesize.

## Gotchas

- **tldr subcommand drift.** This skill is pinned to the tldr 1.5.2 surface. If `tldr --help` ever changes, re-verify every subcommand and flag before trusting this skill — the API has drifted out from under it before (the pre-2026-06-18 version called 10 subcommands that did not exist, making the skill a silent no-op).
- **Only `diagnostics` takes `--format json`.** Adding `--format json` to `impact`/`dead`/`change-impact` errors with "unrecognized arguments". Capture their text output verbatim instead.
- **`change-impact` finds files itself.** Use `--git --git-base ${BASE_REF}` rather than passing a function name; it auto-detects changed files from git.

| Finding | Suggest |
|---------|---------|
| Blocking issues found | `/autonomous` to fix each issue |
| Unknown root cause for regression | `/autonomous` to investigate |
| Major architectural concern | `/research` to spike alternatives |
| All clear | `git commit` (or `/ship`) to commit changes |
| Multiple issues across codebase | `/autonomous` to plan and fix systematically |
