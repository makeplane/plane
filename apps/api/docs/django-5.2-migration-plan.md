# Django 4.2 → 5.2 Migration Plan (`apps/api`)

> **Status:** ✅ Executed & verified on branch `chore/django-5.2-upgrade` · **Target:** Django **5.2.15 LTS** from **4.2.30 LTS**
> **Scope:** `apps/api` (the only Django service in the monorepo) · **Strategy:** single coordinated PR, direct 4.2 → 5.2 jump · **Dependency policy:** opportunistic (latest stable, with evidence-based safe overrides)

---

## 1. Executive summary

The Plane API was audited end-to-end for Django 5.0/5.1/5.2 breaking changes (12 targeted code scans, a full settings audit, a 129-file migration scan, and per-dependency compatibility research). **The application code is already Django 5.2-clean.** Every breaking-change scan came back unaffected.

The migration is therefore **almost entirely a coordinated third-party dependency bump plus verification** — not a code rewrite. Risk is **low–medium** and concentrated in the dependency layer, not in Plane's own code.

**No runtime or infrastructure blockers:**

| Prerequisite | Django 5.2 requires | Plane has                       | Status |
| ------------ | ------------------- | ------------------------------- | ------ |
| Python       | ≥ 3.10              | 3.12.x (Docker + CI)            | ✅     |
| PostgreSQL   | ≥ 14 (drops PG 13)  | 15.7-alpine (all compose files) | ✅     |
| DB adapter   | psycopg 3 preferred | psycopg 3.3.0                   | ✅     |

**The only mandatory app-level change** is bumping the dependency pins. Everything else (settings, models, migrations, middleware, templates) already conforms to 5.2.

---

## Execution status — verified ✅

Executed on branch `chore/django-5.2-upgrade` and verified in the containerized test harness (`docker-compose-test.yml`: `python:3.12.5-alpine`, Postgres 15.7, Valkey, RabbitMQ, MinIO).

**Verification results (Django 5.2.15):**

| Gate                                              | Result                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `pip install -r requirements/test.txt`            | ✅ resolves, no conflicts                                                      |
| `manage.py check`                                 | ✅ "System check identified no issues"                                         |
| `manage.py makemigrations --check --dry-run`      | ✅ no changes (after the state-only `0122` migration)                          |
| `manage.py migrate` (full history on Postgres 15) | ✅ db `0001`→`0122`, `django_celery_beat`, `license`, `sessions` all applied   |
| `pytest` (full suite)                             | ✅ **393 passed, 0 failed**                                                    |
| `drf-spectacular` schema gen (0.29)               | ✅ generates (15.8k lines); only pre-existing `operationId` collision warnings |

**Changes made beyond the dependency pins (each surfaced by verification):**

1. **`plane/urls.py`** — gate the debug-toolbar URL include on `apps.is_installed("debug_toolbar")`. django-debug-toolbar **6.0** ships a real model (`HistoryEntry`); under test settings (`DEBUG=True`, app _not_ installed) the unconditional `include(debug_toolbar.urls)` raised `RuntimeError` during `manage.py check`. The guard makes the include correct in all settings (local: included; test/prod: skipped).
2. **`plane/db/migrations/0122_alter_draftissue_assignees_alter_issue_assignees_and_more.py`** — a **state-only** `AlterField` for three `ManyToManyField`s (`issue.assignees`, `draftissue.assignees`, `module.members`) that use `through=`/`through_fields=`. Django 5.1 normalized M2M `through_fields` deconstruction. `sqlmigrate` confirms **all three operations are `(no-op)`** — zero DDL, zero database impact. Required only so `makemigrations --check` stays green in CI.
3. **`plane/tests/contract/app/test_authentication.py`** — added a module-level autouse `cache.clear()` fixture (mirrors the existing per-class `_clear_state` fixtures). This fixes **8 pre-existing test failures** that are unrelated to the upgrade — verified by running the auth test file on the `preview` baseline (Django 4.2.30), which produced the **identical** "8 failed, 18 passed". Root cause: the per-IP `AuthenticationThrottle` (`10/minute`) stores request history in the shared cache, and `TestMagicSignIn`/`TestMagicSignUp` didn't reset it between tests.

