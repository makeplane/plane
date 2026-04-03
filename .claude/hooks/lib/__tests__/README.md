# Statusline Test Suite

Comprehensive tests for `.claude/statusline.cjs` and supporting libraries.

## Files

- `statusline.test.cjs` - Unit/regression tests for helpers and parser logic (57 tests)
- `statusline-integration.test.cjs` - End-to-end rendering tests for `statusline.cjs` (30 tests)
- `statusline-scenarios.test.cjs` - Cross-platform and user workflow scenarios (17 tests)
- `statusline-suite.cjs` - Aggregate runner for all statusline suites
- `ck-config-utils.test.cjs` - Existing config utility coverage

## Running Tests

```bash
# From repository root
node .claude/hooks/lib/__tests__/statusline-suite.cjs
```

Run individual suites when debugging:

```bash
node .claude/hooks/lib/__tests__/statusline.test.cjs
node .claude/hooks/lib/__tests__/statusline-integration.test.cjs
node .claude/hooks/lib/__tests__/statusline-scenarios.test.cjs
```

## Current Coverage Scope

### Unit and Regression (`statusline.test.cjs`)
- color behavior and ANSI toggles (`NO_COLOR`, `FORCE_COLOR`)
- context thresholds and bar rendering
- transcript parsing and target extraction
- native task mapping (`TaskCreate`/`TaskUpdate`/`TaskGet`/`TaskList`)
- stdin timeout and fallback behavior
- usage cache parse and render behavior
- git info cache timeout race regressions

### End-to-End (`statusline-integration.test.cjs`)
- minimal/default payload rendering
- git workspace behavior
- context usage and cost display paths
- invalid/empty input fallback handling
- home path shortening and multi-line behavior
- environment behavior (`NO_COLOR`, billing mode)

### Scenario Suite (`statusline-scenarios.test.cjs`)
- Linux/macOS/Windows/UNC/WSL path rendering
- statusline modes (`none`, `minimal`, `compact`, default/full)
- delayed stdin and optional timeout (`CK_STATUSLINE_STDIN_TIMEOUT_MS`)
- usage cache available/unavailable behavior
- native task transcript flows and legacy TodoWrite coexistence
- terminal width wrapping (wide + narrow unicode paths)

## Latest Verified Result

- total tests: 104
- passed: 104
- failed: 0
- suites run: 3

## Maintenance

When changing statusline logic:

1. Update/add tests in the relevant suite.
2. Run the aggregate suite:
   ```bash
   node .claude/hooks/lib/__tests__/statusline-suite.cjs
   ```
3. Keep this README counts and scope notes in sync with test changes.

## Related Files

- `/.claude/statusline.cjs`
- `/.claude/hooks/lib/colors.cjs`
- `/.claude/hooks/lib/transcript-parser.cjs`
- `/.claude/hooks/lib/config-counter.cjs`
- `/.claude/hooks/lib/git-info-cache.cjs`

**Last Updated:** 2026-02-26
**Status:** passing
