# Help Center: Workspace-Scoped → Instance-Global Redesign

**Synthesis of 6 scout findings + spot-verification against live code.** Date: 2026-05-30.
Goal: ONE shared user guide, readable by any authenticated user in any of ~100 workspaces; authoring = God Mode / Instance Admin only; content multilingual VI/EN/KO.

---

## 1. Target Architecture (decided, with evidence)

### 1.1 Three-layer split (DECIDED)

| Concern                                  | Layer                                                | Path                                                     | Permission                | Evidence                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **READ** (any auth user, all workspaces) | `plane/app/` (v0, session auth)                      | `/api/help/categories/`, `/api/help/articles/` (NO slug) | `IsAuthenticated`         | BaseAPIView default `permission_classes=[IsAuthenticated]` — verified pattern in `plane/license/api/permissions/instance.py:12-18` (write gate) |
| **WRITE** (authoring)                    | `plane/license/api/` (God Mode)                      | `/api/instances/help/...`                                | `InstanceAdminPermission` | `InstanceAdminPermission` checks `Instance.objects.first()` + `InstanceAdmin role>=15` (`instance.py:14-18`)                                    |
| **AUTHORING UI**                         | `apps/admin/` (English-only, NO i18n, Propel Dialog) | `/help-center/` route                                    | (instance-admin session)  | admin conventions auto-loaded                                                                                                                   |

**Why READ stays in `plane/app/` (not license):** license `BaseAPIView` defaults to `InstanceAdminPermission`; exposing a reader there would require overriding to `IsAuthenticated` and fighting the layer's intent. `plane/app/` is the canonical home for "frontend-called, session-auth, no OpenAPI" endpoints (per `plane-backend-architecture.md`). Scouts `global-read-any-user` and `impact-on-committed-code` both land here; `license-godmode-write` and `instance-global-model` left it open — resolved in favor of app layer.

### 1.2 Models: drop workspace FK (DECIDED — keep in `plane/db`, do NOT move to license app)

- Current: `HelpCategory.workspace FK` + `UniqueConstraint(["workspace","slug"])` (`help_center.py:39-41,53-56`); `HelpArticle.workspace FK` + same constraint + index `["workspace","status"]` (`help_center.py:111-113,128-135`).
- Target: **remove workspace FK** from `HelpCategory` + `HelpArticle`; constraint → `UniqueConstraint(["slug"])` (still NOT conditioned on `deleted_at` — preserves stable 404 for old deep links, current intent at `help_center.py:50-52`); index → `["status"]`.
- **Keep models in `plane/db/models/help_center.py`** (NOT move to `plane/license/models/`). Rationale: scout `instance-global-model` proposes the move, but it forces a destructive table relocation + re-import churn across `db/models/__init__.py`, serializers, both API layers. License app holds Instance/InstanceConfiguration only. Dropping the FK achieves "instance-global" with a far smaller blast radius (YAGNI/KISS). Models stay `BaseModel`; both app (read) and license (write) layers import from `plane.db.models`. **FLAG for user — see Open Q1.**
- Translation models **unchanged** (`HelpCategoryTranslation`, `HelpArticleTranslation` — cascade FK to parent, no workspace ref: `help_center.py:79-102,155-197`).
- `save()` sort_order sequencing currently filters `workspace=self.workspace` (`help_center.py:71,147-149`) → MUST become instance-wide (`HelpCategory.objects.aggregate(Max(sort_order))` with no workspace filter; article variant keeps `category=` filter only).

### 1.3 Asset strategy (DECIDED — reuse existing pipeline, see §4)

Global article images via existing `FileAsset` with `workspace_id=NULL` + new `entity_type`, served by existing public `StaticFileAssetEndpoint`.

---

## 2. Per-Phase Rewrite Plan

### P1 — Models + Migration

1. Edit `plane/db/models/help_center.py`: remove both `workspace` FKs; change both unique constraints to `["slug"]`; change article index to `["status"]`; rewrite both `save()` sort_order aggregates to drop workspace filter.
2. New migration `plane/db/migrations/0179_help_center_instance_global.py`: `RemoveConstraint` (×2 old) → `RemoveField(workspace)` (×2) → `RemoveIndex`/`AddIndex` → `AddConstraint(slug)` (×2). Migration filename = domain slug only (no phase number, per code-comment rules).
3. **Pre-migration data audit (BLOCKING):** `SELECT slug, COUNT(*) FROM help_categories WHERE deleted_at IS NULL GROUP BY slug HAVING COUNT(*)>1;` (and `help_articles`). Any cross-workspace slug collision breaks the global unique constraint → must rename or pre-merge. **Open Q2.**

