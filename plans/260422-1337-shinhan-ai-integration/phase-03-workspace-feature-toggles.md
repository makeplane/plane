# Phase 03 — Workspace Feature Toggles + RBAC

## Context Links
- Research: `research/researcher-02-governance-banking.md` §5 (WorkspaceFeatureToggle model + permission pattern)
- Research: `research/scout-01-plane-data-model.md` §6 (no existing workspace-level flag system)
- Code: `apps/api/plane/db/models/workspace.py` (Workspace model reference)
- Code: Existing permission classes in `apps/api/plane/app/permissions/` (pattern)

## Overview
- Priority: P2
- Status: pending
- Effort: 3-4d
- Build a reusable `WorkspaceFeatureToggle` model with per-workspace, per-role, percentage-rollout, and time-window gating. Permission classes enforce per-endpoint. Admin UI for workspace admins.

## Key Insights
- No existing workspace feature-flag system in Plane. `WorkspaceUserHomePreference.is_enabled` is UI-only.
- Research recommends django-waffle rejection — it does not have workspace scoping natively. Custom model wins.
- RBAC via ManyToMany to existing workspace member roles (Plane uses integer roles, not Django Groups — adapt).
- Rollout percentage uses stable hash `md5(user_id + feature_key) % 100 < percentage` for consistent per-user experience.

## Requirements

### Functional
- Admin can enable/disable individual AI features per workspace.
- Each feature supports: `is_enabled` (bool), `allowed_roles` (array of role codes), `rollout_percentage` (0-100), `enabled_from` / `enabled_until` (nullable datetime).
- Feature keys: `ai_ask` (general chat), `ai_summarize_comments`, `ai_translate`, `ai_pages_rag_qa`, `ai_page_embedding` (infra toggle).
- Permission class `HasAIFeature(feature_key=...)` returns 403 when gate fails.
- Default: all AI features OFF for workspaces until explicitly enabled.

### Non-Functional
- Feature check cached per request (in `request.ai_features` dict), not queried per view.
- Feature check <5ms (cached lookup), <50ms cold (one DB + one cache hit).
- Backward compat: absence of toggle row = disabled (fail-safe).

## Architecture

```
Workspace ──1──N──▶ WorkspaceFeatureToggle
                        │ feature_key
                        │ is_enabled
                        │ allowed_roles[]    ◀── integer role codes (5=Admin, 15=Member, 20=Guest)
                        │ rollout_percentage
                        │ enabled_from/until

Request ──▶ DRF View ──▶ permission_classes = [HasAIAskFeature]
                             │
                             ▼
              WorkspaceFeatureToggleService.is_enabled(
                workspace_id, feature_key, user, now
              )
                             │
            ┌────────────────┴───────────────────┐
       cached?                                not cached
            │                                    │
            ▼                                    ▼
    return cached result         query DB → check time window
                                  → check member role in allowed_roles
                                  → check hash(user_id + key) % 100 < pct
                                  → cache 60s
```

## Related Code Files

**Create:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/workspace_feature_toggle.py` — model
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/migrations/XXXX_add_workspace_feature_toggle.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/utils/feature_toggle_service.py` — `is_enabled()` + cache layer
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/permissions/ai_feature.py` — `HasAIFeature` base + subclasses
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/ce/views/workspace_feature_toggle.py` — CRUD endpoints for workspace admins
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/workspace/settings/ai-features-panel.tsx` — toggle UI
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/services/feature-toggle.service.ts`