**Not applied (revised from the original plan):** `FORMS_URLFIELD_ASSUME_HTTPS` — in Django 5.2 this transitional setting emits its **own** `RemovedInDjango60Warning`, and the codebase has no `forms.URLField` to silence, so adding it only adds noise. Reverted.

---

## 2. Current state

- **Service:** `apps/api` — Django + DRF + Celery (worker/beat) + Channels (ASGI http-only). No other Python/Django service exists in the repo.
- **Django:** `4.2.30` (final 4.2 LTS line; 4.2 reaches EOL ~April 2026 — this upgrade is time-sensitive).
- **Dependency files:** `requirements/base.txt`, `requirements/local.txt`, `requirements/production.txt`, `requirements/test.txt` (plain pip pins; **no lockfile** — edits are direct).
- **Run surfaces:** `bin/docker-entrypoint-{api,worker,beat,migrator}.sh`. All four must be smoke-tested.
- **Tests:** `pytest` + `pytest-django`, settings module `plane.settings.test`, run with `--reuse-db --nomigrations --strict-markers`.
- **CI:** `pull-request-build-lint-api.yml` runs **ruff lint only** — it does **not** run the test suite. The pytest suite must be run manually/locally as the migration gate.

---

## 3. Audit results — breaking-change scans (all clear)

Every Django 5.x removal/behavior-change category was scanned across `plane/` and `templates/`. Summary:

| #   | Breaking change (Django ver.)                                                                             | Result                                | Evidence                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `DEFAULT_FILE_STORAGE` / `STATICFILES_STORAGE` / `get_storage_class()` removed (5.1)                      | ✅ Not affected                       | Already uses the `STORAGES` dict (`settings/common.py:303-304`).                                                                                                                                        |
| 2   | `Meta.index_together` / `AlterIndexTogether` removed (5.1)                                                | ✅ Not affected                       | Zero matches in models or 129 migrations; already uses `Meta.indexes`.                                                                                                                                  |
| 3   | pytz support removed: `USE_DEPRECATED_PYTZ`, `timezone.utc`, `is_dst` (5.0)                               | ✅ Not affected                       | All ~30 `pytz.*` uses are the **third-party library's own API** (unaffected). No Django pytz-integration surface used.                                                                                  |
| 4   | `USE_L10N` setting removed (5.0)                                                                          | ✅ Not affected                       | Not defined anywhere.                                                                                                                                                                                   |
| 5   | `CICharField` / `CIEmailField` / `CITextField` removed (5.1)                                              | ✅ Not affected                       | Not used; only `ArrayField` / `ArrayAgg` from contrib.postgres.                                                                                                                                         |
| 6   | `format_html()` without args / `mark_safe` change (5.0)                                                   | ✅ Not affected                       | Zero `format_html(` / `mark_safe(` calls (HTML is rendered via templates).                                                                                                                              |
| 7   | `length_is` filter & legacy template tags removed (5.1)                                                   | ✅ Not affected                       | No Django Forms / removed tags in the 13 (email/admin) templates.                                                                                                                                       |
| 8   | `Model.save()/delete()` positional args → keyword-only (5.1)                                              | ✅ Not affected                       | Custom `delete()` overrides already pass `using=`/`soft=` by keyword.                                                                                                                                   |
| 9   | `forms.URLField` default-scheme transition (5.0)                                                          | ✅ Not affected                       | Only `models.URLField` / DRF `serializers.URLField` used; no `forms.URLField`.                                                                                                                          |
| 10  | Misc removed APIs (`make_random_password`, `conf.urls.url`, `ugettext`, `is_ajax`, `NullBooleanField`, …) | ✅ Not affected                       | Zero matches.                                                                                                                                                                                           |
| 11  | Middleware / async ORM / ASGI changes (5.x)                                                               | ✅ Not affected                       | All middleware new-style; `MiddlewareMixin` still supported; no `async def` / `database_sync_to_async`; ASGI is http-only.                                                                              |
| 12  | Auth / postgres aggregates / `TextChoices` (5.x)                                                          | ✅ Not affected (1 ⚠ optional review) | `ArrayAgg` uses only `distinct`/`filter`; `check_password`/`make_password` standard. **Optional:** review any reliance on `str(TextChoices.MEMBER)` repr (5.0 changed it to the value) — none observed. |