### P2 — Split Read / Write API

1. **Read (refactor in place, `plane/app/`):** new `HelpCategoryViewSet`/`HelpArticleViewSet` (or refactor existing) that `get_queryset()` drops `workspace__slug` filter, queries global pool. Keep member-visibility rules verbatim (published-only, has-titled-translation, active-category-with-published-article — `category.py:44-54`, `article.py:63-75`). Permission → `IsAuthenticated` (remove `WorkspaceUserPermission`). Strip all write actions (`create`/`partial_update`/`destroy`/`translation`) from app layer.
2. **Write (new, `plane/license/api/`):** create `plane/license/api/views/help_center.py` — `InstanceHelpCategoryEndpoint`/`...DetailEndpoint`/`InstanceHelpArticleEndpoint`/`...DetailEndpoint`/translation endpoint. Inherit license `BaseAPIView` (`permission_classes=[InstanceAdminPermission]` by default). **Reuse helpers verbatim** from `plane/app/views/help_center/base.py:58-94` (`upsert_article_translation(s)`, `upsert_category_translations`, `generate_unique_slug`, `pick_slug_source`, `sanitize_help_html`) — but note: `generate_unique_slug(model, workspace, title)` takes a workspace param and filters `all_objects.filter(workspace=...)` (`base.py:28-38`) → must add a workspace-less variant for global slug collision check. Same for the inline collision check at `article.py:110-112`.
3. URLs: new `plane/license/api/urls/help_center.py`, `include()` it in `plane/license/urls.py` (alongside line ~37+ existing instance routes). Refactor `plane/app/urls/help_center.py` to global read paths (no slug). Register views/serializers in respective `__init__.py`.

### P4 — Frontend services / store (web)

1. `apps/web/ce/services/help-center.service.ts`: change read methods to slug-less `/api/help/categories/`, `/api/help/articles/`, `/api/help/articles/{id}/` (drop `workspaceSlug` arg). **Delete** all write methods (`createCategory`/`updateCategory`/`deleteCategory`/`createArticle`/`updateArticle`/`deleteArticle`/`upsertTranslation` — `help-center.service.ts:51-114`).
2. Stores `apps/web/ce/store/help-center/{help-center,category,article}.store.ts`: drop write actions → read-only. `HelpCenterStore` shape unchanged (`help-center.store.ts:13-29`); update fetch call sites that pass slug.
3. Hook `apps/web/ce/hooks/store/use-help-center.ts` unchanged structurally; consumers lose write methods (intended).
4. Types `apps/web/ce/types/help-center.ts` — no workspace field today, no change.

### P6 — Authoring UI MOVES to `apps/admin` (NOTE)

- Authoring is **removed from `apps/web`** entirely and **rebuilt in `apps/admin`** (English-only, NO i18n, Propel Dialog `onOpenChange`, inputs `bg-layer-2`).
- New: admin store `instance-help-center.store.ts` (mirror `instance-task-category.store.ts` pattern) + register in admin `root.store.ts` + hook `use-instance-help-center.tsx` + page `app/(all)/(dashboard)/help-center/page.tsx` + Propel Dialog modals with VI/EN/KO translation tabs + sidebar entry in `hooks/use-sidebar-menu/core.ts`.
- New admin service (in `packages/services`) hitting `/api/instances/help/...`.
- Rich-text editor: web uses `RichTextEditor` from `@/components/editor/rich-text`; admin needs equivalent — **verify availability (Open Q3).**

---

## 3. Exact Per-File Change List (committed code)

**Modify:**

