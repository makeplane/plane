# Plane.so Development Documentation Review

**Date:** 2026-03-12 | **Status:** Complete

## Sources Checked

1. **Official CONTRIBUTING.md** — `/Volumes/Data/SHBVN/plane.so/CONTRIBUTING.md`
2. **ESLint Documentation** — `/Volumes/Data/SHBVN/plane.so/docs/eslint.md`
3. **ESLint Config** — `eslint.config.mjs` (root, v9 flat config)
4. **Prettier Config** — `.prettierrc` (root level)
5. **Issue Templates** — `.github/ISSUE_TEMPLATE/` (bug-report.yaml, feature-request.yaml)
6. **PR Template** — `.github/pull_request_template.md`
7. **Test Runner** — `apps/api/run_tests.py`
8. **Root Package Scripts** — Root `package.json` (pnpm scripts)
9. **Web App Scripts** — `apps/web/package.json`

## Key Findings from Official Documentation

### Linting & Formatting Standards

- **Linter:** ESLint 9 with **typed linting** (type-aware checks)
- **Config:** Root-level `eslint.config.mjs` (single monorepo config, not per-package)
- **Formatter:** Prettier with `@prettier/plugin-oxc` integration
- **Prettier Config Details:**
  - Print width: 120 characters (not default 80)
  - Tab width: 2 spaces
  - Trailing comma: es5 standard
  - Special override for `packages/codemods/**/*` (80-char width)
- **Pre-commit:** Husky + lint-staged runs Prettier and ESLint (with `--max-warnings=0`)

### Testing Requirements

- **All features/bug fixes MUST include unit tests** (mandatory, non-optional)
- **Backend test runner:** `apps/api/run_tests.py` with pytest
  - Supports unit, contract, smoke test markers
  - Parallel execution with `--parallel` flag
  - Coverage reporting: `--cov=plane`
  - Reuses DB: `--reuse-db --nomigrations`
- **Frontend tests:** Via turbo tasks in each package

### Issue & PR Templates

- **Issue Title Format:** Emoji-prefixed conventions
  - `🐛 Bug: [description]`
  - `🚀 Feature: [description]`
  - `🛠️ Improvement: [description]`
  - `📘 Docs: [description]`
- **PR Template:** Requires Type of Change selection (bug fix, feature, improvement, refactor, perf, docs)
- **PR Template:** Requires Test Scenarios description (mandatory)

### Translation Contribution Standards

- **File structure:** `packages/i18n/src/locales/{language}/translations.json`
- **Format:** Nested JSON with IntlMessageFormat for dynamic content
- **Quality checklist:** All keys in all language files, matching structures, ICU formats correct

### Development Setup Requirements

- **Node.js:** 20+ (LTS)
- **Python:** 3.8+
- **PostgreSQL:** v14
- **Redis:** v6.2.7
- **Memory:** Minimum 12 GB RAM (8 GB may cause setup/build failures)
- **Docker:** Required

### Development Workflow (Official)

1. Clone repo
2. Run `setup.sh`
3. Start containers: `docker compose -f docker-compose-local.yml up`
4. Start web apps: `pnpm dev`
5. Access at `http://localhost:3000` (app) and `http://localhost:3001/god-mode/` (admin)

### TypeScript ESLint Rules Enabled

- TypeScript strict checks (no explicit any, floating promises, unsafe operations)
- React hooks rules (including React Compiler rules)
- React refresh exports
- Accessibility (a11y) checks
- Import style enforcement (prefer-top-level type imports)
- Promise handling (always return, catch-or-return)

## Gap Analysis: Rules NOT Covered in Our `.claude/rules/`

### 1. **Prettier Formatting Standards** [HIGH PRIORITY]

**Status:** Missing from our rules

Our rules mention formatting but don't specify:

- Print width: 120 characters (not default 80)
- Tab width: 2 spaces
- Trailing comma: es5
- Usage of `@prettier/plugin-oxc`
- Prettier overrides for specific packages

**Impact:** New code may use non-standard formatting, requiring CI fixes.

**Recommendation:** Create `.claude/rules/prettier-formatting.md` or add to existing formatting rules.

---

### 2. **ESLint v9 Typed Linting Specifics** [MEDIUM PRIORITY]

**Status:** Partially covered (eslint.md exists in docs, but not in rules/)

Our rules don't document:

- ESLint flat config format (v9 only)
- Typed linting enabled (TypeScript type-aware checks)
- Single root-level config (not per-package)
- Type import style enforcement: `prefer-top-level`
- Floating promise detection (critical for async/await)
- Max warnings limit behavior (app-specific: web has 14,367 warnings tolerance)

**Impact:** Developers may not understand why certain lint errors appear or how to suppress them properly.

**Recommendation:** Reference docs/eslint.md in `.claude/rules/linting-standards.md` or ensure visibility.

---

### 3. **Unit Test Requirement Emphasis** [MEDIUM PRIORITY]

