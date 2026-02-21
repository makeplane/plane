# Phase 4: Update Docs/Rules

## Overview

- **Priority**: P2
- **Status**: pending
- **Description**: Update documentation and Claude rules to reflect 3-language setup

## Related Code Files

### Files to Modify

- `.claude/rules/plane-design-system.md` -- i18n section
- `.claude/rules/plane-backend-architecture.md` -- i18n section
- `docs/code-standards.md` -- if i18n mentioned

## Implementation Steps

1. Update `.claude/rules/plane-design-system.md` i18n section:
   - Change "add key to ALL language files" to "add key to all 3 language files (en, ko, vi)"
   - Update translation files path description to note only 3 locales

2. Update `.claude/rules/plane-backend-architecture.md` i18n section:
   - Same change -- reference 3 languages instead of "ALL language files"

3. Check `docs/code-standards.md` for any i18n references mentioning multiple languages, update if found.

4. Grep for mentions of specific deleted languages in docs:
   ```bash
   grep -r "locales/" docs/ .claude/rules/ --include="*.md" | grep -v "en\|ko\|vi"
   ```

## Todo List

- [ ] Update plane-design-system.md i18n section
- [ ] Update plane-backend-architecture.md i18n section
- [ ] Check and update code-standards.md if needed
- [ ] Verify no stale language references in docs

## Success Criteria

- All docs/rules reference only en, ko, vi
- New feature checklist mentions 3 languages specifically
