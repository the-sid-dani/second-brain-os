// okf-index.mjs — machine-generated OKF index.md builder.
//
// Implements the keystone of the OKF adoption (Pass 7 / decision #15 amendment,
// 2026-06-28): index.md is permitted IFF auto-generated from frontmatter, never
// hand-edited. An auto-generated index is a derived cache of the frontmatter that
// #15 already calls the source of truth — so it cannot drift.
//
// Pure: no external deps, no network, no LLM. Deterministic + idempotent — same
// directory contents always produce byte-identical output (no wall-clock stamp),
// so re-running never churns git.
//
// Used by: the /reindex skill (full-bundle rebuild) and okf-index-regen.mjs
// (PostToolUse hook, per-dir regen on write). Runnable standalone as a CLI.

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, basename, dirname, relative } from "node:path";

const GEN_MARKER = "<!-- AUTO-GENERATED OKF index — do not edit by hand.";
const GEN_HEADER =
  `${GEN_MARKER} Edit each file's frontmatter instead; this is regenerated on ` +
  `write by the okf-index hook and by the /reindex skill. Source of truth = the files themselves. -->`;

// Directories never descended into or listed.
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".venv", "venv", "__pycache__",
  "dist", "build", ".next", ".tldr", ".workflow",
]);

// Base-3 canonical ordering (C10). Listed first, in this order, then others alpha.
const BASE3_ORDER = ["inputs", "working", "outputs"];

// Known OS files get a stable type label even without OKF frontmatter.
const KNOWN_TYPES = {
  "CLAUDE.md": "project-context",
  "memory.md": "decision-log",
  "README.md": "readme",
};

function isDir(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

// A directory containing .git is a nested/external repo (cloned fork, code repo).
// OKF indexes our knowledge content, NOT external repos — skip these entirely
// (mirrors the 3-Coding/ and github-forks/ exemption).
function isGitRepo(p) {
  return existsSync(join(p, ".git"));
}

function isHidden(name) {
  return name.startsWith(".") || name.startsWith("_");
}

// Minimal YAML frontmatter parser — only the scalar/list shapes our docs use.
// Returns {} when there's no frontmatter block.
export function parseFrontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(3, end);
  const out = {};
  for (const raw of block.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!m) continue;
    let [, key, val] = m;
    if (val === "") { out[key] = ""; continue; }
    // Strip surrounding quotes.
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Inline list: [a, b, c]
    if (val.startsWith("[") && val.endsWith("]")) {
      out[key] = val.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      out[key] = val;
    }
    out[key] = Array.isArray(out[key]) ? out[key] : String(out[key]).trim();
  }
  return out;
}

