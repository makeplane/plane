# Scout Report — Plane.so Data Model & Activity Logging

## 1. Page Data Model (`apps/api/plane/db/models/page.py`)

### Page (lines 23-78)
- `workspace` FK → Workspace (line 30)
- `name` TextField (31)
- `description_json` JSONField — structured content, ProseMirror-like (32)
- `description_binary` BinaryField — cached binary (33)
- `description_html` TextField — **PRIMARY content source for RAG** (34)
- `description_stripped` TextField — plain text (35)
- `owned_by` FK → User (36)
- `access` choices: 0=Public / 1=Private (37)
- `projects` M2M → Project via ProjectPage (52)
- `parent` self-FK for hierarchy (40-46)
- `is_locked`, `view_props`, `logo_props` (48-50)
- `archived_at` DateField for soft delete (47)

Workspace-scoped; accessible across projects via ProjectPage join. Not every Page is in a Project.

### PageVersion (lines 158-183)
Created on content change. Keeps 20 versions max (see `page_version_task.py:40`).
- `page`, `workspace`, `owned_by`
- `description_html`, `description_json`, `description_binary`, `description_stripped`
- `last_saved_at`
- `sub_pages_data` JSONField (hierarchy snapshot)

### PageLog (lines 80-118)
Component-level transaction log. Tracks mentions, embeds.
- `page`, `transaction` UUID, `entity_identifier`, `entity_type`, `entity_name`, `workspace`
- Entity types: to_do, issue, image, video, file, link, cycle, module, page_mention, user_mention

### PageLabel, ProjectPage — M2M join tables.

---

## 2. Page Save Lifecycle

### Create (`apps/api/plane/app/views/page/base.py:129-152`)
```python
# PageSerializer.create() saves Page + ProjectPage + PageLabels
# Then: page_transaction.delay(new_description_html, old_html=None, page_id)
```

### Update (`partial_update` lines 154-195)
```python
# Checks ownership
# PageDetailSerializer.update()
# If description_html changed:
#   page_transaction.delay(new_html, old_html, page_id)
```

### Celery tasks triggered

**`apps/api/plane/bgtasks/page_version_task.py:17`** — `page_version()` shared_task
- Creates PageVersion if description_html differs (26)
- Cleanup: keep max 20, delete oldest (40)

**`apps/api/plane/bgtasks/page_transaction_task.py`** — `page_transaction()` shared_task
- Parses HTML diff, extracts component references
- Creates PageLog entries per extracted entity
- Component tags: `mention-component`, `image-component`

**Pattern:** No single `page_activity` task; instead split into:
1. `page_transaction.delay()` → PageLog entries
2. `page_version.delay()` → PageVersion snapshots

---

## 3. IssueComment Model (`db/models/issue.py:489-573`)

### Fields
- `issue` FK (497)
- `comment_html`, `comment_json`, `comment_stripped` (490-492)
- `description` OneToOneFK → Description (493)
- `actor` User (499)
- `access` INTERNAL/EXTERNAL (505)
- `edited_at`, `parent` (for threads, 512-515)
- `attachments` ArrayField URLs (496)
- `TRACKED_FIELDS = ["comment_stripped", "comment_json", "comment_html"]` (517)
- `.save()` atomically updates Description (519-559)

### Retrieval (`app/views/issue/comment.py:35-61`)
```python
IssueComment.objects
  .filter(workspace__slug=self.kwargs["slug"])
  .filter(project_id=self.kwargs["project_id"])
  .filter(issue_id=self.kwargs["issue_id"])
  .filter(project__project_projectmember__member=request.user)
  .select_related("project", "workspace", "issue")
```

For summarize-ticket feature: `Issue.objects.get(id=...).issue_comments.all().order_by('created_at')`

---

## 4. Activity Logging Pattern

### IssueActivity (`db/models/issue.py:453-487`)
- `issue` FK, `verb` ("created"/"updated"), `field`, `old_value`, `new_value`
- `comment`, `attachments`, `issue_comment` FK
- `actor` User, `epoch` float timestamp

