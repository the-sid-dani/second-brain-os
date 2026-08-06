// handoff-writer.mjs — single entry point for handoff file writes.
//
// Why this matters: structural enforcement of the `project_root:` invariant.
// Every handoff must carry its origin in YAML frontmatter so a fresh session
// can locate the project it belongs to. All writers go through this one code
// path — don't bypass, extend. The optional `extra` field lets callers
// (pre-compact.mjs) pass trigger/session metadata without emitting a second,
// competing frontmatter block; parsers only read the first YAML block.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  resolveRepoRoot,
  resolveStateRoot,
  resolveHandoffRoot,
} from "./resolve-project-root.mjs";

export function writeHandoff(opts) {
  const { kind, sessionName, body, ts, cwd, extra } = opts;

  const repoRoot = resolveRepoRoot(cwd);
  const stateRoot = resolveStateRoot(cwd);
  const handoffRoot = resolveHandoffRoot(cwd);

  // Single-project mode: repoRoot === stateRoot. relative() returns ''; use '.'.
  let projectRootRelative = relative(repoRoot, stateRoot);
  if (!projectRootRelative) projectRootRelative = ".";

  // Merge optional `extra` fields between date/type and project_root/repo_root.
  // Skip falsy values; serialize as YAML scalars (strings without special chars
  // work cleanly; complex values are caller's responsibility).
  const extraLines = [];
  if (extra && typeof extra === "object") {
    for (const [key, value] of Object.entries(extra)) {
      if (!value) continue;
      extraLines.push(`${key}: ${value}`);
    }
  }

  const frontmatter = [
    "---",
    `date: ${ts}`,
    `type: ${kind}`,
    ...extraLines,
    `project_root: ${projectRootRelative}`,
    `repo_root: ${repoRoot}`,
    "---",
    "",
  ].join("\n");

  const handoffDir = join(handoffRoot, "handoffs", sessionName);
  mkdirSync(handoffDir, { recursive: true });

  // Filename gets colon-stripped + ms-trimmed ISO (filesystem-safe).
  // Frontmatter `date:` keeps the canonical ISO with colons (parseable).
  const tsSafe = ts.replace(/:/g, "-").replace(/\.\d+Z$/, "");
  const filename =
    kind === "auto-handoff" ? `auto-handoff-${tsSafe}.md` : `${kind}-${tsSafe}.md`;
  const path = join(handoffDir, filename);

  writeFileSync(path, frontmatter + body);

  return { path, projectRoot: projectRootRelative, handoffRoot };
}
