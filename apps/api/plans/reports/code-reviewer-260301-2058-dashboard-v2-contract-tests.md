# Code Review: Dashboard V2 Contract Tests

**File:** `apps/api/plane/tests/contract/app/test_dashboard.py`
**LOC:** 621 | **Tests:** 52 | **All pass:** Yes

---

## Overall Assessment

Solid coverage of the happy path and BRD gap features. Structure is clean, fixtures are appropriate, and the crum/impersonate pattern is used correctly for direct ORM writes. Several medium-priority issues exist around incomplete access-control testing, a wrong assertion about soft-delete cascade behavior, and fragile edge-case acceptance conditions.

---

## Critical Issues

None.

---

## High Priority

### H1 — Wrong assertion: `test_delete_dashboard_with_widgets` (line 113)

```python
# Line 113 — WRONG: SoftDeletionManager always excludes deleted_at IS NOT NULL
assert not Dashboard.objects.filter(pk=dashboard.id).exists()
```

`Dashboard.objects` is the `SoftDeletionManager` (excludes `deleted_at IS NOT NULL`), so this assertion is **always true** regardless of whether a hard or soft delete occurred. It doesn't prove soft-delete works.

Line 116 is correct (`all_objects` checks `deleted_at IS NOT NULL`). Remove line 113 — it adds no signal and is misleading.

Also, the comment "Widgets remain but are orphaned (soft-delete doesn't cascade)" is **incorrect**. The view calls `dashboard.delete()` which triggers Django's CASCADE on `DashboardWidget.dashboard = CASCADE`. Widgets are **hard-deleted** along with the dashboard unless the model overrides `delete()`. Verify actual behavior and update the comment.

```python
# Correct assertions
assert Dashboard.all_objects.filter(pk=dashboard.id, deleted_at__isnull=False).exists()
# Check if CASCADE hard-deletes widgets or leaves them
assert not DashboardWidget.objects.filter(dashboard_id=dashboard.id).exists()
```

### H2 — Access control: no cross-user isolation test

`DashboardViewSet.get_queryset()` filters: `Q(created_by=request.user) | Q(access=1)`. There is zero test that user B **cannot** read/edit user A's private dashboard (access=0). This is the most security-sensitive part of the view and is entirely untested.

Add:

```python
def test_other_user_cannot_access_private_dashboard(self, session_client, workspace, dashboard):
    # dashboard is private (access=0), created by create_user
    # create second user, authenticate as them
    other_user = User.objects.create(email="other@plane.so", ...)
    session_client.force_authenticate(user=other_user)
    url = reverse("workspace-dashboard", kwargs={"slug": workspace.slug, "pk": dashboard.id})
    resp = session_client.get(url)
    assert resp.status_code == status.HTTP_404_NOT_FOUND
```

---

## Medium Priority

### M1 — Fragile 404 assertion accepts 500 (lines 426, 434)

```python
assert resp.status_code in (status.HTTP_404_NOT_FOUND, status.HTTP_500_INTERNAL_SERVER_ERROR)
```

Accepting 500 as a valid response masks real bugs. The view calls `get_queryset().get(pk=...)` which raises `DoesNotExist`, and `BaseViewSet` catches that and returns 404. There is no reason to accept 500 here.

```python
assert resp.status_code == status.HTTP_404_NOT_FOUND
```

### M2 — `test_create_dashboard_empty_name_rejected` may be a false positive (line 72)

`Dashboard.name` is `CharField(max_length=255)` with no `blank=False` override (Django default) and no custom `validate_name` in `DashboardSerializer`. An empty string `""` is valid at the DB level for `CharField`. The test may be passing because the serializer happens to reject it via DRF's default `CharField` non-blank validation — but this is not explicitly enforced. Add a model-level test or a serializer unit test to confirm the constraint source.

### M3 — `test_create_dashboard_name_only` sends `access: 0` but other create tests don't (line 57 vs 63)

Minor inconsistency. Dashboard `access` defaults to `0` anyway, but tests should consistently include it or rely on the default explicitly, not mix.

### M4 — `workspace_with_project` fixture: `Project.objects.create` without `network_type` or `identifier` uniqueness (line 15)

`identifier="TST"` is hardcoded. If the test DB isn't fully isolated per test (it is with `@pytest.mark.django_db` transactions), this is fine. But if tests are ever run non-transactionally, this will collide. Consider using a factory or unique suffix.

### M5 — `test_widget_config_variants` has a config/chart_model mix that may silently skip validation (lines 605-620)

