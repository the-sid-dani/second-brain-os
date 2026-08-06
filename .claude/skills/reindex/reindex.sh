#!/usr/bin/env bash
# reindex.sh — regenerate machine-generated OKF index.md across a workspace subtree.
#
# Part of OKF Pass 7 (decision #15 amendment, 2026-06-28). The index is a derived
# view of each file's frontmatter — never hand-edited. This rebuilds it in bulk;
# the okf-index-regen.mjs PostToolUse hook keeps it fresh on live edits.
#
# Usage:
#   reindex.sh <dir>               recursively reindex <dir> (the dir itself is a bundle root)
#   reindex.sh <dir> --each-child  reindex each immediate subdir of <dir> as its own bundle root
#                                  (use for 1-Projects/ and 2-Areas/ — never index those roots themselves)
set -euo pipefail

GEN="$(cd "$(dirname "$0")/../../hooks/lib" && pwd)/okf-index.mjs"
DIR="${1:?usage: reindex.sh <dir> [--each-child]}"
MODE="${2:-}"

if [[ ! -d "$DIR" ]]; then
  echo "reindex: not a directory: $DIR" >&2
  exit 1
fi

if [[ "$MODE" == "--each-child" ]]; then
  shopt -s nullglob
  for child in "$DIR"/*/; do
    [ -d "$child" ] || continue
    node "$GEN" "${child%/}" --recursive
  done
else
  node "$GEN" "$DIR" --recursive
fi
