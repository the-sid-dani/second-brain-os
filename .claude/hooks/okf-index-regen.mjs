#!/usr/bin/env node
/**
 * PostToolUse hook — regenerate machine-generated OKF index.md after a markdown
 * edit inside an active project (`1-Projects/<slug>/...`).
 *
 * Regenerates the edited file's own directory and walks up to the project root,
 * so subdirectory file-counts shown in the parent index stay accurate. The index
 * is a derived view of frontmatter (decision #15 amended 2026-06-28 to permit
 * machine-generated indexes) — this hook is what keeps it fresh between /reindex runs.
 *
 * Deterministic, zero-cost (no LLM/network), fail-open. Never reacts to index.md
 * writes (the generator writes via fs, not the Write tool, so there's no loop —
 * but we skip index.md inputs defensively). Scoped to 1-Projects only; HQs and the
 * full bundle are handled by the /reindex skill.
 */
import { readFileSync } from "node:fs";
import { dirname, join, basename, sep } from "node:path";
import { resolveRepoRoot } from "./lib/resolve-project-root.mjs";
import { writeIndexForDir } from "./lib/okf-index.mjs";

function done() { console.log("{}"); }

function readToken(md, key) {
  const m = md.match(new RegExp("`" + key.replace(/\./g, "\\.") + "` = `([^`]+)`"));
  return m ? m[1].trim() : null;
}

function main() {
  let data;
  try { data = JSON.parse(readFileSync(0, "utf8")); } catch { return done(); }

  const editTools = new Set(["Edit", "Write", "MultiEdit", "Update"]);
  if (!editTools.has(data.tool_name)) return done();

  const fp = (data.tool_input || {}).file_path || "";
  if (!fp || !fp.toLowerCase().endsWith(".md")) return done();
  if (basename(fp).toLowerCase() === "index.md") return done();

  const fileDir = dirname(fp);
  const repoRoot = resolveRepoRoot(fileDir);

  // Resolve the projects tree from the repo's Configuration section (portable).
  let rootToken, projectsToken;
  try {
    const md = readFileSync(join(repoRoot, "CLAUDE.md"), "utf8");
    rootToken = readToken(md, "workspace.root");
    projectsToken = readToken(md, "workspace.projects");
  } catch { return done(); }
  if (!rootToken || !projectsToken) return done();

  const projectsBase = join(repoRoot, rootToken, projectsToken) + sep;
  if (!(fileDir + sep).startsWith(projectsBase)) return done(); // only index 1-Projects bundles

  const rel = fileDir.slice(projectsBase.length).split(sep).filter(Boolean);
  if (rel.length === 0) return done(); // edit was at 1-Projects root, not inside a project
  const projectRoot = join(projectsBase, rel[0]);

  // Regenerate from the edited file's dir up to (and including) the project root.
  let cur = fileDir;
  for (;;) {
    try { writeIndexForDir(cur, { rootForTitle: projectRoot }); } catch { /* fail-open per dir */ }
    if (cur === projectRoot) break;
    const parent = dirname(cur);
    if (parent === cur || parent.length < projectRoot.length) break;
    cur = parent;
  }
  return done();
}

main();