The `configs` list mixes top-level field overrides (`"chart_model": "GROUPED"`) with nested config dicts (`"config": {...}`). The unpacking `**extra` means when `extra = {"chart_model": "GROUPED"}`, no `config` key is sent at all. The test only checks `status.HTTP_201_CREATED` — it doesn't assert the values persisted. This makes the test vacuous for the config variants.

### M6 — No unauthenticated access test

No test verifies that unauthenticated requests return 401/403. Given `WorkSpaceBasePermission` is in play, one test covering this would round out the contract.

---

## Low Priority

### L1 — `import uuid` inside test method bodies (lines 422, 430)

Move to top-level imports per PEP8. Not a bug, just inconsistent with the file's import block.

### L2 — `test_rapid_widget_creation` (line 481) and `test_concurrent_widget_updates` (line 495)

These test names imply concurrency/race conditions but they're sequential HTTP calls in the same thread. Rename to `test_sequential_widget_creation` / `test_sequential_widget_updates` to be accurate.

### L3 — `session_client` unused parameter in `dashboard` fixture (line 24)

```python
def dashboard(workspace, session_client, create_user):
```

`session_client` is injected but never used in the fixture body. Remove it.

### L4 — `test_list_dashboards` creates dashboards without mocking `model_activity` on the `POST` calls (lines 78-79)

The inner `session_client.post` calls inside the test body trigger `model_activity.delay` but only the method-level `@patch` mock covers the outer list call. The fixture-level posts will attempt the real Celery call. Check whether the celery task broker is properly stubbed in test settings; if not, those inner posts may silently error and the list result may not reflect 2 created dashboards.

---

## Missing Coverage

| Scenario                                                                                      | Priority |
| --------------------------------------------------------------------------------------------- | -------- |
| User B cannot read user A's private dashboard                                                 | High     |
| Unauthenticated request returns 401/403                                                       | Medium   |
| `GUEST` role cannot create/edit dashboard                                                     | Medium   |
| Widget belonging to a different dashboard returns 404                                         | Medium   |
| `bulk_position_update` with widget IDs from a different dashboard (cross-dashboard injection) | Medium   |
| Invalid `chart_type` value (e.g. `"UNKNOWN"`) returns 400                                     | Low      |
| Dashboard name > 255 chars returns 400                                                        | Low      |
| `test_delete_widget` verifies widget is actually gone from DB                                 | Low      |

The cross-dashboard widget injection case for bulk position update is worth testing: the view silently skips unknown widget IDs (`if widget is None: continue`), so a widget from dashboard B sent in dashboard A's bulk update will simply be ignored. A test confirming this silent behavior is expected would prevent a future refactor from accidentally allowing cross-dashboard writes.

---

## Positive Observations

- Correct use of `crum.impersonate(user)` for all direct ORM fixture writes — consistent with how `BaseModel.save()` uses crum to set `created_by`/`updated_by`
- `@patch("plane.app.views.dashboard.model_activity.delay")` is correctly targeted to the import location, not the task module
- `@pytest.mark.django_db` at class level is correct and avoids per-method decoration noise
- Parametrized chart type and property tests are efficient and readable
- Bulk position test (`test_bulk_position_update`) does DB round-trip verification with `refresh_from_db()` — good
- Test class segmentation by feature phase maps cleanly to BRD phases

---

## Recommended Actions

1. Fix `test_delete_dashboard_with_widgets` — remove redundant assertion on line 113, verify cascade behavior, update comment
2. Add cross-user private dashboard isolation test
3. Change 404-or-500 assertions to 404-only
4. Rename "concurrent/rapid" tests to "sequential"
5. Remove unused `session_client` from `dashboard` fixture
6. Move `import uuid` to top of file
7. Add at least one unauthenticated request test and one GUEST-role rejection test

---

## Unresolved Questions

- Does `dashboard.delete()` in the view trigger Django CASCADE (hard-deleting widgets) or does `BaseModel` override `delete()` for soft-delete that also cascades? If soft-delete is overridden to set `deleted_at`, the CASCADE behavior changes entirely. The test comment assumes no cascade, but the FK is `on_delete=CASCADE` which is Django's hard delete. Needs verification against `BaseModel.delete()` implementation.
- Is `model_activity.delay` auto-stubbed in test settings via `CELERY_TASK_ALWAYS_EAGER` or similar? If not, `test_list_dashboards` has a latent real-Celery-call issue on its inner POST calls.