### Recording — `bgtasks/issue_activities_task.py:1696-1746`
```python
@shared_task
def issue_activity(type, requested_data, current_instance, issue_id,
                   actor_id, project_id, epoch, subscriber=True, notification=False):
    ACTIVITY_MAPPER = {
        "issue.activity.created": create_issue_activity,
        "issue.activity.updated": update_issue_activity,
        "comment.activity.created": create_comment_activity,
        ...
    }
```

### Calling — `app/views/issue/comment.py:85-95`
```python
issue_activity.delay(
    type="comment.activity.created",
    requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
    actor_id=str(request.user.id),
    issue_id=str(issue_id),
    project_id=str(project_id),
    current_instance=None,
    epoch=int(timezone.now().timestamp()),
    notification=True,
    origin=base_host(request),
)
```

### Generic model_activity — `bgtasks/webhook_task.py:465-507`
Diff-based tracker, emits webhook per changed field. Template for `AIRequestLog`.

---

## 5. Instance Configuration

### Add config key
`apps/api/plane/utils/instance_config_variables/core.py:276-302`
```python
llm_config_variables = [
    {"key": "LLM_API_KEY", "category": "AI", "is_encrypted": True,
     "value": os.environ.get("LLM_API_KEY")},
    ...
]
# Merge into core_config_variables (line 328-341)
```

### Retrieve
`apps/api/plane/license/utils/instance_value.py:17-39`
```python
def get_configuration_value(keys):
    if settings.SKIP_ENV_VAR:
        # From DB, decrypt if needed
    else:
        # Fall back to os.environ
    return tuple(values)
```

### Admin UI
`apps/admin/app/(all)/(dashboard)/ai/form.tsx:24-96` — uses `useInstance().updateInstanceConfigurations()`.

---

## 6. Rate Limiting & Throttling

### Existing patterns
`apps/api/plane/throttles/asset.py` — `AssetRateThrottle` (scope per asset_id)
`apps/api/plane/authentication/rate_limit.py` — `AuthenticationThrottle` (30/min), `EmailVerificationThrottle` (3/hr)
`apps/api/plane/api/rate_limit.py:12-91` — `ApiKeyRateThrottle` (60/min default, per-api-key scoping, exposes `X-RateLimit-*` headers)

### Global config
`apps/api/plane/settings/common.py:82`
```python
DEFAULT_THROTTLE_CLASSES = ("rest_framework.throttling.AnonRateThrottle",)
```

### Pattern
Inherit `SimpleRateThrottle`, override `get_cache_key()` for custom scope. DRF uses Redis cache backend.

### Feature toggle
No workspace-level feature flag system exists. `WorkspaceUserHomePreference.is_enabled` exists but for UI prefs only. For AI: either check `LLM_API_KEY` set OR add explicit `ENABLE_AI_FEATURES` config + new `WorkspaceFeatureToggle` model.

---

## 7. Integration Pattern Summary

| Aspect | Pattern | File |
|---|---|---|
| Model def | Inherit `BaseModel` / `ProjectBaseModel` | `db/models/page.py:23` |
| Activity | Celery `@shared_task`, pass `str(id)` not instance | `bgtasks/issue_activities_task.py:1697` |
| Config storage | List in `instance_config_variables/core.py` | `276-302` |
| Config retrieval | `get_configuration_value([{key, default}])` | `license/utils/instance_value.py:17` |
| Throttle | `SimpleRateThrottle` + override `get_cache_key()` | `api/rate_limit.py:12` |
| Page content for RAG | `description_html` primary, `description_stripped` for plain text | `db/models/page.py:32-35` |

---

## 8. Unresolved Questions

1. ProseMirror vs HTML — is `description_json` a ProseMirror state? Need to verify schema before choosing chunking input.
2. Sub-page tracking — `PageVersion.sub_pages_data` JSON structure?
3. Workspace-level feature flags — confirmed no existing pattern; must build new.
4. Comment summarization scoping — Issue-level only? Or expose workspace-wide "recent activity summary"?