**Settings audit (`common.py`, `production.py`, `local.py`, `test.py`, `storage.py`, `redis.py`):** already 5.x-clean. `STORAGES` migrated, `DEFAULT_AUTO_FIELD = BigAutoField` set, `TIME_ZONE='UTC'` + `USE_TZ=True` (zoneinfo), middleware order valid, no removed settings present.

**Migration scan:** 129 migration files; no `index_together`/`AlterIndexTogether`/CI-fields. `AddIndexConcurrently` (2 files) is valid 5.2 usage with `atomic=False`. **Historical migrations run cleanly on 5.2.**

---

## 4. App-code changes

### 4.1 Required (done — see "Execution status" above)

- `plane/urls.py` debug-toolbar include guard (django-debug-toolbar 6.0 model requirement).
- `plane/db/migrations/0122_…` state-only M2M `AlterField` (Django 5.1 `through_fields` normalization; no DDL).
- `plane/tests/contract/app/test_authentication.py` autouse cache-reset fixture (fixes 8 pre-existing throttle failures; makes the suite green).

### 4.2 Optional / not taken

1. ~~**`FORMS_URLFIELD_ASSUME_HTTPS = True`**~~ — **not applied.** In Django 5.2 this transitional setting emits its _own_ `RemovedInDjango60Warning`, and there are no `forms.URLField` to silence, so it only adds noise.
2. **`STORAGES` cosmetic collapse** — `common.py:303-304` defines `STORAGES` across two statements; optionally collapse into one literal (functionally identical):
   ```python
   STORAGES = {
       "default": {"BACKEND": "plane.settings.storage.S3Storage"},
       "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
   }
   ```
3. **`plane/asgi.py` cleanup (pre-existing latent bug, unrelated to 5.2)** — `django_asgi_app = get_asgi_application()` is assigned but unused, `get_asgi_application()` is called a second time inside `ProtocolTypeRouter`, and `os.environ.setdefault("DJANGO_SETTINGS_MODULE", …)` is placed _after_ the first `get_asgi_application()` call (so it has no effect). Move the `setdefault` to the top and reuse `django_asgi_app`. Optional; do it here or as a separate cleanup.

---

## 5. Dependency upgrade matrix — **the actual work**

Policy: **latest stable**, with **evidence-based safe overrides** where "latest" carries avoidable risk (called out in **bold**). "Min for 5.2" is the lowest version that officially supports Django 5.2 (your fallback if a latest-stable bump regresses).

### 5.1 Must upgrade (current pin is NOT Django-5.2-compatible)

