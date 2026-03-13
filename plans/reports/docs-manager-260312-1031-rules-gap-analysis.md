# Documentation Update Report: Rules Gap Analysis

**Date**: 2026-03-12 | **Task**: Sync docs with codebase rules changes

## Summary

Updated 2 documentation files to reflect recent codebase convention changes. All updates were targeted fixes—no unnecessary rewrites.

## Changes Made

### 1. `/docs/code-standards.md` (Updated)

**Additions**:

- **ESLint plugin**: Added `@plane/no-legacy-tokens` rule documentation
  - Blocks legacy tokens: `text-color-*`, `border-color-*`
  - Enforces short form: `text-*`, `border-*`
  - New "Custom ESLint Plugin" subsection under ESLint Configuration

- **lodash-es clarification**: Added `set()` pattern documentation
  - Good: `import { set } from "lodash-es"` for nested object updates
  - Avoid: `import { set } from "mobx"` (different purpose)
  - Placed before Store pattern section

- **i18n scope**: Added new Internationalization section
  - Rule: Use `useTranslation` + `t()` only in `apps/web`
  - Restriction: Do NOT add i18n to `apps/admin` (English-only)
  - Import from `@plane/i18n`

**Updated**: Last modified timestamp (2026-03-01 → 2026-03-12)

### 2. `/docs/system-architecture.md` (Updated)

**Additions**:

- **Instance Admin Pattern**: New subsection under Admin User Management
  - BaseAPIView + InstanceAdminPermission pattern (role >= 15)
  - Code example showing typical usage
  - Lists 3 applied areas: user mgmt, monitoring, instance config
  - Location reference: `plane/license/permissions.py`

**Note**: Monitoring dashboard section was already present—no changes needed there.

**Updated**: Last modified timestamp (2026-03-02 → 2026-03-12)

## What Did NOT Require Updates

- ✓ **design-guidelines.md**: Already corrected (legacy tokens removed)
- ✓ **codebase-summary.md**: No rules-specific content to update
- ✓ **project-overview-pdr.md**: N/A (rules doc, not codebase ref)

## Verification

All updates verified against actual codebase:

- ESLint plugin `@plane/no-legacy-tokens` exists in eslint config
- `set()` from `lodash-es` confirmed in implementation patterns
- i18n restriction documented in rules (`apps/web` only)
- BaseAPIView + InstanceAdminPermission found in `plane/license/api/`

## Files Modified

- `/Volumes/Data/SHBVN/plane.so/docs/code-standards.md` (+52 lines)
- `/Volumes/Data/SHBVN/plane.so/docs/system-architecture.md` (+55 lines)

## Quality Checklist

- [x] Only updated what changed in codebase
- [x] Verified all code references exist
- [x] Maintained consistency with existing style
- [x] Added code examples where appropriate
- [x] Updated timestamps
- [x] No broken links or references

---

**Status**: Complete | **Time**: ~5 min | **Token Efficiency**: Minimal (only targeted updates)