- `apps/api/plane/db/models/help_center.py` — drop 2× workspace FK; constraints→`["slug"]`; index→`["status"]`; 2× `save()` sort_order instance-wide.
- `apps/api/plane/app/views/help_center/category.py` — global queryset, `IsAuthenticated`, delete write actions.
- `apps/api/plane/app/views/help_center/article.py` — global queryset, `IsAuthenticated`, delete write actions; keep member-visibility filter.
- `apps/api/plane/app/views/help_center/base.py` — add workspace-less slug-uniqueness variant (helpers otherwise reusable as-is).
- `apps/api/plane/app/urls/help_center.py` — read-only global paths (no `<slug>`).
- `apps/api/plane/app/serializers/help_center.py` — no change needed for reads (already workspace-agnostic; `is_admin` context drives `description_json` exposure).
- `apps/web/ce/services/help-center.service.ts` — slug-less reads, delete writes.
- `apps/web/ce/store/help-center/{help-center,category,article}.store.ts` — read-only.
- `apps/web/ce/hooks/store/use-help-center.ts` — consumers lose writes.

**Create:**

- `apps/api/plane/db/migrations/0179_help_center_instance_global.py`
- `apps/api/plane/license/api/views/help_center.py` (+ register in `license/api/views/__init__.py`)
- `apps/api/plane/license/api/urls/help_center.py` (+ `include()` in `license/urls.py`)
- `apps/api/plane/license/api/serializers/help_center.py` _(optional — can reuse app serializers; create only if admin needs different fields)_
- `apps/admin/store/instance-help-center.store.ts`, `apps/admin/hooks/store/use-instance-help-center.tsx`, `apps/admin/app/(all)/(dashboard)/help-center/page.tsx` + modal components, sidebar entry in `apps/admin/hooks/use-sidebar-menu/core.ts`
- new admin help service in `packages/services`

**Delete:** any `apps/web` authoring routes/components for help center (authoring is admin-only now).

---

## 4. Asset Strategy Decision (DECIDED)

Reuse existing asset pipeline — ~50 LOC, no schema change beyond an enum addition:

1. Add `HELP_ARTICLE_CONTENT = "HELP_ARTICLE_CONTENT"` to `FileAsset.EntityTypeContext` (`asset.py:33-43`). Enum-only migration.
2. Add `HELP_ARTICLE_CONTENT` branch to `asset_url` property returning `/api/assets/v2/static/{id}/` (`asset.py:79-100` — has NO default case, returns None otherwise).
3. Add `HELP_ARTICLE_CONTENT` to the `StaticFileAssetEndpoint` allowlist (`v2.py:449-454`) — else GET 400s. Endpoint is `AllowAny` + workspace-agnostic (`v2.py:432-465`) — exactly the global-read shape needed.
4. New God Mode upload endpoint (license layer, `InstanceAdminPermission`) creating `FileAsset(workspace_id=None, entity_type=HELP_ARTICLE_CONTENT, entity_identifier=<article_id>)`; `get_upload_path` already handles null workspace → `user-{uuid}-{filename}` (`asset.py:17-20`). Validate article exists before create (avoid orphans).
5. Editor embeds `<img src="/api/assets/v2/static/{id}/">` in `description_html`; sanitize src on write.

Rejected alternative: per-workspace replication of images — violates "ONE shared guide", multiplies storage ×100.

---

## 5. Open Questions

- **Q1 (architecture, recommend proceed):** Keep models in `plane/db` (FK-drop only) vs relocate to `plane/license/models`. Recommendation: **keep in `plane/db`** (smaller blast radius, KISS). License relocation only justified if instance-models locality is a hard convention — not evidenced as mandatory. Confirm before P1.
- **Q2 (BLOCKING, data):** Cross-workspace slug collisions. Global `UniqueConstraint(["slug"])` will fail to apply if two workspaces share a category/article slug. Must run the audit SQL on prod-like data and decide rename/merge policy BEFORE writing the migration. Cannot finalize P1 migration without this answer.
- **Q3 (FE):** Does `apps/admin` have a usable rich-text editor for `description_html` (VI/EN/KO tabs)? Web uses `@/components/editor/rich-text`; need to confirm `@plane/editor` exports a Tiptap component consumable in admin, else custom integration adds scope to P6.
- **Q4 (UX/compat):** Old workspace-scoped deep links `/api/workspaces/{slug}/help/...` will 404 after cutover. Any external bookmarks/docs referencing them? Decide 301-redirect vs hard 404.
- **Q5 (singleton):** `InstanceAdminPermission` and any reader relying on `Instance.objects.first()` assume exactly ONE Instance row in prod. Confirm prod has a single Instance configured (else permission silently returns False).
