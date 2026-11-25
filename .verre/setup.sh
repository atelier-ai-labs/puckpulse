#!/usr/bin/env bash
# Verre's agent workflow runs this before the agent starts, with no AI involved (atelier-hq,
# docs/mission-control/AGENTS.md, "Project checks"). The same installs as backend-tests.yml and frontend-tests.yml.
set -euo pipefail
pip install -q -r backend/requirements-dev.txt
npm --prefix frontend ci --no-audit --no-fund
