# Statusline Test Suite

Comprehensive tests for `.claude/statusline.cjs` and supporting libraries.

## Files

- `usage-limits-cache.test.cjs` - Unit tests for the usage quota cache helper (5 tests)
- `statusline.test.cjs` - Unit/regression tests for helpers and parser logic (57 tests)
- `statusline-integration.test.cjs` - End-to-end rendering tests for `statusline.cjs` (30 tests)
- `statusline-scenarios.test.cjs` - Cross-platform and user workflow scenarios (19 tests)
- `statusline-suite.cjs` - Aggregate runner for all statusline suites
- `ck-config-utils.test.cjs` - Existing config utility coverage

## Running Tests

```bash
# From repository root
node .claude/hooks/lib/__tests__/statusline-suite.cjs
```

Run individual suites when debugging:

```bash
node .claude/hooks/lib/__tests__/usage-limits-cache.test.cjs
node .claude/hooks/lib/__tests__/statusline.test.cjs
node .claude/hooks/lib/__tests__/statusline-integration.test.cjs
node .claude/hooks/lib/__tests__/statusline-scenarios.test.cjs
```

## Current Coverage Scope

### Usage Cache Helper (`usage-limits-cache.test.cjs`)
- live OAuth whole-number percentage handling plus defensive `0..1` fallback
- additive `snapshot` generation for cosmetic `5h` / `wk` chips
- cache age helpers that keep refresh work off the render path
- success and failure writes for the shared quota cache file

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
- normalized snapshot rendering, legacy raw cache fallback, and unavailable cache behavior
- display remaining visible when `usage-context-awareness` is disabled
- native task transcript flows and legacy TodoWrite coexistence
- terminal width wrapping (wide + narrow unicode paths)

## Latest Verified Result

- total tests: 111
- passed: 111
- failed: 0
- suites run: 4

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
