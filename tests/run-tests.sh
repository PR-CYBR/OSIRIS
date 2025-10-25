#!/usr/bin/env bash

# OSIRIS Comprehensive Test Runner
#
# Executes the full validation workflow expected by the OSIRIS constitution.
# Includes linting, unit tests, integration verification, end-to-end smoke
# checks, performance baseline validation, and domain-specific status
# generation. The script is intentionally fail-fast.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RESULTS_DIR="${RESULTS_DIR:-test-results}"
mkdir -p "$RESULTS_DIR"

declare -A STEP_STATUS=()
STEP_ORDER=()

log() {
  printf '\n[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$1"
}

run_step() {
  local name="$1"
  shift
  STEP_ORDER+=("$name")
  log "▶️  ${name}"

  if "$@"; then
    STEP_STATUS["$name"]="success"
    log "✅ ${name}"
  else
    STEP_STATUS["$name"]="failure"
    log "❌ ${name}"
    return 1
  fi
}

generate_summary() {
  local exit_code="$1"
  local overall="failure"
  if [[ "$exit_code" -eq 0 ]]; then
    overall="success"
  fi

  local summary_file="$RESULTS_DIR/summary.md"
  {
    echo "## Test Results"
    echo "- **Branch**: ${BRANCH_NAME:-$(git rev-parse --abbrev-ref HEAD)}"
    echo "- **Status**: $overall"
    echo "- **Timestamp**: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    echo ""
    echo "### Step Summary"
    for step in "${STEP_ORDER[@]}"; do
      local status="${STEP_STATUS[$step]:-not-run}"
      local icon="⚪"
      if [[ "$status" == "success" ]]; then
        icon="✅"
      elif [[ "$status" == "failure" ]]; then
        icon="❌"
      fi
      echo "- ${icon} ${step}"
    done
  } > "$summary_file"

  printf '\n==========================================\n'
  printf 'Test Summary (%s)\n' "$overall"
  printf '==========================================\n\n'
  cat "$summary_file"

  return "$exit_code"
}

trap 'generate_summary $?' EXIT

# --- Validation Steps ---

run_step "Lint" npm run lint
run_step "Unit Tests" npm test -- --runInBand
run_step "Integration Verification" tests/integration/run-integration.sh
run_step "E2E Status Smoke" node tests/e2e/verify-status-dashboard.js
run_step "Performance Baseline" node tests/performance/verify-performance-baseline.js
run_step "Domain Status Generator" node scripts/generate-status.js > "$RESULTS_DIR/status.log"

log "All validation steps executed."