// Escape a value for use inside a markdown table cell.
function cell(s) {
  return String(s ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

function truncate(s, n = 120) {
  s = String(s ?? "").trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

// Derive a one-line description when frontmatter has none:
// first markdown heading, else first non-empty prose line.
function fallbackDescription(body) {
  const lines = body.split("\n");
  for (const l of lines) {
    const h = l.match(/^#{1,6}\s+(.*)$/);
    if (h) return truncate(h[1]);
  }
  for (const l of lines) {
    const t = l.trim();
    if (t && !t.startsWith("---") && !t.startsWith("<!--")) return truncate(t.replace(/^[*\->\s]+/, ""));
  }
  return "";
}

// Read a concept doc → { type, description }.
function describeFile(filePath) {
  let text = "";
  try { text = readFileSync(filePath, "utf8"); } catch { return { type: "", description: "" }; }
  const fm = parseFrontmatter(text);
  const name = basename(filePath);
  const bodyStart = text.startsWith("---") ? text.indexOf("\n---", 3) : -1;
  const body = bodyStart === -1 ? text : text.slice(bodyStart + 4);
  const type = fm.type || KNOWN_TYPES[name] || "";
  const description = fm.description ? truncate(fm.description) : fallbackDescription(body);
  return { type, description };
}

function listMarkdown(dirPath) {
  let entries = [];
  try { entries = readdirSync(dirPath); } catch { return []; }
  return entries
    .filter((n) => n.toLowerCase().endsWith(".md") && n.toLowerCase() !== "index.md")
    .sort((a, b) => a.localeCompare(b));
}

function listSubdirs(dirPath) {
  let entries = [];
  try { entries = readdirSync(dirPath); } catch { return []; }
  const dirs = entries.filter((n) => !isHidden(n) && !SKIP_DIRS.has(n) && isDir(join(dirPath, n)) && !isGitRepo(join(dirPath, n)));
  return dirs.sort((a, b) => {
    const ai = BASE3_ORDER.indexOf(a), bi = BASE3_ORDER.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.localeCompare(b);
    }
    return a.localeCompare(b);
  });
}

function countMd(dirPath) {
  return listMarkdown(dirPath).length;
}

function isAreaDir(dirPath) {
  return basename(dirname(dirPath)) === "2-Areas";
}

function projectDescription(text, fm) {
  if (fm.description) return truncate(fm.description);
  const end = text.startsWith("---") ? text.indexOf("\n---", 3) : -1;
  const body = end === -1 ? text : text.slice(end + 4);
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("<!--")) continue;
    return truncate(line.replace(/^\*\*(.*?)\*\*\s*/, "$1 ").replace(/[`*_]/g, ""));
  }
  return "";
}

function normalizeAreaName(value) {
  return String(value || "").trim().split("/").pop().replace(/^hq-/, "");
}

function projectsForArea(dirPath) {
  const areaName = basename(dirPath);
  const workspaceRoot = dirname(dirname(dirPath));
  const sources = [
    { root: join(workspaceRoot, "1-Projects"), archived: false },
    { root: join(workspaceRoot, "5-Archive"), archived: true },
  ];
  const projects = [];

  for (const source of sources) {
    let entries = [];
    try { entries = readdirSync(source.root); } catch { continue; }
    for (const name of entries.sort((a, b) => a.localeCompare(b))) {
      const projectDir = join(source.root, name);
      const claudePath = join(projectDir, "CLAUDE.md");
      if (!isDir(projectDir) || !existsSync(claudePath)) continue;
      let text = "";
      try { text = readFileSync(claudePath, "utf8"); } catch { continue; }
      const fm = parseFrontmatter(text);
      if (normalizeAreaName(fm.parent_hq) !== areaName) continue;
      projects.push({
        name,
        type: fm["project-type"] || fm.type || "",
        status: fm.status || (source.archived ? "done" : "active"),
        description: projectDescription(text, fm),
        archived: source.archived,
        link: relative(dirPath, projectDir),
      });
    }
  }
  return projects;
}

function buildAreaIndexContent(dirPath) {
  const areaName = basename(dirPath);
  const projects = projectsForArea(dirPath);
  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);
  const lines = [
    GEN_HEADER,
    "",
    `# ${areaName} - project index`,
    "",
    "This thin Area holds rules and working memory. Project content lives in the linked active and archived projects.",
    "",
  ];

  const addSection = (title, items) => {
    lines.push(`## ${title}`, "");
    if (items.length === 0) {
      lines.push("- none", "");
      return;
    }
    lines.push("| Project | Type | Status | Description |", "|---|---|---|---|");
    for (const project of items) {
      lines.push(`| [\`${cell(project.name)}\`](${project.link}) | ${cell(project.type) || "—"} | ${cell(project.status) || "—"} | ${cell(project.description) || "—"} |`);
    }
    lines.push("");
  };

  addSection("Active projects", active);
  addSection("Archived projects", archived);
  return lines.join("\n");
}

// Build the index.md content for a single directory.
// Returns null when the dir is empty of meaningful content (no .md, no subdirs)
// — empty base-3 dirs keep their .gitkeep rather than gaining a noise index.
export function buildIndexContent(dirPath, { rootForTitle } = {}) {
  if (isAreaDir(dirPath)) return buildAreaIndexContent(dirPath);
  const files = listMarkdown(dirPath);
  const subdirs = listSubdirs(dirPath);
  if (files.length === 0 && subdirs.length === 0) return null;

  const title = rootForTitle ? relative(rootForTitle, dirPath) || basename(dirPath) : basename(dirPath);
  const lines = [];
  lines.push(GEN_HEADER);
  lines.push("");
  lines.push(`# Index — ${title}`);
  lines.push("");
  lines.push(`_${files.length} file${files.length === 1 ? "" : "s"} · ${subdirs.length} subdirector${subdirs.length === 1 ? "y" : "ies"}_`);
  lines.push("");

  if (subdirs.length) {
    lines.push("## Subdirectories");
    lines.push("");
    for (const d of subdirs) {
      const n = countMd(join(dirPath, d));
      const link = existsSync(join(dirPath, d, "index.md")) ? `${d}/index.md` : `${d}/`;
      lines.push(`- [\`${d}/\`](${link}) — ${n} file${n === 1 ? "" : "s"}`);
    }
    lines.push("");
  }

  if (files.length) {
    lines.push("## Files");
    lines.push("");
    lines.push("| File | Type | Description |");
    lines.push("|------|------|-------------|");
    for (const f of files) {
      const { type, description } = describeFile(join(dirPath, f));
      lines.push(`| [\`${f}\`](${f}) | ${cell(type) || "—"} | ${cell(description) || "—"} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// Returns true only when a hand-written index.md exists (no generated marker) —
// we refuse to clobber a human file, surfacing it instead.
function isHandWritten(indexPath) {
  if (!existsSync(indexPath)) return false;
  try { return !readFileSync(indexPath, "utf8").startsWith(GEN_MARKER); } catch { return false; }
}

// Write index.md for one directory. { status: 'written'|'unchanged'|'skipped'|'refused', path }
export function writeIndexForDir(dirPath, opts = {}) {
  const indexPath = join(dirPath, "index.md");
  if (isGitRepo(dirPath)) return { status: "skipped-repo", path: indexPath };
  if (isHandWritten(indexPath)) return { status: "refused", path: indexPath };
  const content = buildIndexContent(dirPath, opts);
  if (content === null) return { status: "skipped", path: indexPath };
  const next = content.endsWith("\n") ? content : content + "\n";
  if (existsSync(indexPath)) {
    try { if (readFileSync(indexPath, "utf8") === next) return { status: "unchanged", path: indexPath }; } catch { /* fallthrough */ }
  }
  writeFileSync(indexPath, next);
  return { status: "written", path: indexPath };
}

// Recursively (re)build indexes for a directory tree (bottom-up so parent links
// to child index.md resolve). Returns a list of per-dir results.
export function reindexTree(rootPath, opts = {}) {
  const results = [];
  const walk = (dir) => {
    for (const d of listSubdirs(dir)) walk(join(dir, d));
    results.push({ dir, ...writeIndexForDir(dir, { rootForTitle: rootPath, ...opts }) });
  };
  if (isDir(rootPath)) walk(rootPath);
  return results;
}

// CLI: node okf-index.mjs <dir> [--recursive]
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const args = process.argv.slice(2);
  const recursive = args.includes("--recursive") || args.includes("-r");
  const target = args.find((a) => !a.startsWith("-"));
  if (!target) {
    process.stderr.write("usage: node okf-index.mjs <dir> [--recursive]\n");
    process.exit(2);
  }
  const out = recursive ? reindexTree(target) : [{ dir: target, ...writeIndexForDir(target, { rootForTitle: target }) }];
  for (const r of out) {
    if (r.status === "written" || r.status === "refused") process.stdout.write(`${r.status}\t${r.path}\n`);
  }
  const written = out.filter((r) => r.status === "written").length;
  const refused = out.filter((r) => r.status === "refused").length;
  process.stdout.write(`done: ${written} written, ${refused} refused (hand-written, left alone)\n`);
}
