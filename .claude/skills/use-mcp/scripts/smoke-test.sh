#!/usr/bin/env bash
# End-to-end smoke test for use-mcp scripts.
#
# Validates that the MCP client + CLI are wired correctly after the
# mcp-management → use-mcp migration (or any future move). Does NOT
# require a real MCP server; exercises every code path that doesn't
# need stdio child processes.
#
# Run from anywhere:
#   bash claude/skills/use-mcp/scripts/smoke-test.sh
#
# Exit codes:
#   0 = all phases passed
#   non-zero = phase number that failed (1..5)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TOOLS_JSON="$SKILL_DIR/assets/tools.json"
TOOLS_BACKUP="$(mktemp -t use-mcp-tools-backup.XXXXXX.json)"
FIXTURE_DIR="$(mktemp -d -t use-mcp-fixture.XXXXXX)"

cleanup() {
  # Restore tools.json from backup if smoke test mutated it
  if [ -f "$TOOLS_BACKUP" ]; then
    cp "$TOOLS_BACKUP" "$TOOLS_JSON" 2>/dev/null || true
    rm -f "$TOOLS_BACKUP"
  fi
  rm -rf "$FIXTURE_DIR"
}
trap cleanup EXIT

echo "  use-mcp smoke test"
echo "  =================="
echo "  script dir: $SCRIPT_DIR"
echo ""

# --- Phase 1: dependencies present ---
echo "  [1/5] npm dependencies installed?"
cd "$SCRIPT_DIR"
if [ ! -d node_modules ] || [ ! -x node_modules/.bin/tsc ] || [ ! -x node_modules/.bin/tsx ]; then
  echo "        installing..."
  npm install --silent --no-audit --no-fund
fi
[ -x node_modules/.bin/tsc ] || { echo "  FAIL: tsc missing"; exit 1; }
[ -x node_modules/.bin/tsx ] || { echo "  FAIL: tsx missing"; exit 1; }
echo "        OK"

# --- Phase 2: TypeScript type-check ---
echo "  [2/5] tsc --noEmit (type-check + import resolution)..."
./node_modules/.bin/tsc --noEmit
echo "        OK"

# --- Phase 3: cli.ts entry point + --help ---
echo "  [3/5] cli.ts --help (entry point runs, prints usage)..."
HELP_OUT=$(./node_modules/.bin/tsx cli.ts --help)
echo "$HELP_OUT" | grep -q 'list-tools' || { echo "  FAIL: usage missing 'list-tools'"; exit 3; }
echo "$HELP_OUT" | grep -q 'call-tool'  || { echo "  FAIL: usage missing 'call-tool'"; exit 3; }
echo "        OK"

# --- Phase 4: backup tools.json before mutation ---
echo "  [4/5] backing up assets/tools.json before round-trip test..."
if [ -f "$TOOLS_JSON" ]; then
  cp "$TOOLS_JSON" "$TOOLS_BACKUP"
  echo "        backup: $(wc -c < "$TOOLS_BACKUP") bytes"
else
  echo "        no existing tools.json (will be created clean)"
fi

# --- Phase 5: config-loader round-trip with fixture ---
echo "  [5/5] config-loader round-trip (fixture .mcp.json with 0 servers)..."
mkdir -p "$FIXTURE_DIR/.claude"
echo '{"mcpServers": {}}' > "$FIXTURE_DIR/.claude/.mcp.json"
ROUND_TRIP_OUT=$(cd "$FIXTURE_DIR" && "$SCRIPT_DIR/node_modules/.bin/tsx" "$SCRIPT_DIR/cli.ts" list-tools 2>&1)
echo "$ROUND_TRIP_OUT" | grep -q 'Config loaded' || { echo "  FAIL: config not loaded"; echo "$ROUND_TRIP_OUT"; exit 5; }
echo "$ROUND_TRIP_OUT" | grep -q 'Found 0 tools' || { echo "  FAIL: server enumeration broken"; echo "$ROUND_TRIP_OUT"; exit 5; }
echo "$ROUND_TRIP_OUT" | grep -q 'Tools saved to.*tools\.json' || { echo "  FAIL: write path missing"; exit 5; }
echo "        OK (config loader, server enumeration, write path all working)"

echo ""
echo "  [OK] All 5 phases passed. Migration is wired correctly."
