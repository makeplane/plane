# Phase 1 — Deferred Items

Pre-existing test failures discovered during Plan 01-02 full-suite regression run, but **out of scope** per Plan 01-02 SCOPE BOUNDARY (only auto-fix issues caused by the current plan's changes).

These failures exist on the parent commit (`7c8cf118b7` = Plan 01-02 Task 1) AND on Plan 01-01's tip (`c7df9b8d2d`), so they pre-date this milestone entirely. They do not affect Phase 1's deep module (`apps/api/plane/app/services/timeline_propagation/`) or its 11 unit tests, all of which pass green.

## Pre-existing unit-suite failures (verified pre-Plan-01-02)

| Test                                                                | File                                                    | Verified pre-existing?      | Notes                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| `TestCopyS3Objects::test_copy_s3_objects_of_description_and_assets` | `plane/tests/unit/bg_tasks/test_copy_s3_objects.py`     | yes (fails on `c7df9b8d2d`) | Background-task test; unrelated to timeline_propagation |
| `TestValidateUrlIp::test_rejects_non_http_scheme`                   | `plane/tests/unit/bg_tasks/test_work_item_link_task.py` | yes (fails on `c7df9b8d2d`) | URL validation test; unrelated                          |
| `TestContainsURL::test_contains_url_length_limit_under_1000`        | `plane/tests/unit/utils/test_url.py`                    | yes (fails on `c7df9b8d2d`) | URL utils test; unrelated                               |
| `TestContainsURL::test_contains_url_length_limit_exactly_1000`      | `plane/tests/unit/utils/test_url.py`                    | yes (fails on `c7df9b8d2d`) | URL utils test; unrelated                               |
| `TestContainsURL::test_contains_url_total_length_vs_line_length`    | `plane/tests/unit/utils/test_url.py`                    | yes (fails on `c7df9b8d2d`) | URL utils test; unrelated                               |

Verification command:

```bash
git stash && \
docker exec plane-api-1 sh -c "cd /code && DJANGO_SETTINGS_MODULE=plane.settings.test pytest \
  plane/tests/unit/utils/test_url.py::TestContainsURL::test_contains_url_length_limit_under_1000 \
  plane/tests/unit/bg_tasks/test_copy_s3_objects.py::TestCopyS3Objects::test_copy_s3_objects_of_description_and_assets \
  plane/tests/unit/bg_tasks/test_work_item_link_task.py::TestValidateUrlIp::test_rejects_non_http_scheme" && \
git stash pop
```

Result before Plan 01-02 Task 2: 3 failed (subset run); full suite: 5 failed. Result after Plan 01-02 Task 2: 5 failed, 107 passed (no new failures introduced).

## Disposition

- **Not fixed in Phase 1.** Out of scope per Plan 01-02 SCOPE BOUNDARY rule.
- **Should be triaged outside the timeline-dependency-drag milestone**, or by a follow-up plan if any of them become timeline-blocking.
- The Phase 1 verification gate that mattered — every test in `plane/tests/unit/services/timeline_propagation/test_graph.py` passes green (11 PASSED, 0 FAILED) — is satisfied.