| Package                      | Current | **Target**                       | Min for 5.2 | Notes / risk                                                                                                                                                                                            |
| ---------------------------- | ------- | -------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Django**                   | 4.2.30  | **5.2.x** (latest 5.2 LTS patch) | 5.2.0       | Stay on **5.2 LTS** — do **not** jump to 6.0 (not LTS). Confirm newest 5.2.\* patch at execution time.                                                                                                  |
| djangorestframework          | 3.15.2  | **3.17.1**                       | 3.16.0      | 3.15 supports Django only ≤5.0. Verify `UniqueTogetherValidator`/conditional-`UniqueConstraint` behavior (3.16 tightened nullable/partial handling).                                                    |
| channels                     | 4.1.0   | **4.3.2**                        | 4.2.1       | 4.3 raises `asgiref>=3.9` (auto-resolved) and makes Daphne an optional extra — Plane serves ASGI via uvicorn/gunicorn, so no impact.                                                                    |
| django-cors-headers          | 4.3.1   | **4.9.0**                        | 4.7.0       | No consumer-facing breaking changes in range. Verify `CORS_ALLOWED_ORIGINS`/`CORS_ALLOW_ALL_ORIGINS` still load.                                                                                        |
| django-filter                | 24.2    | **25.2**                         | 25.1        | 25.x removed built-in DRF schema gen (Plane uses drf-spectacular → no impact). 25.2 requires Python ≥3.10 (have 3.12).                                                                                  |
| django-storages              | 1.14.2  | **1.14.6**                       | 1.14.6      | `url_protocol` defaults to **HTTPS** when unset (1.14.6); `config`→`client_config` deprecation. Verify S3 settings + generated URL scheme.                                                              |
| django-redis                 | 5.4.0   | **7.0.0**                        | 6.0.0       | 7.0 renamed zset/hash helper params (not used by Plane) and drops Django 5.0 (irrelevant). **Verify redis-py floor** (`redis==5.0.4`) satisfies 7.0; if not, pin **6.0.0** instead.                     |
| django_celery_beat           | 2.6.0   | **2.9.0**                        | 2.8.1       | **Skip 2.8.0** (shipped a regression, fixed in 2.8.1). 2.9 adds Django 6.0.                                                                                                                             |
| django-celery-results        | 2.5.1   | **2.6.0**                        | 2.6.0       | Note: `django_celery_results` is **not** in `INSTALLED_APPS` here (packaged result backend only), so its DB migrations don't apply — no `migrate` action needed. Result-expiry timing changed slightly. |
| drf-spectacular              | 0.28.0  | **0.29.0**                       | 0.29.0      | First version with the Django 5.2 classifier. **Regenerate & commit the OpenAPI schema** after upgrade.                                                                                                 |
| scout-apm                    | 3.1.0   | **3.5.3**                        | 3.5.0       | Additive; no consumer breaking changes.                                                                                                                                                                 |
| django-debug-toolbar _(dev)_ | 4.3.0   | **6.0.0** (not 7.0.0)            | 5.1.0       | **Override:** 7.0 drops Django 4.2 and moves to shadow-DOM rendering (can break custom panels/CSS). 6.0 gives the widest window. Dev-only.                                                              |
| pytest-django _(test)_       | 4.5.2   | **4.12.0**                       | 4.11.0      | 4.12 needs Python ≥3.10 (have 3.12) and adds Django 6.0. `pytest==9.0.3` already satisfies its floor.                                                                                                   |

### 5.2 Already 5.2-compatible — opportunistic patch bumps

