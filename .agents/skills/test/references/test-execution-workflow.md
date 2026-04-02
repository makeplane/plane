# Test Execution Workflow

## Step 1: Identify Scope

Determine what to test based on recent changes:
- New feature → full test suite + new test cases
- Bug fix → regression tests + targeted fix validation
- Refactor → existing test suite (no new tests unless gaps found)
- Coverage check → full suite with coverage flags

## Step 2: Pre-flight Checks

Run syntax/type checks before tests to catch compile errors early:

```bash
# JavaScript/TypeScript
npx tsc --noEmit          # TypeScript check
npx eslint .              # Lint check

# Python
python -m py_compile file.py
flake8 .

# Flutter
flutter analyze

# Go
go vet ./...

# Rust
cargo check
```

## Step 3: Execute Tests

### JavaScript/TypeScript
```bash
npm test                    # or yarn test / pnpm test / bun test
npm run test:coverage       # with coverage
npx vitest run              # Vitest
npx jest --coverage         # Jest with coverage
```

### Python
```bash
pytest                      # basic
pytest --cov=src --cov-report=term-missing  # with coverage
python -m unittest discover # unittest
```

### Go / Rust / Flutter
```bash
go test ./... -cover        # Go with coverage
cargo test                  # Rust
flutter test --coverage     # Flutter
```

## Step 4: Analyze Results

Focus on:
1. **Failing tests** — read error messages and stack traces carefully
2. **Flaky tests** — tests that pass/fail intermittently indicate race conditions or state leaks
3. **Slow tests** — identify bottlenecks (>5s per test is suspicious)
4. **Skipped tests** — ensure skips are intentional, not hiding failures

## Step 5: Coverage Analysis

Thresholds:
- **80%+** line coverage — standard minimum
- **70%+** branch coverage — acceptable for most projects
- Focus on critical paths: auth, payment, data mutations

Identify gaps:
- Uncovered error handlers
- Missing edge case branches
- Untested utility functions

## Step 6: Build Verification

```bash
npm run build               # JS/TS production build
python setup.py build       # Python
go build ./...              # Go
cargo build --release       # Rust
flutter build               # Flutter
```

Check for:
- Build warnings or deprecation notices
- Unresolved dependencies
- Production config correctness

## Quality Checklist

- [ ] All tests pass (zero failures)
- [ ] Coverage meets project threshold
- [ ] No flaky tests detected
- [ ] Build completes without errors
- [ ] Error scenarios tested
- [ ] Test isolation verified (no shared state)
- [ ] Test data cleaned up after execution
- [ ] Mocks/stubs properly configured
- [ ] Environment variables correctly set