**Status:** Mentioned in general rules, not emphasized as mandatory

Our rules say "write tests" but Plane.so REQUIRES:

- "All features or bug fixes must be tested by one or more specs"
- Tests are validation, not optional
- Backend: pytest with markers (unit, contract, smoke)
- Frontend: turbo-based test tasks per package

**Impact:** Code without tests could be merged if not caught in review.

**Recommendation:** Elevate test requirement to MANDATORY status in rules with specific backend test command examples.

---

### 4. **Issue/PR Title and Type Conventions** [MEDIUM PRIORITY]

**Status:** Missing from our rules

Official Plane.so requires:

- Issue titles: emoji + type + description (`🚀 Feature: [desc]`)
- PR type selection: bug fix, feature, improvement, refactor, perf, docs
- Test Scenarios: mandatory field in PR template

**Impact:** Our AI agents may create PRs with non-standard formats.

**Recommendation:** Create `.claude/rules/github-conventions.md` documenting:

- Issue title format with emoji
- PR template structure
- Test Scenarios field requirement
- Branch naming conventions (separate concern, not in Plane's CONTRIBUTING.md)

---

### 5. **Backend Test Command Specifics** [MEDIUM PRIORITY]

**Status:** Missing from our rules

Our rules say "run tests" but don't document:

- Plane uses `cd apps/api && python run_tests.py` (custom test runner)
- Supports markers: `-u` (unit), `-c` (contract), `-s` (smoke)
- Supports: `-o` (coverage), `-p` (parallel), `-v` (verbose)
- Default flags: `--reuse-db --nomigrations`

**Impact:** Developers may not know which test command variants work for different scenarios.

**Recommendation:** Document in `.claude/rules/backend-testing.md` with explicit command examples.

---

### 6. **Monorepo-Specific Linting Context** [LOW PRIORITY]

**Status:** Not explicitly covered

Plane.so documents:

- Single root ESLint config handles all packages (not per-package)
- Requires `tsconfig.json` in each package (for type awareness)
- Automatic discovery pattern: `{apps,packages}/*/tsconfig.json`
- Different max-warnings tolerances per app (web: 14,367)

**Impact:** Adding new packages/apps may not lint correctly if tsconfig discovery fails.

**Recommendation:** Add context to dev rules about tsconfig discovery requirements.

---

### 7. **Translation Contribution Quality Checklist** [LOW PRIORITY]

**Status:** Not covered (niche but documented)

Plane.so requires:

- IntlMessageFormat for dynamic content (variables, pluralization)
- All translation keys in all language files
- Nested structure consistency across languages
- Quality checklist before submission

**Impact:** Minimal (affects only translation contributors), but important for i18n features.

**Recommendation:** Document in existing i18n rules or create dedicated translation guidelines.

---

## What Our Rules ALREADY Cover (No Action Needed)

✅ **Already documented correctly:**

- CE override pattern (never modify core/)
- MobX store conventions (makeObservable, observer, set from lodash-es)
- Color tokens (short form: text-primary, border-subtle)
- Backend views (BaseViewSet, BaseAPIView, permissions)
- i18n rules (apps/web only, not admin)
- File standards (kebab-case, <200 lines, <150 lines components)
- Conventional commit format (general mention, not Plane-specific)
- Git safety (no force push, no upstream pull)

## Recommendations (Prioritized)

| Priority | Gap                                         | Action                                                               | File                                         |
| -------- | ------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| HIGH     | Prettier formatting not specified           | Create rules covering 120-char width, es5 trailing comma, oxc plugin | `.claude/rules/prettier-formatting.md`       |
| HIGH     | Test requirement not mandatory              | Elevate to MUST, add backend test command docs                       | Update `.claude/rules/development-rules.md`  |
| MEDIUM   | ESLint v9/typed linting context missing     | Reference/expand docs/eslint.md in rules                             | Create `.claude/rules/linting-standards.md`  |
| MEDIUM   | GitHub conventions not documented           | Issue title format, PR types, test scenarios                         | Create `.claude/rules/github-conventions.md` |
| MEDIUM   | Backend test command variants not specified | Document all pytest runner options                                   | Create `.claude/rules/backend-testing.md`    |
| LOW      | Monorepo tsconfig discovery unclear         | Add context to package creation guidance                             | Update `.claude/rules/development-rules.md`  |
| LOW      | Translation quality checklist missing       | Document IntlMessageFormat requirements                              | Update `.claude/rules/i18n-rules.md`         |

## Unresolved Questions

1. **Custom max-warnings per app:** Should all apps standardize warning tolerance, or keep per-app?
2. **Typed linting opt-in:** Are new packages required to have strict TypeScript configs, or gradual migration?
3. **Branch naming:** Plane's CONTRIBUTING.md doesn't document branch naming—is our `{user}/{type}/{desc}` pattern their standard?

---

**Report generated:** 2026-03-12 08:38 UTC
**Researched by:** researcher (Plane.so official docs review)
