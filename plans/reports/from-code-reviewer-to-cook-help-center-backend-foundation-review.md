# Code Review — Help Center Backend Foundation

Reviewer: code-reviewer | Date: 2026-05-29 | Branch: `duonglx/feat/help-center`
Recipient: cook (implementer)

## Scope

Backend foundation for in-app Help Center (SHBVN VI/EN/KO staff help):

- `apps/api/plane/db/models/help_center.py` (198 LOC)
- `apps/api/plane/db/migrations/0178_help_center.py`
- `apps/api/plane/app/serializers/help_center.py` (152 LOC)
- `apps/api/plane/app/views/help_center/{base,article,category}.py` (108/155/94 LOC)
- `apps/api/plane/app/urls/help_center.py` (35 LOC)
- `__init__.py` registrations (models / serializers / views / urls)

Focus: trust boundaries (authz), N+1, search correctness, migration integrity, the deliberate
omission of a btree index on `HelpArticleTranslation.search_text`.

## Overall Assessment

Solid, production-minded foundation. Authz is layered correctly (member read-gate + ADMIN
write-gate), search is accent-insensitive without a DB extension, derived columns are forced
through instance `.save()`, HTML is sanitized with a hardened style-stripped allowlist, and the
member-vs-admin visibility split is enforced in a single `get_queryset()` so list/retrieve/search
all inherit it. All 6 files AST-parse; all `__init__.py` registrations present.

No BLOCKING issues found. A small number of NON-BLOCKING items below.

## Verification done

- Permission chain: `WorkspaceUserPermission` (workspace.py:103-110) gates all access to active
  workspace members; every write method carries `@allow_permission([ROLE.ADMIN], level="WORKSPACE")`
  (base.py:44-51 enforces ADMIN role or 403). Reads split member/admin in `get_queryset`. SOUND.
- Workspace scoping: every queryset filters `workspace__slug=slug`; cross-workspace pk → 404. SOUND.
- N+1: list/detail use `select_related("category").prefetch_related("translations",
"category__translations")`; serializer `_matched`/`_resolved`/`get_available_locales` iterate the
  prefetched `translations.all()`. No per-row queries. `_has_titled_translation` issues one fresh
  `values_list` query per publish (intentional, avoids stale prefetch). SOUND.
- Derived columns: `HelpArticleTranslation.save()` re-derives `description_stripped` + `search_text`;
  upserts go through instance `.save()` (base.py:60,74). No `QuerySet.update()` bypass. SOUND.
- HTML sanitize: `sanitize_help_html` drops `style` from every tag, enforces 10MB cap, fails closed
  on nh3 exception. `description_json` exposed to admins only (serializer:142-146). SOUND.
- Migration 0178: matches model (constraints, indexes, FKs, soft-delete-conditioned unique on
  translations). AST OK. No second migration needed for current model state.
- Registrations: models/serializers/views/urls all wired in respective `__init__.py`. SOUND.

## BLOCKING issues

None.

## NON-BLOCKING issues

1. **`Workspace.objects.get(slug=slug)` can raise `DoesNotExist`** —
   `article.py:76`, `category.py:57`. Permission layer already proved membership so the row exists in
   practice; the 500 is unreachable under normal flow. Low risk. Optional: `get_object_or_404` for
   defense in depth.

2. **Admin PATCH may 404 if a status query param leaks into the request URL** —
   `article.py:56-59`: admin `get_queryset()` applies `status` filter from `request.GET`. On
   `partial_update`/`translation`/`destroy` the refetch `get_queryset().get(pk=pk)` would raise
   `DoesNotExist` (→ 500) if a client sends e.g. `?status=draft` on a write to a published article.
   Normal writes carry no query string, so this is an edge case. Optional: scope the `status` filter
   to `self.action == "list"`, or refetch writes with an unfiltered base queryset.

3. **`sort_order` accepted without type/range validation** — `article.py:117-118`,
   `category.py WRITABLE_FIELDS`. A non-numeric `sort_order` in the PATCH body reaches the
   `FloatField` and raises on `save()` → 500 rather than 400. Low impact (ADMIN-only). Optional:
   coerce/validate to float.

