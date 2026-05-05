# Research: Rule Coverage Strategy for Plane CE Components

## 1. Current Rule Inventory

### Claude Code (.claude/rules/) — 20 files, 2,170 lines

| Category  | Files                                                            | Lines | Path-Scoped?       |
| --------- | ---------------------------------------------------------------- | ----- | ------------------ |
| Workflow  | 4 (primary, dev-rules, orchestration, doc-mgmt)                  | 315   | No (always loaded) |
| Frontend  | 7 (checklist, colors, components, mobx, routing, dialogs, forms) | 584   | Partial            |
| Backend   | 5 (models, views, serializers, urls-celery, testing-i18n)        | 482   | No                 |
| Composite | 2 (design-system, backend-architecture)                          | 236   | No                 |
| Services  | 2 (api-services, i18n)                                           | 116   | No                 |

### Antigravity (.agent/rules/) — 17 files, 1,511 lines

- Mirror of .claude/rules/ minus workflow files
- GEMINI.md (321 lines) duplicates ~60% of rule file content

### Problem: Massive Duplication

- GEMINI.md repeats content from .agent/rules/ files
- .claude/rules/ and .agent/rules/ are ~95% identical
- Same rules appear in CLAUDE.md, rule files, AND docs/

## 2. Components Needing Rules (Gap Analysis)

### Currently Covered ✅

- MobX stores, color tokens, component libraries, routing/layouts
- Dialogs/modals, forms/inputs, i18n, API services
- Backend models, views, serializers, URLs, Celery
- Frontend implementation checklist

### Missing/Incomplete ❌

| Component                   | Priority | Why Needed                                          |
| --------------------------- | -------- | --------------------------------------------------- |
| Types/interfaces pattern    | P1       | `packages/types/src/` has strict conventions        |
| CE override pattern details | P1       | Most common mistake area                            |
| React Router v7 routes      | P2       | `app/routes/` file-based routing specifics          |
| Permissions/RBAC frontend   | P2       | `@allow_permission` + frontend guards               |
| Activity tracking           | P2       | `issue_activity.delay()` + `model_activity.delay()` |
| Error handling patterns     | P3       | Try-catch + toast feedback patterns                 |
| Testing patterns            | P3       | Backend test conventions                            |
| Migration patterns          | P3       | Django migration best practices                     |

## 3. Rule Organization Strategies

### A. File-Pattern Scoping (Claude Code)

```yaml
---
paths:
  - apps/web/ce/**
  - apps/web/core/components/**
---
# CE Frontend rules
```

**Recommended scoping:**
| Rule File | Paths |
|-----------|-------|
| frontend-checklist | `apps/web/**`, `apps/admin/**` |
| mobx-stores | `**/store/**`, `**/stores/**` |
| backend-views | `apps/api/**/views/**` |
| backend-models | `apps/api/**/models/**`, `**/migrations/**` |
| backend-serializers | `apps/api/**/serializers/**` |
| i18n-rules | `**/locales/**`, `**/i18n/**` |
| color-tokens | `**/*.tsx`, `**/*.css` |
| routing-layouts | `**/routes/**`, `**/layout*` |

### B. Antigravity Strategy (No Path Scoping)

Since .agent/rules/ has no auto-loading mechanism:

1. Keep GEMINI.md as compact index (~150 lines)
2. Use phase-file embedding for detailed rules
3. `.agent/rules/` = reference library for plan generation

### C. Single Source of Truth

Maintain rules in ONE location, generate/symlink for other tools:

- Source: `.claude/rules/` (supports path scoping)
- Mirror: `.agent/rules/` (copy or symlink)
- GEMINI.md: Compact summary + "read .agent/rules/X for details"

## 4. Rule Compression Techniques

### Before (prose — 8 lines):

```
When creating MobX stores, always use makeObservable with explicit
field declarations. Never use makeAutoObservable as it can cause
issues with inheritance. Always wrap components that read from stores
with the observer higher-order component...
```

### After (checklist — 4 lines):

```
- ✅ `makeObservable` (explicit) — NEVER `makeAutoObservable`
- ✅ `observer()` on all store-reading components
- ✅ `runInAction` for async observable updates
- ✅ `set()` from MobX for new record keys
```

**Compression ratio**: 50% fewer lines, higher scanability

### Table Format for Multi-Option Rules:

```
| Context | Component | Import |
|---------|-----------|--------|
| admin app | Dialog | `@plane/propel/dialog` |
| web core | Dialog | `@headlessui/react` |
| web legacy | Modal | `ModalCore` from `@plane/ui` |
```

## 5. Recommended Rule File Structure

```
.claude/rules/
├── [always loaded - no paths:]
│   ├── development-rules.md (~50 lines)
│   └── orchestration-protocol.md (~35 lines)
├── [frontend scoped]
│   ├── frontend-checklist.md (paths: apps/web/**, apps/admin/**)
│   ├── color-tokens.md (paths: **/*.tsx)
│   ├── component-libraries.md (paths: apps/web/**, apps/admin/**)
│   ├── mobx-stores.md (paths: **/store/**)
│   ├── routing-layouts.md (paths: **/routes/**, **/layout*)
│   ├── dialogs-modals.md (paths: **/dialog*, **/modal*)
│   ├── forms-inputs.md (paths: **/form*, **/input*)
│   └── i18n-rules.md (paths: **/locales/**, **/i18n/**)
├── [backend scoped]
│   ├── backend-models.md (paths: apps/api/**/models/**)
│   ├── backend-views.md (paths: apps/api/**/views/**)
│   ├── backend-serializers.md (paths: apps/api/**/serializers/**)
│   ├── backend-urls-celery.md (paths: apps/api/**/urls/**)
│   └── backend-testing-i18n.md (paths: apps/api/**/tests/**)
└── [composite - remove, merge into scoped files]
    ├── plane-design-system.md → merge into frontend files
    └── plane-backend-architecture.md → merge into backend files
```

## Unresolved Questions

1. Does Antigravity support any form of conditional rule loading?
2. Can .agent/rules/ be symlinked from .claude/rules/ to avoid duplication?
3. Should we use a build script to generate GEMINI.md from .claude/rules/?
