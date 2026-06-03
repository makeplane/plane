# Help Center GLOBAL-PIVOT — Adversarial Code Review (READ-ONLY)

Date: 2026-05-30. Scope: working tree vs HEAD on `apps/` + 2 new license files.
Reviewer stance: skeptical / red-team. Live-DB tests deferred (no local Postgres).

## Verdict

**Safe to commit: YES** — no BLOCKING defects found. All 8 verification axes pass.
A few NON-BLOCKING items need a follow-up decision (category-delete article orphaning,
search query efficiency, `<input>` in sanitizer allowlist). None are merge gates.

---

## Verification matrix (all PASS)

| #   | Concern                 | Result | Evidence                                                                                                                                    |
| --- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Draft leak (read layer) | PASS   | article.py:34 `status="published"` + :35 titled-translation join; category gated is_active + published-article count                        |
| 2   | Authz (God Mode write)  | PASS   | All 5 license endpoints inherit `permission_classes=[InstanceAdminPermission]` (license base.py:43); no override; app layer routes GET-only |
| 3   | XSS / json exposure     | PASS   | `style` stripped from every tag (serializer:22); script/iframe excluded; reader never gets `description_json`                               |
| 4   | Global correctness      | PASS   | workspace FK gone from models + migration 0178; `UniqueConstraint(["slug"])`; sort_order instance-wide                                      |
| 5   | Cross-layer reuse       | PASS   | license→app→db one-way (no cycle); admin serializer correct; soft-deleted translations excluded                                             |
| 6   | Publish invariant       | PASS   | `has_titled_translation` fresh query (base.py:108-113), not prefetch                                                                        |
| 7   | FE contract             | PASS   | service paths match app URLs; web fully read-only; `description_json` dropped from types                                                    |
| 8   | Anything broken         | PASS   | no orphan imports/exports; helper signatures consistent; migration chain clean                                                              |

---

## BLOCKING

None.

---

## NON-BLOCKING

### N1 — Category soft-delete orphans (not hides) its published articles `[Medium]`

`license/api/views/help_center.py:69-72` `category.delete()` → soft delete →
`soft_delete_related_objects` (Celery). `HelpArticle.category` is `on_delete=SET_NULL`
(help_center.py:113), so the task runs `articles.update(category=None)`
(deletion_task.py:60-61). Effect: deleting a category does NOT remove its published
articles from the reader — they stay published and become **uncategorized**
(`category=null`). Two side effects:

- Reader still lists those articles (default article list has no category-active filter;
  article.py:32-43 only filters by `?category=` when passed).
- Behavior depends on the Celery worker running; until the task fires, articles still
  point at the now-hidden category id, and `category__translations` prefetch resolves a
  soft-deleted category (its translations also get CASCADE-soft-deleted by the same task).
  Decide intended UX: (a) cascade-hide articles when a category is deleted, or (b) keep them
  visible as uncategorized (current). If (b), that is acceptable — just confirm it is intended,
  since a God-Mode admin clicking "delete category" likely expects the articles to disappear too.
  Needs a live-DB test in Phase 8 (delete category → assert reader article visibility + category null).

### N2 — Search list query: per-row N translation scans in serializer `[Low]`

`HelpArticleListSerializer._matched` (serializer:101-110) and `_resolved` iterate
`obj.translations.all()` per article. Prefetch (article.py:37) covers it (no N+1 at the DB),
but with `?search=` over ~all published articles the JOIN + `distinct()` + in-Python folded
substring scan is O(articles × locales). Fine at help-center scale (tens–hundreds of articles);
revisit only if the corpus grows large. No action now.

### N3 — `<input>` / `label` retained in help sanitizer tag allowlist `[Low]`

`sanitize_help_html` passes `tags=ALLOWED_TAGS` which includes `input`, `label`,
`mention-component`, `image-component` (content_validator.py:72-78). For broadcast help content
authored only by God Mode, `<input>`/`<label>` are pointless and slightly odd to allow. nh3 still
strips event handlers and restricts `input` attrs to `{type, checked}`, so this is not exploitable —
but a help-specific tag allowlist (drop `input`, `label`, `mention-component`) would tighten the
surface. Optional hardening, not required.

### N4 — `HelpArticleListSerializer` exposes `status` to readers `[Low/informational]`

`status` is in the list serializer fields (serializer:91). Reader queryset only returns
`published` rows, so the value is always `"published"` — no draft state leaks. Harmless but
redundant on the read path; could drop it from the reader serializer (keep on admin) for a
cleaner contract. No security impact.

### N5 — God-Mode detail endpoints rely on base `ObjectDoesNotExist`→404 `[informational]`

`InstanceHelp*DetailEndpoint.get/patch/delete` call `.get(pk=pk)` with no try/except; license
`BaseAPIView.handle_exception` maps `ObjectDoesNotExist`→404 (license base.py:79-83). Correct,
just implicit. Patch translation endpoint (:174) same pattern. Fine.

---

## Concurrency / race notes (no fix needed, document)

- **Slug uniqueness race**: `generate_unique_slug` (base.py:48-58) is check-then-insert with no
  lock. Two concurrent God-Mode creates with the same title could both compute `slug-2` and one
  INSERT hits the DB unique constraint → license `handle_exception` maps `IntegrityError`→400
  "payload is not valid". Self-healing (DB constraint is the real guard), low-frequency
  (single-admin authoring). Acceptable.
- **Publish invariant TOCTOU**: `has_titled_translation` re-queries fresh before publish
  (good), but a concurrent translation soft-delete between the check and `article.save()` could
  publish a title-less article. Practically impossible (one admin). Acceptable.

---

## Unresolved questions

1. **N1 UX decision (BLOCKING for Phase-8 test, not for commit):** When a God-Mode admin deletes
   a category, should its published articles disappear from the reader, or remain as uncategorized?
   Current code = remain visible + uncategorized (via SET_NULL Celery task). Confirm intended.
2. Confirm prod has exactly ONE `Instance` row — `InstanceAdminPermission` uses
   `Instance.objects.first()` (instance.py:17); multi-row or zero-row instance silently denies all
   God-Mode writes. (Carried from design report Q5.)
3. Live-DB items for Phase 8: (a) global unique-slug constraint applies on empty tables (greenfield
   — should pass); (b) reader excludes drafts + title-less + soft-deleted-translation articles;
   (c) category-delete article-visibility behavior (N1); (d) search accent-folding end-to-end.
