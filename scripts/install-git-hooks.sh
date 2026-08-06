#!/usr/bin/env sh
# install-git-hooks.sh — wire up the repo's git hooks (pre-commit secret scan).
# Run once after cloning: bash scripts/install-git-hooks.sh
set -eu

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

git config core.hooksPath scripts/git-hooks
chmod +x scripts/git-hooks/pre-commit

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "NOTE: gitleaks is not installed — the pre-commit secret scan will warn instead of scan." >&2
  echo "Install it with: brew install gitleaks" >&2
fi

echo "Git hooks installed (pre-commit secret scan via gitleaks)."