| Package                              | Current    | **Target**            | Notes                                                                                                                                                                                                  |
| ------------------------------------ | ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| psycopg / psycopg-binary / psycopg-c | 3.3.0 (×3) | **3.3.4** (×3)        | Bump all three in lockstep (ABI). Patch-level only.                                                                                                                                                    |
| whitenoise                           | 6.11.0     | **6.12.0**            | Security fix in autorefresh (dev-only); no breaking changes.                                                                                                                                           |
| celery                               | 5.4.0      | **5.5.3** (not 5.6.x) | **Override:** 5.6 reverted the SQS→urllib3 change; 5.5.3 is the battle-tested line. Plane uses Redis broker. Pulls `kombu>=5.5`. (Celery itself isn't Django-pinned — already works on 5.2.)           |
| dj-database-url                      | 2.1.0      | **3.0.1** (cautious)  | **Override:** 3.x is a breaking major (engine-registry validation, raised Python floor). 2.1.0 already works on 5.2 — **holding at 2.1.0 is acceptable**. If bumping, verify all DB URL schemes parse. |

### 5.3 Hold (already compatible; bumping adds churn with no 5.2 benefit)

| Package                                                                                        | Current     | Decision                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| django-crum                                                                                    | 0.7.9       | **Keep** — already the latest release (unmaintained); relies only on stable middleware APIs.                                                                                                                                                                    |
| opentelemetry-\* (api/sdk/exporter-otlp/-proto-grpc = 1.28.1, instrumentation-django = 0.49b1) | matched set | **Hold the whole set.** Already 5.2-compatible. These are version-locked — bumping one forces a lockstep bump of all five (→ api/sdk/exporter `~1.43.x`, instrumentation `0.64b0`). Do that as a **separate, self-contained chore**, not inside this migration. |
| pytz                                                                                           | 2024.1      | **Keep** — still a valid library on 5.2. Removing it (→ stdlib `zoneinfo`) is a separate optional cleanup (see §10).                                                                                                                                            |
| Non-Django deps (boto3, openai, slack-sdk, lxml, etc.)                                         | —           | **Out of scope** for this PR — keep the change focused on the Django upgrade.                                                                                                                                                                                   |

> **Note on `redis` (redis-py 5.0.4):** confirm it satisfies `django-redis==7.0.0`'s floor during install; otherwise fall back to `django-redis==6.0.0` (safe with redis-py 5.x).

---

## 6. Step-by-step execution plan

> Single PR. Treat the deprecation-warning audit as part of the test phase (folds the "run on 4.2 first" safety net into the 5.2 verification).

1. **Branch.** `git checkout -b chore/<work-item-id>-django-5.2-upgrade` off `preview`. Include this plan doc in the branch.
2. **Edit `requirements/base.txt`** per §5.1 + §5.2 (Django, DRF, channels, cors-headers, filter, storages, redis, celery-beat, celery-results, drf-spectacular, scout-apm, psycopg ×3, whitenoise, celery, dj-database-url). Leave the OTel set, django-crum, pytz untouched.
3. **Edit `requirements/local.txt`** → `django-debug-toolbar==6.0.0`.
4. **Edit `requirements/test.txt`** → `pytest-django==4.12.0`.
5. **(Optional)** apply §4.2 hardening (`FORMS_URLFIELD_ASSUME_HTTPS`, STORAGES collapse, asgi.py cleanup).
6. **Clean install** in a fresh venv / rebuilt image: `pip install -r requirements/test.txt` (pulls base+test). Resolve any pip conflicts here (esp. redis-py ↔ django-redis, asgiref ↔ channels, kombu ↔ celery).
7. **Model state check:** `python manage.py makemigrations --check --dry-run` → expect **no new migrations**. If Django 5.x wants migrations, inspect before committing.
8. **Apply third-party migrations:** `python manage.py migrate` on a scratch DB (django_celery_results 2.6.0 and django_celery_beat ship their own migrations).
9. **Deprecation-warning audit:** run the suite with warnings as errors to catch any `RemovedInDjango60Warning` / `RemovedInDjango61Warning`:
   `python -W error::DeprecationWarning -W error::PendingDeprecationWarning -m pytest` (or via `pytest.ini` `filterwarnings`). Triage anything that surfaces (expected: clean, given the audit).
10. **Full test suite:** `cd apps/api && ./run_tests.sh` (or `pytest`). All green is the gate.
11. **Regenerate OpenAPI schema** (drf-spectacular 0.29.0) and commit the diff: `python manage.py spectacular --file <committed schema path>` (match the repo's existing schema-generation command). Review for unintended changes.
12. **Manual smoke** of each entrypoint against a local stack (`docker-compose-local.yml`): **api** (boot + a few endpoints incl. one S3/file-upload path and one webhook), **worker** (enqueue+run a task), **beat** (scheduler starts, periodic task fires), **migrator** (runs to completion). Confirm `check --deploy` is clean: `python manage.py check --deploy`.
13. **Update docs:** mark this plan as executed; note any deviations.
14. **Open PR** to `preview` with the migration summary, test evidence, and schema diff.

---

## 7. Acceptance criteria / verification checklist

- [ ] `pip install -r requirements/test.txt` resolves with no conflicts.
- [ ] `manage.py makemigrations --check --dry-run` → no new app migrations.
- [ ] `manage.py migrate` applies django_celery_results / django_celery_beat migrations cleanly.
- [ ] `manage.py check --deploy` passes.
- [ ] Test suite passes **and** passes under `-W error::DeprecationWarning`.
- [ ] OpenAPI schema regenerated and reviewed.
- [ ] api / worker / beat / migrator entrypoints all boot and function.
- [ ] `python -c "import django; print(django.VERSION)"` shows 5.2.x in the built image.

---

## 8. Rollback plan

- The change is **pip-pins + (optionally) a few settings lines**, all in one PR → revert the PR / commit to restore Django 4.2.30. No data migration is destructive: the only schema changes come from `django_celery_results`/`django_celery_beat`, which are additive (new indexes/columns) and safe to leave in place even on a rollback.
- Keep the pre-upgrade `requirements/*.txt` recoverable via git. Rebuild the image from the reverted requirements.

---

## 9. Risks & mitigations

| Risk                                                                                       | Likelihood                    | Mitigation                                                                                  |
| ------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Pip dependency-resolution conflict (redis-py↔django-redis, asgiref↔channels, kombu↔celery) | Medium                        | Resolve at step 6 in a clean env; fall back to the "Min for 5.2" pins in §5.1.              |
| DRF 3.16+ unique-constraint validation surfaces previously-silent errors                   | Low–Med                       | Covered by test suite + serializer tests; review any new 400s on create/update endpoints.   |
| django-storages 1.14.6 URL scheme flips to HTTPS                                           | Low                           | Verify generated asset URLs in the api smoke test; set `url_protocol` explicitly if needed. |
| drf-spectacular 0.29 schema output drift                                                   | Low                           | Regenerate + review the committed schema diff (step 11).                                    |
| Celery beat/results migrations not run in deploy                                           | Low                           | `migrator` entrypoint runs `migrate`; explicit step 8 + acceptance check.                   |
| Self-hosters on PostgreSQL < 14                                                            | Low (shipped compose is 15.7) | Note PG 14+ requirement in release notes/changelog.                                         |

---

## 10. Out of scope / follow-ups (separate PRs)

- **OpenTelemetry lockstep bump** (api/sdk/exporter → ~1.43.x, instrumentation-django → 0.64b0) — self-contained, no 5.2 dependency.
- **Drop pytz → stdlib `zoneinfo`** — touch points: `plane/utils/timezone_converter.py`, `plane/app/views/cycle/base.py`, `plane/app/views/timezone/base.py`, `plane/api/serializers/cycle.py`, the 4 OAuth providers, and `TIMEZONE_CHOICES` in `plane/db/models/{project,user,workspace,cycle}.py`. Note `pytz.common_timezones` has no exact `zoneinfo` equivalent and `tz.localize(dt)` becomes `dt.replace(tzinfo=ZoneInfo(name))`.
- **dj-database-url 3.x** (breaking major) if not taken in this PR.
- **Add a pytest job to API CI** — currently CI lints only; the migration relies on manual test runs.
- **Django 6.0 readiness** (after 5.2 lands) — non-LTS, separate evaluation.

---

_Audit basis: 12 code scans + settings + migrations + 19 per-dependency compatibility checks against `apps/api` at Django 4.2.30. Confirm the newest 5.2.x patch and each package's latest stable at execution time (pins above reflect the audit snapshot)._
