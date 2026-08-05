#!/usr/bin/env bash
# Create an isolated git worktree for parallel agent development.
# Usage: ./scripts/worktree-create.sh TASK-001 p1 [description]
# Example: ./scripts/worktree-create.sh TASK-001 p1 nextjs-scaffold

set -euo pipefail

TASK_ID="${1:?Task ID required (e.g. TASK-001)}"
AGENT="${2:?Agent required (p1 or p2)}"
DESC="${3:-task}"
BRANCH="feature/${TASK_ID}-${DESC}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE_PATH="${REPO_ROOT}/../buildlearn-wt-${TASK_ID}-${AGENT}"

if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "Branch ${BRANCH} already exists."
else
  git -C "$REPO_ROOT" branch "${BRANCH}" main
fi

if [ -d "$WORKTREE_PATH" ]; then
  echo "Worktree already exists: ${WORKTREE_PATH}"
else
  git -C "$REPO_ROOT" worktree add "$WORKTREE_PATH" "$BRANCH"
  echo "Created worktree: ${WORKTREE_PATH}"
fi

echo ""
echo "Next steps:"
echo "  cd ${WORKTREE_PATH}"
echo "  # Open this directory in a new Cursor agent session"
echo "  # Implement task ${TASK_ID} as Programmer ${AGENT}"
