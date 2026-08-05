#!/usr/bin/env bash
# Remove a git worktree after task merge.
# Usage: ./scripts/worktree-remove.sh TASK-001 p1

set -euo pipefail

TASK_ID="${1:?Task ID required}"
AGENT="${2:?Agent required (p1 or p2)}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE_PATH="${REPO_ROOT}/../buildlearn-wt-${TASK_ID}-${AGENT}"

if [ -d "$WORKTREE_PATH" ]; then
  git -C "$REPO_ROOT" worktree remove "$WORKTREE_PATH" --force
  echo "Removed worktree: ${WORKTREE_PATH}"
else
  echo "Worktree not found: ${WORKTREE_PATH}"
fi
