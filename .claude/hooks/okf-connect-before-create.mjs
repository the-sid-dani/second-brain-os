#!/usr/bin/env node
/**
 * PreToolUse hook — connect-before-create guard.
 *
 * Fires when a Write would CREATE a brand-new project folder under
 * `1-Projects/<slug>/` (i.e. the slug dir doesn't exist yet). If the proposed slug
 * is a near-duplicate of an existing project (active, archived, or a code repo),
 * it returns `permissionDecision: "ask"` surfacing the matches — the same
 * show-and-confirm friction pattern as external-action-guard (decision 2026-05-17:
 * friction, not refusal). When the name is genuinely novel, it stays silent — so
 * this is a duplicate-catcher, NOT a blanket gate (no double-prompt on the
 * /new-project happy path, which already ran its own /find in Step 0).
 *
 * This is the deterministic backstop behind /new-project Step 0: even an ad-hoc
 * folder creation that bypasses the skill gets dedup-checked. The bitbucket-reviewer
 * twins (`2026-05-...` + `COD-2026-05-...`) are exactly what this catches.
 *
 * Fail-open: any error → exit 0 (write proceeds). A guard that errors on every
 * write is worse than one that occasionally misses.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, sep, isAbsolute, resolve } from "node:path";
import { resolveRepoRoot } from "./lib/resolve-project-root.mjs";

const STOPWORDS = new Set(["the", "a", "an", "of", "for", "and", "to", "v1", "v2", "v3"]);

function readToken(md, key) {
  const m = md.match(new RegExp("`" + key.replace(/\./g, "\\.") + "` = `([^`]+)`"));
  return m ? m[1].trim() : null;
}

// Strip date + PROJ/COD prefixes, tokenize on '-', drop stopwords/short tokens.
function tokens(slug) {
  return slug
    .toLowerCase()
    .replace(/^(proj|cod)-/, "")
    .replace(/^\d{4}-\d{2}(-\d{2})?-/, "")
    .split(/[-_]/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function listDirs(p) {
  try { return readdirSync(p).filter((n) => !n.startsWith(".") && statSync(join(p, n)).isDirectory()); }
  catch { return []; }
}

// Existing code-repo names from the code-projects index (gitignored repos aren't grep-visible).
function codeRepoNames(repoRoot, md) {
  const root = readToken(md, "workspace.root");
  const resources = readToken(md, "workspace.resources");
  if (!root || !resources) return [];
  try {
    const idx = readFileSync(join(repoRoot, root, resources, "code-projects.md"), "utf8");
    return idx
      .split("\n")
      .map((l) => l.match(/^\|\s*([A-Za-z0-9_-]+)\s*\|/))
      .filter(Boolean)
      .map((m) => m[1])
      .filter((n) => n.toLowerCase() !== "repo"); // drop header
  } catch { return []; }
}

// New app repos are colocated with their owning Area under apps/<name>/.
function areaAppNames(wsBase, areasToken) {
  const apps = [];
  for (const area of listDirs(join(wsBase, areasToken))) {
    for (const name of listDirs(join(wsBase, areasToken, area, "apps"))) {
      apps.push({ name, area });
    }
  }
  return apps;
}

function nearDuplicates(newSlug, candidates) {
  const nt = new Set(tokens(newSlug));
  if (nt.size === 0) return [];
  const hits = [];
  for (const c of candidates) {
    const ct = new Set(tokens(c.name));
    if (ct.size === 0) continue;
    let shared = 0;
    for (const t of nt) if (ct.has(t)) shared++;
    const ratio = shared / Math.min(nt.size, ct.size);
    // Flag exact normalized match, or ≥2 shared meaningful tokens covering ≥half the smaller name.
    if ((shared >= 2 && ratio >= 0.5) || (shared >= 1 && ratio === 1)) {
      hits.push({ ...c, shared, ratio });
    }
  }
  return hits.sort((a, b) => b.ratio - a.ratio || b.shared - a.shared).slice(0, 5);
}

// Per-folder-by-design basenames — never duplicate-checked.
const PER_FOLDER_NAMES = new Set(["index.md", "readme.md", "claude.md", "memory.md", "handoff.md", "eval-log.md"]);
const CODE_EXTS = new Set([".py", ".sh", ".mjs", ".js", ".ts", ".tsx", ".jsx", ".rb", ".go", ".zsh", ".bash"]);
const BASE3 = new Set(["inputs", "working", "outputs"]);

function ext(p) { const m = p.match(/(\.[a-z0-9]+)$/i); return m ? m[1].toLowerCase() : ""; }

// All tracked .md/.html files under the content buckets (fast: git ls-files).
function trackedContentFiles(repoRoot, rootToken) {
  try {
    return execFileSync(
      "git",
      ["-C", repoRoot, "ls-files", `${rootToken}/0-Inbox`, `${rootToken}/1-Projects`, `${rootToken}/2-Areas`, `${rootToken}/4-Resources`],
      { encoding: "utf8", timeout: 3000 }
    )
      .split("\n")
      .filter((p) => /\.(md|html)$/i.test(p) && !p.includes("/_archive"));
  } catch { return []; }
}

const main = async () => {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;

  let event;
  try { event = JSON.parse(raw); } catch { return; }
  if (event.tool_name !== "Write") return;

  const fpRaw = (event.tool_input || {}).file_path || (event.tool_input || {}).path || "";
  if (!fpRaw) return;
  // Write tools may pass workspace-relative paths; resolve against the event cwd.
  const fp = isAbsolute(fpRaw) ? fpRaw : resolve(event.cwd || process.cwd(), fpRaw);

  const repoRoot = resolveRepoRoot(fp);
  let md;
  try { md = readFileSync(join(repoRoot, "CLAUDE.md"), "utf8"); } catch { return; }
  const rootToken = readToken(md, "workspace.root");
  const projectsToken = readToken(md, "workspace.projects");
  const archiveToken = readToken(md, "workspace.archive");
  const areasToken = readToken(md, "workspace.areas") || "2-Areas";
  if (!rootToken || !projectsToken) return;

  const wsBase = join(repoRoot, rootToken) + sep;
  if (!fp.startsWith(wsBase)) return; // only guards workspace writes
  const rel = fp.slice(wsBase.length); // e.g. "1-Projects/slug/file.md"
  const parts = rel.split(sep).filter(Boolean);
  const base = parts[parts.length - 1] || "";
  const reasons = [];
  const isAreaAppPath = parts[0] === areasToken && parts[2] === "apps" && parts.length >= 4;

  // -------------------------------------------------------------------------
  // GUARD B — thin tracked Areas (locked 2026-07-10; app exception 2026-07-20):
  // Areas hold CLAUDE.md, memory.md, index.md plus optional ignored app repos.
  // -------------------------------------------------------------------------
  if (parts[0] === areasToken && parts.length >= 3 && !isAreaAppPath && !["CLAUDE.md", "memory.md", "index.md"].includes(base)) {
    reasons.push(
      `THIN-AREAS: "${rel}" would put content inside an Area. Areas hold exactly ` +
      `three tracked knowledge files plus optional ignored apps/<name>/ repos. Route this file to the ` +
      `owning project in 1-Projects/ (check the Area's index.md for the project list), ` +
      `or 4-Resources/ if it's project-less reference.`
    );
  }

  // -------------------------------------------------------------------------
  // GUARD C — code placement (locked 2026-06-12; placement revised 2026-07-20):
  // runnable code never lands in committed content buckets. New apps belong in
  // the owning Area's ignored apps/<name>/ repo; 3-Coding is grandfathered.
  // -------------------------------------------------------------------------
  if (CODE_EXTS.has(ext(base)) && !isAreaAppPath && ["0-Inbox", projectsToken, areasToken, "4-Resources", archiveToken].includes(parts[0])) {
    reasons.push(
      `CODE PLACEMENT: "${base}" is runnable code headed for a committed workspace path. ` +
      `Locked rule (2026-06-12 gitleaks incident; placement revised 2026-07-20): new apps live in ` +
      `${rootToken}/${areasToken}/<owning-area>/apps/<app-name>/ as ignored independent repos. ` +
      `${rootToken}/3-Coding/ is grandfathered for existing repos only. ` +
      `If this is genuinely inert (a code SAMPLE inside docs), approve to proceed.`
    );
  }

  // -------------------------------------------------------------------------
  // GUARD A (original) — near-duplicate NEW PROJECT slug under 1-Projects/.
  // -------------------------------------------------------------------------
  if (parts[0] === projectsToken && parts.length >= 2 && !existsSync(join(wsBase, projectsToken, parts[1]))) {
    const slug = parts[1];
    const candidates = [];
    for (const n of listDirs(join(wsBase, projectsToken))) candidates.push({ name: n, where: "active" });
    if (archiveToken) for (const n of listDirs(join(repoRoot, rootToken, archiveToken))) candidates.push({ name: n, where: "archive" });
    for (const n of codeRepoNames(repoRoot, md)) candidates.push({ name: n, where: "code repo" });
    for (const app of areaAppNames(wsBase, areasToken)) candidates.push({ name: app.name, where: `Area app (${app.area})` });
    const hits = nearDuplicates(slug, candidates);
    if (hits.length > 0) {
      reasons.push(
        `NEW PROJECT "${slug}" looks like a near-duplicate of existing work:\n` +
        hits.map((h) => `  · ${h.name}  (${h.where})`).join("\n") +
        `\nConnect before create: continue in / revive the existing one rather than forking a parallel lineage.`
      );
    }
  }

  // -------------------------------------------------------------------------
  // GUARD D — near-duplicate NEW FOLDER inside an existing project
  // (deliverable/ vs deliverables/, or recreating repealed base-3 dirs).
  // -------------------------------------------------------------------------
  if (parts[0] === projectsToken && parts.length >= 4) {
    const projDir = join(wsBase, projectsToken, parts[1]);
    const newSub = parts[2];
    if (existsSync(projDir) && !existsSync(join(projDir, newSub))) {
      if (BASE3.has(newSub.toLowerCase())) {
        reasons.push(
          `FOLDER "${newSub}/" recreates the REPEALED base-3 layout (inputs/working/outputs — C10, 2026-06-28). ` +
          `Projects organize by their OWN concepts (meetings/, data/, decisions/, analysis/...). Pick a concept name.`
        );
      } else {
        const sibs = listDirs(projDir);
        const norm = (s) => s.toLowerCase().replace(/s$/, "");
        const near = sibs.filter((s) => norm(s) === norm(newSub) || nearDuplicates(newSub, [{ name: s }]).length > 0);
        if (near.length > 0) {
          reasons.push(
            `FOLDER "${newSub}/" is a near-duplicate of existing sibling folder(s) in ${parts[1]}: ` +
            near.map((s) => `${s}/`).join(", ") + `. Use the existing folder unless this is genuinely distinct.`
          );
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // GUARD E — near-duplicate NEW FILE anywhere in the content buckets.
  // The core "connect before create" check: does a same-topic file already
  // exist somewhere else in the workspace?
  // -------------------------------------------------------------------------
  if (/\.(md|html)$/i.test(base) && !PER_FOLDER_NAMES.has(base.toLowerCase()) &&
      !existsSync(fp) && parts[0] !== "5-Archive" && !rel.includes("_archive")) {
    const nt = new Set(tokens(base.replace(/\.(md|html)$/i, "")));
    if (nt.size >= 2) {
      const hits = [];
      for (const cand of trackedContentFiles(repoRoot, rootToken)) {
        const cbase = cand.split("/").pop();
        if (PER_FOLDER_NAMES.has(cbase.toLowerCase())) continue;
        if (cand === join(rootToken, rel)) continue;
        const ct = new Set(tokens(cbase.replace(/\.(md|html)$/i, "")));
        if (ct.size === 0) continue;
        let shared = 0;
        for (const t of nt) if (ct.has(t)) shared++;
        const ratio = shared / Math.min(nt.size, ct.size);
        if (shared >= 2 && ratio >= 0.67) hits.push({ path: cand, shared, ratio });
      }
      hits.sort((a, b) => b.ratio - a.ratio || b.shared - a.shared);
      if (hits.length > 0) {
        reasons.push(
          `NEW FILE "${base}" overlaps existing file(s):\n` +
          hits.slice(0, 4).map((h) => `  · ${h.path}`).join("\n") +
          `\nConnect before create: extend the existing file (single source of truth) unless this is genuinely a different artifact.`
        );
      }
    }
  }

  if (reasons.length === 0) return; // clean create — no friction

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reasons.join("\n\n"),
    },
  }));
};

main().catch(() => {}).finally(() => process.exit(0));