**Modify:**
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/__init__.py` — register new model
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/urls.py` (or relevant urls) — add CRUD endpoints
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/layouts/workspace-settings.tsx` — add "AI Features" nav item (respect CE override pattern)

**Delete:** None.

## Implementation Steps

1. **Model**: `WorkspaceFeatureToggle` with fields per research §5.1. Adapt `allowed_roles` as `ArrayField(IntegerField())` (Plane uses int role codes). `unique_together = ('workspace', 'feature_key')`.
2. **Migration**: Add model; seed default rows via data migration for 5 features with `is_enabled=False`, `allowed_roles=[5]` (admin only initially).
3. **Service**: `FeatureToggleService.is_enabled(workspace_id, feature_key, user) → bool`. Cache key `ftoggle:{workspace_id}:{feature_key}:{user_id}` TTL 60s. Cache bust on toggle update via signal.
4. **Permission classes**: `HasAIFeature` base checks workspace membership + toggle. Subclasses:
   - `HasAIAskFeature` (feature_key=`ai_ask`)
   - `HasAISummarizeFeature` (feature_key=`ai_summarize_comments`)
   - `HasAITranslateFeature` (feature_key=`ai_translate`)
   - `HasAIPagesRAGFeature` (feature_key=`ai_pages_rag_qa`)
5. **CRUD endpoints**: `GET/PATCH /api/workspaces/{slug}/ai-features/` — admin-only. Serializer validates `rollout_percentage ∈ [0,100]`, `enabled_until > enabled_from`.
6. **Frontend panel**: List 4-5 feature rows with toggle, role multi-select, % slider, date pickers. `observer()` wrapping MobX store.
7. **MobX store**: `WorkspaceFeatureToggleStore` with `fetchAll`, `update(featureKey, payload)`. Use `makeObservable` + `lodash-es set()`.
8. **Wire into existing AI endpoint**: Add `HasAIAskFeature` to `WorkspaceAIEndpoint.permission_classes` after `IsAuthenticated`.
9. **CE override check**: Confirm settings panel goes into `apps/web/ce/` not `apps/web/core/`. If Plane core has workspace settings shell, extend via CE slot pattern.
10. **Tests**: Unit (service time-window + rollout hash determinism), integration (403 when toggle off, 200 when on), regression (existing non-AI endpoints unaffected).

## Todo List

- [ ] Define `WorkspaceFeatureToggle` model + migration
- [ ] Seed default feature rows (disabled)
- [ ] Implement `FeatureToggleService` with 60s cache
- [ ] Implement `HasAIFeature` + 4 subclasses
- [ ] Build workspace admin CRUD endpoints + serializer
- [ ] Build MobX store + service client
- [ ] Build AI Features settings panel (CE override)
- [ ] Wire permission classes into Phase 01 AI endpoint
- [ ] Unit + integration tests
- [ ] Docs update: workspace admin guide (how to enable AI)

## Success Criteria
- Admin toggles `ai_ask` ON for a workspace → user in that workspace can call AI endpoint.
- User in workspace where toggle is OFF → 403 `{detail: "Feature disabled for this workspace"}`.
- Rollout percentage 50% → exactly consistent subset of users get access (same users across requests).
- Time window: toggle scheduled for `enabled_from=tomorrow` → disabled today, enabled tomorrow.
- Cache invalidates when admin updates toggle → new state visible within 60s.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Role-code mismatch between Plane roles and toggle role array | M | H | Reuse `ROLE_CHOICES` constant from Plane's workspace model; import don't redefine |
| Cache staleness after toggle update | M | M | Signal on save() → `cache.delete_pattern('ftoggle:{workspace_id}:*')` |
| Default-off prevents existing AI users from working | H | M | Migration detects workspaces with `LLM_API_KEY` set → seed toggles ON for those |
| CE override path breaks upstream merge | L | H | Lead must document CE pattern in plan; no edits to `apps/web/core/` |
| Percentage rollout hash drift on user rename/email change | L | L | Hash on `user.id` (UUID, immutable), not email |

## Security Considerations
- CRUD endpoint authorizes on Plane's workspace admin role (not superuser).
- Cannot enable features for workspaces user is not admin of.
- Audit: feature toggle changes log to `AIRequestLog` (feature_name=`toggle_change`, prompt=change payload).
- No PII in toggle model — safe.

## Open Questions (blocking validation)
- Q3.1 [Product] Feature list final — do we need `ai_image_gen` or `ai_code_review` as future-proofing keys?
- Q3.2 [Product] Default-off for new workspaces: acceptable, or auto-enable for pilot workspaces?
- Q3.3 [Infrastructure] Does Plane use Django's cache framework or direct Redis? Affects `cache.delete_pattern` usage.
- Q3.4 [Security] Role codes for `allowed_roles` — Plane uses 5/15/20; do we need a new "ai_power_user" role, or reuse?
- Q3.5 [Product] Should rollout % apply to embedding indexing (backend infra) or only user-facing features?

## Next Steps / Dependencies
- Requires: Phase 02 (governance) for the audit log of toggle changes.
- Blocks: Phase 05 (user-facing features check these flags).
- Parallel-safe with Phase 04 (different files).