4. **`DoesNotExist` on write refetch surfaces as 500, not 404** — `get_queryset().get(pk=pk)` in
   `partial_update`/`destroy`/`translation` (article.py:101,132,142; category.py:80,92) raises 500 if
   pk is wrong/cross-workspace. DRF would normally map a 404 here. Consider `get_object_or_404` or
   catching `DoesNotExist`. ADMIN-only, low severity.

5. **Possible duplicate translation rows on locale change** — `description_json`/`search_text`
   stored per (article, locale); unique constraint is conditioned on `deleted_at__isnull=True`, so a
   soft-deleted translation + new same-locale row is allowed by design. `_matched`/`resolve_translation`
   iterate `translations.all()` which includes only non-deleted via default manager — confirm
   `BaseModel` default manager filters `deleted_at` (it does in Plane). No action if confirmed.

## Verdict — `search_text` btree index omission (the explicit question)

**Correct call. Do NOT add a plain btree `db_index=True` on `search_text`.**

Reasons (verified against code + Postgres semantics):

- The search is **leading-wildcard `icontains`** (`AccentInsensitiveSearchFilter` → DRF
  `SearchFilter` → `field__icontains` → SQL `ILIKE '%term%'`). A btree index **cannot** serve a
  leading-wildcard `LIKE`/`ILIKE`; Postgres will seq-scan regardless. The index would be dead weight.
- `search_text` is a `TextField` holding **title + full stripped body**. A btree index entry has a
  hard ~2704-byte (1/3 page) limit; long articles would raise
  `index row size ... exceeds btree maximum` on INSERT/UPDATE → a hard write failure. So the plain
  btree is not merely useless, it is **unsafe** here. The model comment (help_center.py:166-168)
  states this correctly.

**Safer way to honor the plan's "db_index on search_text" intent** (the substring-search intent, not
the literal btree): a **GIN trigram index**, which _does_ accelerate `ILIKE '%term%'`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX help_article_tr_search_trgm
  ON help_article_translations USING gin (search_text gin_trgm_ops);
```

In Django: `django.contrib.postgres.indexes.GinIndex(fields=["search_text"], opclasses=["gin_trgm_ops"])`
plus a `TrigramExtension()` migration op. Caveats before adopting:

- Requires the `pg_trgm` extension. The accent-folding comment notes **prod has no `unaccent`**;
  confirm `pg_trgm` is available/allowed under the bank DB posture before relying on it. If extensions
  are disallowed, the current no-index seq-scan is the right pragmatic choice for the expected small
  per-workspace corpus.
- For an internal staff help center with bounded article counts, a seq-scan over a folded text column
  is entirely acceptable. **Recommendation: keep as-is for the foundation; add the GIN trigram index
  only if/when search latency is measured to matter AND `pg_trgm` is permitted in prod.** Track as a
  follow-up, not a blocker.

The implementer's deviation from the plan text is **justified and the code comment documents the
reasoning** — this is the right kind of deviation.

## Positive observations

- Single-source visibility enforcement in `get_queryset` (list+retrieve+search inherit).
- Accent folding applied symmetrically to stored value and query term — correct and extension-free.
- `style` stripped from HTML allowlist to prevent clickjacking on broadcast content — good bank posture.
- `description_json` admin-gated; reader gets sanitized html only.
- Slugs globally unique per workspace incl. soft-deleted, so stale deep links 404 cleanly (deliberate).
- Mixin caches `_is_admin` per request to avoid repeat membership queries.

## Plan TODO status (foundation phase)

Appears complete for the backend foundation: models + migration, serializers, viewsets (CRUD +
per-locale translation upsert), URL wiring, registrations, search, sanitization, authz. Frontend
foundation (types/service/store) scaffolded but out of scope for this backend review.

## Unresolved questions

1. Is `pg_trgm` permitted in the prod bank DB? Determines whether the GIN-trigram follow-up is viable
   (the `unaccent` comment implies extension restrictions).
2. Was the `translation` action intentionally exposed only via `PUT`/`PATCH` (no `DELETE` to remove a
   locale)? If locale removal is a product requirement, it's not yet implemented.
3. Confirm the recommended-but-optional items (1-4 above) are deferred follow-ups vs. fix-now per the
   team's risk bar for an ADMIN-only authoring surface.
