---
name: test
description: Run tests and analyze results. Use when asked to "test", "run tests", "verify", or after implementation.
---

# Test

Run test suites and produce analysis reports.

## Instructions

1. **Identify what to test** — read recent changes or plan phase
2. **Run existing tests**
   - Frontend: `pnpm check:lint && pnpm check:types`
   - Backend: `cd apps/api && python run_tests.py`
3. **Write new tests** if the feature lacks coverage
   - Backend: `plane/tests/` (pytest + factories)
   - Follow patterns in `plane/tests/conftest.py`
4. **Analyze failures** — identify root cause, not just symptoms
5. **Save report** to `plans/reports/test-{date}-{slug}.md`

## Report Format

```markdown
# Test Report: {Feature}

## Summary

- Total: X tests | Passed: Y | Failed: Z
- Lint: ✅/❌ | Types: ✅/❌

## Failed Tests

### test_name

- Error: ...
- Root cause: ...
- Suggested fix: ...

## Coverage Gaps

- Untested scenarios: ...

## Recommendations

- Additional tests needed: ...
```

## Rules

- NEVER fake mocks or skip tests to pass
- NEVER change assertions to match wrong output
- Always fix root cause, not symptoms
- Report must include actionable fix suggestions
- Backend tests: use `session_client` fixture, `@pytest.mark.django_db`
- For backend tests, follow `.agent/rules/backend-testing.md` for runner commands and markers
