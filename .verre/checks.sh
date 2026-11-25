#!/usr/bin/env bash
# The same checks as CI's backend and frontend jobs. The agent runs it while it works; the workflow runs the
# base branch's copy afterwards and puts the result in the pull request. Runs every check, then fails if any did.
set -uo pipefail
failed=()
(cd backend && python -m pytest -q) || failed+=("backend tests")
npm --prefix frontend run lint || failed+=("frontend lint")
npm --prefix frontend test || failed+=("frontend tests")
if [ ${#failed[@]} -gt 0 ]; then echo "Failed: ${failed[*]}"; exit 1; fi
echo "All checks passed."
