# Phase 01: Remove Issue Opinion Feature

## Overview
Xoá toàn bộ code của feature Opinion — backend model, migration, serializer, views, URLs, frontend store, service, hooks, components, types, i18n.

## Files to DELETE

### Backend
| File | Action |
|------|--------|
| `apps/api/plane/db/models/opinion.py` | DELETE |
| `apps/api/plane/app/serializers/opinion.py` | DELETE |
| `apps/api/plane/app/views/issue/opinion.py` | DELETE |

### Frontend
| File | Action |
|------|--------|
| `apps/web/ce/components/issues/opinion/` (entire dir) | DELETE |
| `apps/web/ce/hooks/store/use-opinion.ts` | DELETE |
| `apps/web/ce/services/issue-opinion.service.ts` | DELETE |
| `apps/web/ce/store/opinion.store.ts` | DELETE |
| `packages/types/src/issues/opinion.ts` | DELETE |

## Files to MODIFY

### Backend
| File | Change |
|------|--------|
| `apps/api/plane/db/models/__init__.py` | Remove `from .opinion import IssueOpinion` |
| `apps/api/plane/app/serializers/__init__.py` | Remove `from .opinion import IssueOpinionSerializer` |
| `apps/api/plane/app/views/__init__.py` | Remove `IssueOpinionEndpoint`, `IssueOpinionDetailEndpoint`, `IssueOpinionListEndpoint` imports |
| `apps/api/plane/app/urls/issue.py` | Remove opinion URL imports + 3 URL patterns (lines ~335-344) |

### Migration (DROP TABLE)
Create new migration `apps/api/plane/db/migrations/0143_remove_issueopinion.py`:
```python
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ("db", "0142_issueopinion"),
    ]
    operations = [
        migrations.DeleteModel(name="IssueOpinion"),
    ]
```
> ⚠️ Keep `0142_issueopinion.py` as historical record. Only add new drop migration.

### Frontend
| File | Change |
|------|--------|
| `packages/types/src/issues.ts` | Remove `export * from "./issues/opinion"` |
| `apps/web/ce/store/root.store.ts` | Remove `OpinionStore` import, field, constructor line |
| `apps/web/core/components/issues/issue-detail/issue-activity/activity-comment-root.tsx` | Remove `OpinionButton` import, `useOpinion` import, `opinionStore` hook, `useEffect` for batch load, `actionSlot` prop with `<OpinionButton>` |
| i18n files (Phase 06) | Remove `opinion` translation block |

## After Modification: activity-comment-root.tsx

Remove:
1. `import { OpinionButton } from "@/plane-web/components/issues/opinion";`
2. `import { useOpinion } from "@/plane-web/hooks/store/use-opinion";`
3. `const opinionStore = useOpinion();`
4. The `useEffect` block (lines 60-65)
5. `actionSlot={...}` prop on `<IssueActivityItem>` (simplify to `<IssueActivityItem key={...} activityId={...} ends={...} />`)

## Verification
- `pnpm check:lint` — no errors
- `grep -r "opinion\|Opinion" apps/web/ce apps/web/core packages/types` — zero hits (except migration file)
