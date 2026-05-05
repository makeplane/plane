---
title: "Email Template Management in God Mode"
description: "Admin panel for viewing, editing, previewing, and test-sending email templates"
status: pending
priority: P2
effort: 19h
branch: develop
tags: [god-mode, email, admin, templates]
created: 2026-03-06
---

# Email Template Management

## Overview

Enable instance admins to customize email templates via God Mode UI. Templates stored in DB with file-based fallback. Supports preview with sample data and test email sending.

## Architecture

- **Backend**: New `EmailTemplate` model in `plane/license/models/`, API views in `plane/license/api/views/`, template registry utility
- **Frontend**: New route `/email-templates` in admin app, MobX store, service layer, editor + preview components
- **Override strategy**: DB template takes priority; if absent, `render_to_string` uses file template (current behavior)
- **No CE pattern needed**: Admin app is unified (no ce/ override)

## Phases

<!-- Updated: Validation Session 12 - Phase 1+2 merged to resolve circular dependency -->

| #   | Phase                         | Effort | Status  | Files                                                                                         |
| --- | ----------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------- |
| 1   | Backend Model, Registry & API | 8h     | pending | [phase-01](./phase-01-backend-model-and-api.md) + [phase-02](./phase-02-template-registry.md) |
| 2   | God Mode Frontend             | 6h     | pending | [phase-03](./phase-03-godmode-frontend.md)                                                    |
| 3   | Migration & Seeding           | 2h     | pending | [phase-04](./phase-04-migration-and-seeding.md)                                               |

## Dependencies

- Phase 1: Self-contained (model + registry + API + bgtask migration + backend tests)
- Phase 2 depends on Phase 1 (API endpoints needed)
- Phase 3 depends on Phase 1 (model + registry)
- Phases 2 and 3 can run in parallel after Phase 1

## Key Decisions

1. Separate `EmailTemplate` model (not InstanceConfiguration) — cleaner separation of concerns
2. Template slug as unique identifier — maps to file path (e.g., `auth/magic_signin`)
3. Keep Django template syntax — admins edit HTML with `{{ variable }}` placeholders
4. Fallback chain: DB override -> file template (zero breaking changes)
5. Monaco Editor for HTML editing (syntax highlight, autocomplete)
6. UUID-based URL routing (not slug in URL)
7. Subject line editable per template (DB override with hardcoded fallback)
8. Seeding reads raw file content (preserves {{ }} placeholders)

## Validation Log

### Session 1 — 2026-03-06

**Trigger:** Initial plan creation validation
**Questions asked:** 5

#### Questions & Answers

1. **[Editor]** Plan dùng plain textarea cho HTML editor. Chấp nhận hay muốn syntax highlighting?
   - Options: Plain textarea | CodeMirror | Monaco Editor
   - **Answer:** Monaco Editor
   - **Custom input:** "Hiện tại frontend editor trong Work Item có dùng được không? Hay dùng Monaco cho xịn xò? Hỗ trợ preview luôn?"
   - **Rationale:** Tiptap (Work Item editor) không phù hợp cho raw HTML. Monaco có sẵn trong deps (@monaco-editor/react), hỗ trợ HTML syntax + Django template highlighting

2. **[Seeding]** Phase 4 seeding dùng render_to_string sẽ mất {{ variable }} placeholders
   - Options: Read raw file content | Render with sample data | Skip seeding
   - **Answer:** Read raw file content
   - **Rationale:** Admin cần thấy đúng template gốc với {{ }} placeholders để edit

3. **[Slug Format]** Template slugs chứa `/` gây vấn đề URL encoding
   - Options: Replace / with -- | URL-encode %2F | Use UUID in URL
   - **Answer:** Use UUID in URL
   - **Rationale:** Clean URLs, no encoding issues, consistent with Plane's UUID pattern

4. **[Subject]** Admin có edit được subject line không?
   - Options: Yes, edit subject | No, keep hardcoded
   - **Answer:** Yes, edit subject
   - **Rationale:** Subject cũng quan trọng như body, cần customizable

5. **[Editor Confirm]** Monaco vs CodeMirror vs plain textarea
   - Options: Monaco (Recommended) | CodeMirror | Plain textarea
   - **Answer:** Monaco Editor
   - **Rationale:** @monaco-editor/react already in project deps, VS Code-like UX

#### Confirmed Decisions

- **Editor**: Monaco Editor — already in deps, best DX
- **Seeding**: Read raw file content — preserves placeholders
- **URL routing**: UUID-based — clean, consistent with Plane patterns
- **Subject editing**: Yes — stored in DB with hardcoded fallback
- **Effort adjustment**: +3h for Monaco → total ~19h

#### Action Items

- [ ] Phase 1: Add subject field to EmailTemplate model (already planned)
- [ ] Phase 2: Update render_email_template to support subject override
- [ ] Phase 3: Replace textarea with Monaco Editor component (+3h)
- [ ] Phase 3: Use UUID routing instead of slug in URL
- [ ] Phase 4: Use raw file read instead of render_to_string

#### Impact on Phases

- Phase 1: No change needed (subject field already in model)
- Phase 2: Update render utility to also return subject override; seeding uses raw file read
- Phase 3: Monaco Editor instead of textarea (+3h); UUID routing instead of slug
- Phase 4: Use open() to read file content instead of render_to_string

### Session 2 — 2026-03-06

**Trigger:** Re-validation — inconsistencies from Session 1 + unaddressed decisions
**Questions asked:** 5

#### Questions & Answers

1. **[API Routing]** Phase 1 API vẫn dùng `<slug>` trong URL paths nhưng Session 1 đã quyết định UUID routing. Backend API dùng slug hay UUID làm lookup field?
   - Options: Slug trong API, UUID trong frontend (Recommended) | UUID cho cả API và frontend | Slug cho cả API và frontend
   - **Answer:** UUID cho cả API và frontend
   - **Rationale:** Nhất quán UUID everywhere. API: `email-templates/<uuid>/`. Query DB by UUID (id field from BaseModel).

2. **[Versioning]** Admin edit template, save, rồi edit lại bị hỏng → mất version trước đó. Có cần version history/rollback không?
   - Options: Không cần, chỉ reset to default (Recommended) | Lưu 1 previous version | Full version history
   - **Answer:** Không cần, chỉ reset to default
   - **Rationale:** MVP scope. Reset to file default đủ dùng. Admin tự backup nếu cần.

3. **[Validation]** Khi admin save template, có nên validate rằng tất cả required variables vẫn còn trong HTML không?
   - Options: Warning nhưng cho save (Recommended) | Chỉ validate syntax | Block save nếu thiếu variable
   - **Answer:** Warning nhưng cho save
   - **Custom input:** "Bỏ variable có gây lỗi không?" — Django Template render empty string cho missing vars, không crash nhưng email thiếu data.
   - **Rationale:** Warning giúp admin biết thiếu variable nhưng không block workflow. An toàn + flexible.

4. **[Navigation]** Link Email Templates đặt ở đâu trong God Mode sidebar?
   - Options: Dưới Email settings hiện tại (Recommended) | Top-level sidebar item riêng | Tab trong Email page hiện tại
   - **Answer:** Dưới Email settings hiện tại
   - **Rationale:** Gần với email config. Admin tìm email-related features ở cùng 1 chỗ.

#### Confirmed Decisions

- **API routing**: UUID cho cả backend API và frontend routes
- **Versioning**: Không cần, chỉ reset to file default (MVP)
- **Variable validation**: Warning on save (non-blocking)
- **Navigation**: Dưới Email settings trong sidebar

#### Action Items

- [ ] Phase 1: Đổi API URLs từ `<slug>` sang `<uuid:pk>` (dùng id từ BaseModel)
- [ ] Phase 1: Thêm variable validation logic (warning, non-blocking) trong update endpoint
- [ ] Phase 3: Đặt link dưới Email settings trong sidebar
- [ ] Phase 3: Hiện warning UI khi thiếu variables

#### Impact on Phases

- Phase 1: API URLs dùng `<uuid:pk>` thay vì `<slug>`. Update endpoint trả warning nếu thiếu required variables.
- Phase 3: Sidebar nav đặt dưới Email settings. Editor hiện warning khi thiếu variables trước khi save.

### Session 3 — 2026-03-06

**Trigger:** Re-validation — inconsistencies in Phase 3/4 code examples + unaddressed decisions
**Questions asked:** 4

#### Questions & Answers

1. **[Inconsistency]** Phase 3 service/routes vẫn dùng `slug` làm parameter (getTemplate(slug), [slug]/page.tsx) mặc dù Session 2 đã quyết UUID everywhere. Confirm xử lý thế nào?
   - Options: Đổi hết sang UUID (Recommended) | Giữ slug ở frontend route | Đã biết, sẽ fix khi implement
   - **Answer:** Đổi hết sang UUID
   - **Rationale:** Nhất quán UUID across service, store, route folders. Service params đổi slug→id, route folder [slug]→[id].

2. **[Bug in Plan]** Phase 4 code example vẫn dùng `render_to_string(meta['file_path'], {})` nhưng Session 1 đã confirm dùng raw file read. render_to_string với empty context sẽ KHÔNG giữ được {{ variable }} — Django render empty string. Đây là bug trong plan. Confirm fix?
   - Options: Fix: dùng open() đọc raw file (Recommended) | Dùng Django template loader get_template().source
   - **Answer:** Fix: dùng open() đọc raw file
   - **Rationale:** open(template_path).read() giữ nguyên {{ }} placeholders. Cần resolve full path từ Django template dirs.

3. **[Bundle Size]** Monaco Editor bundle size ~2-3MB. Admin app hiện tại có dùng Monaco ở đâu không? Nếu chưa, thêm Monaco sẽ tăng bundle size đáng kể. Chấp nhận?
   - Options: Chấp nhận, lazy load Monaco (Recommended) | Dùng CodeMirror thay thế | Dùng plain textarea + syntax highlight library nhẹ
   - **Answer:** Chấp nhận, lazy load Monaco
   - **Rationale:** Dynamic import Monaco chỉ khi vào editor page. Admin app ít user, bundle size ít quan trọng.

4. **[Scope]** Plan không có CREATE endpoint — chỉ có seeding command và update. Nếu tương lai thêm template mới, admin không tạo được từ UI. Có cần thêm không?
   - Options: Không cần, MVP chỉ override existing (Recommended) | Thêm CREATE endpoint | Chỉ cần clone/duplicate existing
   - **Answer:** Không cần, MVP chỉ override existing
   - **Rationale:** 12 templates cố định từ registry. Custom templates = future scope. YAGNI.

#### Confirmed Decisions

- **Frontend params**: UUID everywhere — service, store, routes all use `id` not `slug`
- **Seeding file read**: open() raw file read — NOT render_to_string
- **Monaco**: Lazy loaded via dynamic import — accepted bundle size tradeoff
- **Scope**: No CREATE endpoint — MVP only overrides existing registry templates

#### Action Items

- [ ] Phase 3: Đổi tất cả service methods từ slug param sang id (UUID)
- [ ] Phase 3: Route folder đổi từ [slug] sang [id]
- [ ] Phase 3: Monaco Editor dùng dynamic import (React.lazy hoặc next/dynamic)
- [ ] Phase 4: Đổi code example từ render_to_string sang open() raw file read

#### Impact on Phases

- Phase 3: Service methods đổi slug→id, route [slug]→[id], Monaco lazy loaded
- Phase 4: Seeding code dùng open() thay render_to_string, cần resolve Django template dir path

### Session 4 — 2026-03-06

**Trigger:** Final validation — remaining inconsistencies + undecided UX/API patterns
**Questions asked:** 3

#### Questions & Answers

1. **[API Return]** render_email_template() hiện tại chỉ return str (HTML). Nhưng subject cũng cần override từ DB. Hàm nên return gì?
   - Options: Return tuple (subject, html) (Recommended) | Return dict {subject, html} | Tách riêng get_email_subject()
   - **Answer:** Return tuple (subject, html)
   - **Rationale:** Đơn giản, Pythonic. Caller unpack (subject, html) = render_email_template(). Subject empty string nếu không có override → bgtask dùng hardcoded fallback.

2. **[Preview UX]** Preview trong editor page nên hoạt động thế nào?
   - Options: Button-triggered (Recommended) | Auto-preview on save | Live auto-preview (debounced)
   - **Answer:** Button-triggered
   - **Rationale:** Tiết kiệm API calls. Admin chủ động click Preview khi sẵn sàng. KISS principle.

3. **[Plan Cleanup]** Phase 4 step 2 và Phase 3 step 6 vẫn còn nội dung cũ (render_to_string, encoded-slug). Fix trong plan trước khi implement?
   - Options: Fix ngay trong validation (Recommended) | Không cần, đã có validation log
   - **Answer:** Fix ngay trong validation
   - **Rationale:** Tránh implementer bị confuse bởi text cũ trong phase files.

#### Confirmed Decisions

- **render_email_template return**: tuple (subject, html) — simple, Pythonic
- **Preview UX**: Button-triggered — KISS, tiết kiệm API calls
- **Plan cleanup**: Fixed inconsistencies directly in phase files

#### Action Items

- [x] Phase 2: Đổi render_email_template signature → return tuple[str, str]
- [x] Phase 3: Fix step 6 text từ encoded-slug → UUID
- [x] Phase 4: Fix step 2 text từ render_to_string → open() raw file read

#### Impact on Phases

- Phase 2: render_email_template return type đổi từ str → tuple[str, str]. Callers (bgtasks) cần unpack.
- Phase 3: Preview pane confirmed button-triggered (không cần debounce/auto logic).
- Phase 4: Text inconsistency fixed (no code change needed).

### Session 5 — 2026-03-06

**Trigger:** Final pre-implementation validation — dependency check + remaining inconsistencies
**Questions asked:** 4

#### Questions & Answers

1. **[Subject Logic]** render_email_template() trả tuple (subject, html). Khi bgtask caller nhận subject rỗng (không có DB override), nên xử lý thế nào với subject hardcoded hiện tại?
   - Options: subject = db_subject or hardcoded (Recommended) | Luôn trả subject từ registry | Tách riêng get_email_subject()
   - **Answer:** subject = db_subject or hardcoded
   - **Rationale:** Mỗi bgtask unpack tuple, dùng `db_subject or hardcoded_subject`. Minimal change, backward compatible.

2. **[Plan Cleanup]** Phase 3 step 8 vẫn ghi 'Textarea for HTML content' nhưng đã quyết Monaco. Và step 12 bị duplicate numbering. Fix text inconsistencies này ngay?
   - Options: Fix ngay (Recommended) | Không cần, validation log đủ rõ
   - **Answer:** Fix ngay
   - **Rationale:** Tránh confuse khi implement. Phase 3 step 8 → Monaco, step 12 duplicate → renumber to 13.

3. **[Monaco Deps]** @monaco-editor/react có thật sự trong deps hiện tại không?
   - Options: Kiểm tra deps rồi quyết định (Recommended) | Chắc chắn có rồi | Chưa có, cần thêm
   - **Answer:** Kiểm tra deps rồi quyết định
   - **Rationale:** Checked — KHÔNG có trong project deps. Cần install.

4. **[Monaco Install]** @monaco-editor/react CHƯA có trong deps. Bundle ~2-3MB (lazy loaded). Admin app ít user nên acceptable. Confirm thêm Monaco hay đổi sang alternative nhẹ hơn?
   - Options: Thêm @monaco-editor/react (Recommended) | Dùng CodeMirror thay thế | Dùng react-simple-code-editor
   - **Answer:** Thêm @monaco-editor/react
   - **Rationale:** Best DX cho HTML editing. Lazy loaded nên không ảnh hưởng initial bundle. Admin app ít user.

#### Confirmed Decisions

- **Subject handling**: `db_subject or hardcoded` pattern trong mỗi bgtask — minimal change
- **Monaco**: Install @monaco-editor/react vào admin app — chưa có trong deps
- **Plan cleanup**: Fixed step 8 text (Textarea → Monaco) + step 12 duplicate numbering

#### Action Items

- [ ] Phase 2: Bgtask callers unpack tuple và dùng `subject = db_subject or hardcoded_subject`
- [ ] Phase 3: Install @monaco-editor/react vào admin app package.json
- [x] Phase 3: Fix step 8 text (Textarea → Monaco Editor)
- [x] Phase 3: Fix step 12 duplicate numbering → renumber to 13

#### Impact on Phases

- Phase 2: Bgtask migration pattern thêm 1 dòng: `subject, html = render_email_template(...)` rồi `subject = subject or "Hardcoded Subject"`
- Phase 3: Thêm `pnpm add @monaco-editor/react` vào admin app trước khi implement editor component

### Session 6 — 2026-03-06

**Trigger:** Final pre-implementation validation — migration strategy, i18n, data fetching, testing
**Questions asked:** 4

#### Questions & Answers

1. **[Migration]** Phase 2 đổi render_email_template() return type từ str → tuple(subject, html). Đây là breaking change cho ~10 bgtask callers. Migrate strategy nào?
   - Options: Big bang — đổi hết 1 lần (Recommended) | Wrapper tạm thời | kwargs flag
   - **Answer:** Big bang — đổi hết 1 lần
   - **Rationale:** Đổi tất cả callers trong cùng 1 commit. Clean, no tech debt. PR lớn nhưng changes đơn giản (~2-3 lines/file).

2. **[i18n]** Admin app có dùng i18n/translations không? Các UI strings trong email-templates feature cần translate không?
   - Options: Không cần i18n (Recommended) | Có, dùng i18n | Hardcode English, thêm i18n sau
   - **Answer:** Không cần i18n
   - **Rationale:** Admin app internal, tiếng Anh đủ. Skip translation overhead.

3. **[Data Fetch]** Phase 3 ghi useSWR cho data fetching. Admin app hiện tại dùng pattern nào?
   - Options: Follow existing admin pattern (Recommended) | useSWR | useEffect + store action
   - **Answer:** Follow existing admin pattern
   - **Rationale:** Check existing admin pages rồi dùng đúng pattern. Consistency > preference.

4. **[Testing]** Test coverage cho feature này ở mức nào?
   - Options: Backend API tests only (Recommended) | Backend + Frontend unit tests | No tests — MVP manual QA
   - **Answer:** Backend API tests only
   - **Rationale:** Test endpoints + render utility. Frontend manual test đủ cho MVP admin feature.

#### Confirmed Decisions

- **Migration**: Big bang — đổi hết callers trong 1 commit (Phase 2)
- **i18n**: Không cần — hardcode English
- **Data fetching**: Follow existing admin app pattern (check code trước khi implement)
- **Testing**: Backend API tests only — endpoints + render utility

#### Action Items

- [ ] Phase 2: Đổi tất cả bgtask callers trong cùng 1 commit (big bang)
- [ ] Phase 3: Check admin app data fetching pattern trước khi implement (không assume useSWR)
- [ ] Phase 3: Hardcode English strings, không dùng i18n
- [ ] Add backend tests: API endpoints + render_email_template utility

#### Impact on Phases

- Phase 2: All bgtask callers updated in single commit — big bang migration
- Phase 3: Data fetching follows existing admin pattern (verify before implementing). No i18n needed.
- Testing: Add backend API tests to Phase 1 or as separate testing step

### Session 7 — 2026-03-06

**Trigger:** Final validation — remaining inconsistencies in registry/store/list logic
**Questions asked:** 3

#### Questions & Answers

1. **[Registry]** Phase 2 registry structure không có field `default_subject`, nhưng Phase 4 seeding code reference `meta.get("default_subject", "")`. Thêm `default_subject` vào registry hay để bgtask callers tự giữ hardcoded subject?
   - Options: Thêm default_subject vào registry (Recommended) | Không cần, bgtask giữ hardcoded | Thêm nhưng optional
   - **Answer:** Thêm default_subject vào registry
   - **Rationale:** Single source of truth. Seeding + bgtask fallback đều dùng từ registry. Bgtask pattern: `subject = db_subject or TEMPLATE_REGISTRY[slug]["default_subject"]`

2. **[Store API]** Phase 3 store design có computed `getTemplateBySlug` nhưng tất cả routing/service đã đổi sang UUID. Giữ computed này hay bỏ?
   - Options: Bỏ, chỉ cần getTemplateById (Recommended) | Giữ cả hai | Đổi thành getTemplateById
   - **Answer:** Bỏ, chỉ cần getTemplateById
   - **Rationale:** UUID everywhere. Không cần lookup by slug ở frontend. YAGNI.

3. **[List Logic]** Phase 1 list endpoint: khi DB trống (chưa seed), list trả gì? Phase 2 có `get_all_templates()` helper nhưng logic chưa rõ — tạo virtual records từ registry hay chỉ trả registry metadata?
   - Options: Tạo virtual records từ registry (Recommended) | Trả registry metadata riêng | Auto-seed on first list call
   - **Answer:** Tạo virtual records từ registry
   - **Rationale:** List luôn trả 12 items. Merge registry metadata + DB data nếu có. Frontend không cần biết template có trong DB hay không.

#### Confirmed Decisions

- **default_subject**: Thêm vào registry — single source of truth cho subject fallback
- **Store computed**: Bỏ getTemplateBySlug, chỉ cần getTemplateById — YAGNI
- **List endpoint**: Virtual records từ registry, merge DB data — luôn 12 items

#### Action Items

- [ ] Phase 2: Thêm `default_subject` field vào mỗi registry entry
- [ ] Phase 2: Bgtask callers dùng `subject = db_subject or TEMPLATE_REGISTRY[slug]["default_subject"]`
- [ ] Phase 2: `get_all_templates()` tạo virtual records từ registry, merge DB overrides
- [ ] Phase 3: Bỏ `getTemplateBySlug` computed, chỉ giữ `getTemplateById`

#### Impact on Phases

- Phase 2: Registry entries thêm `default_subject` field. `get_all_templates()` returns virtual records (always 12 items). Bgtask callers dùng registry cho subject fallback.
- Phase 3: Store bỏ `getTemplateBySlug` computed. List page luôn nhận đủ 12 items từ API.

### Session 8 — 2026-03-06

**Trigger:** Final pre-implementation validation — API design, security, test-send pattern
**Questions asked:** 3

#### Questions & Answers

1. **[API Design]** Phase 1 serializer có `has_override` và `variables` computed fields, nhưng Phase 2 `get_all_templates()` tạo virtual records đã bao gồm data này. List endpoint dùng serializer hay trả trực tiếp output từ helper?
   - Options: Helper output trực tiếp (Recommended) | Serializer cho tất cả | Hai serializer riêng
   - **Answer:** Helper output trực tiếp
   - **Rationale:** get_all_templates() trả dict đầy đủ, view trả JSON trực tiếp. Serializer chỉ dùng cho detail/update endpoint. Tránh duplicate logic giữa serializer và helper.

2. **[Security]** Preview render server-side dùng Django Template engine với DB content. Admin có thể inject template tags truy cập settings/context ({{ settings.SECRET_KEY }}). Cần restrict rendering context không?
   - Options: Restrict context (Recommended) | Không cần, trust admin | Whitelist template tags
   - **Answer:** Restrict context
   - **Rationale:** Dùng Context() thay RequestContext(). Chỉ truyền sample_data vào, không có settings/request/processors. Defense in depth — dù admin trusted, vẫn nên giới hạn surface area.

3. **[Test Send]** Test-send email: gửi trực tiếp từ API view (synchronous) hay qua Celery task (async)?
   - Options: Synchronous từ view (Recommended) | Qua Celery task | Sync với timeout
   - **Answer:** Qua Celery task
   - **Rationale:** Async như production flow. Consistent với cách email gửi thật. View trả 202 Accepted, frontend show "Test email queued" message.

#### Confirmed Decisions

- **List endpoint**: Helper output trực tiếp — serializer chỉ cho detail/update
- **Rendering security**: Restrict context — Context() only, no settings/processors
- **Test-send**: Qua Celery task — async, consistent với production flow

#### Action Items

- [ ] Phase 1: List view dùng get_all_templates() trả JSON trực tiếp, không qua serializer
- [ ] Phase 1: Serializer chỉ dùng cho retrieve/update endpoints
- [ ] Phase 2: render_email_template() dùng Context() (không RequestContext), chỉ truyền context dict
- [ ] Phase 1: Test-send endpoint dispatch Celery task, trả 202 Accepted
- [ ] Phase 3: Test-send UI show "Email queued" thay vì "Email sent"

#### Impact on Phases

- Phase 1: List view bypass serializer, dùng helper output. Test-send endpoint dispatch Celery task (trả 202). Serializer chỉ cho detail/update.
- Phase 2: render_email_template() enforce Context() only — no RequestContext, no context processors. Đã đúng trong code example hiện tại.
- Phase 3: Test-send UX thay đổi — show "queued" message thay "sent". Không cần polling cho MVP, toast đủ.

### Session 9 — 2026-03-06

**Trigger:** Final validation — critical virtual record UUID bug + reset logic + subject fallback
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** CRITICAL BUG: get_all_templates() tạo virtual records cho templates chưa có trong DB. Nhưng virtual records KHÔNG có UUID. Frontend route dùng email-templates/:id (UUID). Admin click template chưa seed → không có UUID để navigate/retrieve/preview. Giải quyết thế nào?
   - Options: Auto-create on list (Recommended) | Slug-based API, UUID frontend | Lazy create on first click
   - **Answer:** Auto-create on list
   - **Rationale:** List endpoint tự tạo DB records cho tất cả registry templates nếu chưa có. Luôn có UUID. 1 lần duy nhất. Đơn giản nhất, đảm bảo UUID everywhere hoạt động.

2. **[Reset Logic]** Phase 1 DELETE endpoint (reset to default) xóa DB record. Nhưng nếu list endpoint auto-creates records, DELETE xóa xong → list lại tạo lại. Reset nên hoạt động thế nào?
   - Options: Clear content, keep record (Recommended) | Delete + re-create on next list | Soft delete flag
   - **Answer:** Clear content, keep record
   - **Rationale:** Reset = set html_content=NULL/empty + subject=empty. Record vẫn tồn tại (có UUID). has_override=False khi content rỗng. UUID ổn định, không bị đổi.

3. **[Subject Flow]** Phase 2 render_email_template() fallback khi không có DB override: trả subject rỗng. Nhưng registry đã có default_subject. Fallback nên trả registry default_subject hay rỗng (để bgtask tự handle)?
   - Options: Registry default_subject (Recommended) | Empty string, bgtask handles
   - **Answer:** Registry default_subject
   - **Rationale:** render_email_template() fallback trả (registry['default_subject'], html). Bgtask không cần hardcode subject nữa. Single source of truth. DRY.

#### Confirmed Decisions

- **Virtual records**: Auto-create DB records on list — luôn có UUID, 1 lần duy nhất
- **Reset**: Clear content (set empty), keep record — UUID ổn định
- **Subject fallback**: Registry default_subject — single source of truth, bgtask không cần hardcode

#### Action Items

- [ ] Phase 1: List endpoint gọi `ensure_all_templates()` tạo missing DB records từ registry
- [ ] Phase 1: DELETE endpoint → đổi thành PUT reset: clear html_content + subject, giữ record
- [ ] Phase 2: `ensure_all_templates()` helper: bulk_create missing templates từ registry
- [ ] Phase 2: render_email_template() trả registry default_subject khi fallback (không trả empty)
- [ ] Phase 2: Bgtask callers dùng subject trực tiếp từ render_email_template(), bỏ hardcoded fallback

#### Impact on Phases

- Phase 1: List view gọi ensure_all_templates() trước khi query. DELETE endpoint đổi thành reset (clear content, keep record). has_override computed từ html_content non-empty.
- Phase 2: Thêm ensure_all_templates() helper. render_email_template() trả registry default_subject trong fallback path. Bgtask callers đơn giản hóa — không cần `or hardcoded`.
- Phase 3: Reset button gọi PUT (clear) thay vì DELETE. UI logic has_override dựa trên html_content non-empty.
- Phase 4: Seeding command vẫn hữu ích cho pre-populate content, nhưng less critical vì list auto-creates records.

### Session 10 — 2026-03-06

**Trigger:** Final validation — model field constraints, test-send Celery task gap, text inconsistencies
**Questions asked:** 3

#### Questions & Answers

1. **[Model Field]** Phase 1 model định nghĩa `html_content = TextField()` KHÔNG có `blank=True`. Nhưng Session 9 quyết định auto-create records với empty content. Django sẽ reject empty string cho TextField thiếu blank=True trong form validation. Sửa model thế nào?
   - Options: TextField(blank=True, default='') (Recommended) | TextField(null=True, blank=True) | Giữ nguyên TextField()
   - **Answer:** TextField(blank=True, default='')
   - **Rationale:** Cho phép empty string, auto-create records hoạt động đúng. has_override check content non-empty.

2. **[Test Send]** Session 8 quyết định test-send dispatch Celery task. Nhưng không phase nào specify tạo Celery task mới hay reuse existing. Test-send Celery task xử lý thế nào?
   - Options: Tạo task mới trong bgtasks (Recommended) | Gửi sync từ view, bỏ Celery | Reuse existing test email task
   - **Answer:** Tạo task mới trong bgtasks
   - **Rationale:** send_test_email_template_task.py — nhận template_id + email, render + send. Clean separation.

3. **[Plan Cleanup]** plan.md header vẫn ghi effort: 16h nhưng Session 1 đã adjust +3h (Monaco) → ~19h. Phase 2 có duplicate step numbering (hai step 4). Phase 3 step 2 vẫn ghi 'reset (DELETE)' dù Session 9 đổi thành POST. Fix tất cả text inconsistencies này?
   - Options: Fix tất cả ngay (Recommended) | Không cần, validation log đủ rõ
   - **Answer:** Fix tất cả ngay
   - **Rationale:** Tránh confuse khi implement. Effort→19h, renumber Phase 2, fix Phase 3 step 2 text.

#### Confirmed Decisions

- **Model field**: html_content = TextField(blank=True, default="") — supports auto-create empty records
- **Test-send**: New Celery task `send_test_email_template_task.py` — clean separation
- **Plan cleanup**: Fixed effort (19h), Phase 2 step numbering, Phase 3 reset text

#### Action Items

- [x] Phase 1: Model html_content → TextField(blank=True, default="")
- [x] Phase 1: Add send_test_email_template_task.py to related files + todo
- [x] plan.md: effort 16h → 19h
- [x] Phase 2: Renumber duplicate step 4 → step 5, step 5 → step 6
- [x] Phase 3: Step 2 reset (DELETE) → reset (POST, clear content)

#### Impact on Phases

- Phase 1: Model field updated, new Celery task file added to scope
- Phase 2: Step numbering fixed (no code change)
- Phase 3: Reset method text corrected (no code change)

### Session 11 — 2026-03-06

**Trigger:** Final validation — task ownership gaps, performance pattern, Monaco setup
**Questions asked:** 3

#### Questions & Answers

1. **[Task Owner]** Test-send Celery task (send_test_email_template_task.py) is listed in Phase 1 'Create' files but no phase details its implementation. Which phase should own implementing this task?
   - Options: Phase 1 — alongside API view (Recommended) | Phase 2 — alongside bgtask migration | Split — stub in Phase 1, flesh out in Phase 2
   - **Answer:** Phase 1 — alongside API view
   - **Rationale:** Task tightly coupled with test-send endpoint. Implement together in Phase 1.

2. **[Performance]** ensure_all_templates() runs on EVERY list request (creates missing DB records). For 12 templates this is fine, but the pattern does a query + conditional bulk_create each time. Acceptable for admin-only endpoint?
   - Options: Acceptable, admin-only (Recommended) | Cache check with flag | Move to startup/migration only
   - **Answer:** Cache check with flag
   - **Rationale:** Set module-level flag after first successful ensure. Skip DB check on subsequent calls within same process. Resets on process restart (acceptable).

3. **[Monaco Setup]** Admin app uses Turborepo + pnpm workspace. Installing @monaco-editor/react — should it go to admin app's package.json or root? And does the admin app bundler support dynamic imports for lazy loading Monaco?
   - Options: Admin package.json + verify bundler (Recommended) | Root package.json | Defer — check admin bundler first
   - **Answer:** Admin package.json + verify bundler
   - **Rationale:** Install in apps/admin/package.json. Verify bundler config supports dynamic import before implementing editor component.

#### Confirmed Decisions

- **Test-send task**: Phase 1 owns full implementation — alongside API view
- **ensure_all_templates()**: Cache with module-level flag — skip after first call per process
- **Monaco install**: apps/admin/package.json — verify bundler supports dynamic import

#### Action Items

- [ ] Phase 1: Add implementation details for send_test_email_template_task (render template + send email)
- [ ] Phase 2: Add module-level `_templates_ensured = False` flag to ensure_all_templates(), skip if already done
- [ ] Phase 3: Install @monaco-editor/react in apps/admin/package.json. Verify bundler before implementing.

#### Impact on Phases

- Phase 1: Test-send Celery task fully implemented here (not Phase 2). Task renders template via render_email_template() + sends via existing email util.
- Phase 2: ensure_all_templates() cached with process-level flag. First list call creates records, subsequent calls skip.
- Phase 3: Monaco installed in admin app specifically. Verify bundler config in implementation step.

### Session 12 — 2026-03-06

**Trigger:** Final validation — circular dependency, test ownership, Celery task detail gap
**Questions asked:** 3

#### Questions & Answers

1. **[Dependencies]** Phase 1 list view gọi ensure_all_templates() và get_all_templates() từ Phase 2, nhưng Phase 2 depends on Phase 1 (model). Circular dependency này xử lý thế nào khi implement?
   - Options: Merge Phase 1+2 thành 1 phase (Recommended) | Phase 1 basic → Phase 2 update view | Giữ nguyên, implement tuần tự
   - **Answer:** Merge Phase 1+2 thành 1 phase
   - **Rationale:** Model + registry + API trong cùng 1 phase. Đơn giản, không circular dependency. Registry utilities cần thiết cho API view hoạt động đúng.

2. **[Testing]** Backend API tests đã confirm nhưng chưa assign vào phase nào. Tests nên nằm ở đâu?
   - Options: Thêm vào cuối mỗi phase tương ứng (Recommended) | Phase riêng (Phase 5: Testing) | Không cần test file, manual QA đủ
   - **Answer:** Thêm vào cuối mỗi phase tương ứng
   - **Rationale:** Phase 1: test endpoints + render utility. Phase 2: frontend manual. Tested immediately after implementation.

3. **[Celery Task]** Phase 1 có send_test_email_template_task.py trong 'Create' files nhưng Implementation Steps thiếu chi tiết. Task cần gì cụ thể?
   - Options: Thêm step chi tiết vào Phase 1 (Recommended) | Defer to Phase 2 | Đủ detail rồi, todo list đã ghi
   - **Answer:** Thêm step chi tiết vào Phase 1
   - **Rationale:** Task tightly coupled with test-send endpoint. Cần rõ: nhận template_id + email, gọi render_email_template(), gửi qua existing email util.

#### Confirmed Decisions

- **Phase merge**: Phase 1 + Phase 2 → single "Backend Model, Registry & API" phase
- **Testing**: Tests inline at end of each phase (backend tests for merged Phase 1+2, manual QA for frontend)
- **Celery task detail**: Added to Phase 1 implementation steps

#### Action Items

- [x] plan.md: Merge Phase 1+2 in phases table, update dependencies
- [x] Phase 2: Added merge note pointing to Phase 1
- [x] Phase 1: Add Celery task implementation step with detail
- [x] Phase 1+2: Add test steps at end of implementation
- [x] Phase 3 (frontend): Note manual QA as test strategy

#### Impact on Phases

- Phase 1+2: Merged into single implementation unit. Phase 1 file = model + API, Phase 2 file = registry + bgtask migration. Implement sequentially within same phase. Tests at end.
- Phase 3 (frontend): No change, still depends on merged Phase 1+2
- Phase 4 (seeding): No change, still depends on merged Phase 1+2

### Session 13 — 2026-03-06

**Trigger:** Final pre-implementation validation — syntax error handling, override logic, auto-create subject
**Questions asked:** 3

#### Questions & Answers

1. **[Syntax Error]** render_email_template() gặp TemplateSyntaxError khi render DB content (admin save template bị lỗi cú pháp Django). Trong bgtask context, raise error = email không gửi được. Nên fallback về file template hay raise error?
   - Options: Fallback to file template (Recommended) | Raise error, email không gửi | Fallback + notify admin
   - **Answer:** Fallback to file template
   - **Rationale:** Catch TemplateSyntaxError → log warning → dùng file template. Email vẫn gửi an toàn. Preview endpoint riêng vẫn trả error để admin biết template bị lỗi.

2. **[Override Logic]** has_override hiện check html_content non-empty. Admin có thể chỉ edit subject mà không đổi html_content → has_override=False misleading. has_override nên check gì?
   - Options: Check html_content only (Recommended) | Check html_content OR subject differs from default | Separate flags
   - **Answer:** Check html_content only
   - **Rationale:** KISS. Subject-only edit = lightweight, không cần badge. Reset clear cả 2 field. Admin chủ yếu quan tâm content override.

3. **[Auto-Create]** ensure_all_templates() auto-create DB records. Subject field nên set gì khi tạo?
   - Options: Store default_subject (Recommended) | Store empty string
   - **Answer:** Store default_subject
   - **Rationale:** Admin thấy subject thật trong editor. UX tốt hơn. has_override chỉ check html_content nên không bị nhầm là 'overridden'.

#### Confirmed Decisions

- **Syntax error handling**: Fallback to file template in render_email_template() — catch TemplateSyntaxError + log. Preview endpoint returns error separately.
- **has_override**: Check html_content only — KISS, confirmed
- **Auto-create subject**: Store default_subject — better editor UX

#### Action Items

- [ ] Phase 2: render_email_template() thêm try/except TemplateSyntaxError → log warning → fallback to file template
- [ ] Phase 1: Preview endpoint render riêng (không qua render_email_template fallback), trả error nếu syntax lỗi
- [ ] Phase 2: ensure_all_templates() confirm store default_subject (already planned)

#### Impact on Phases

- Phase 2: render_email_template() thêm TemplateSyntaxError catch → fallback to file + log warning. Bgtask callers không bị ảnh hưởng.
- Phase 1: Preview endpoint tự render Template() + Context() riêng, catch TemplateSyntaxError trả 400 error cho admin.
- Phase 2: ensure_all_templates() giữ nguyên — store default_subject (đã planned).

### Session 14 — 2026-03-06

**Trigger:** Final pre-implementation validation — security, retry strategy, file structure clarity
**Questions asked:** 3

#### Questions & Answers

1. **[Security]** Django template tags security: Admin có thể dùng {% load %} để load custom template tags hoặc {% include %} để include file khác. Context() chặn access settings/request, nhưng loaded tags có thể có side effects. Cần restrict allowed template tags không?
   - Options: Không cần restrict (Recommended) | Restrict — whitelist tags only | Dùng Django sandbox template backend
   - **Answer:** Không cần restrict
   - **Rationale:** Admin is trusted. Django template engine đã sandboxed (không exec arbitrary code). {% load %} chỉ load registered tags. Defense in depth từ Context() đủ rồi.

2. **[Retry]** Celery task retry: send_test_email_template_task gặp SMTP error. Task nên retry tự động hay fail immediately?
   - Options: Fail immediately, log error (Recommended) | Retry 2 lần với exponential backoff | Follow existing email task retry pattern
   - **Answer:** Fail immediately, log error
   - **Rationale:** Test email = manual action. Admin click lại nếu cần. Không cần auto-retry cho test send.

3. **[File structure]** Phase files sau merge: Phase 1 + Phase 2 merged thành 1 unit nhưng vẫn 2 file riêng. Implementer nên follow file nào trước?
   - Options: Giữ 2 file, Phase 1 trước rồi Phase 2 (Recommended) | Merge content vào Phase 1, archive Phase 2 | Không cần clarify, validation log đủ rõ
   - **Answer:** Giữ 2 file, Phase 1 trước rồi Phase 2
   - **Rationale:** Phase 1 = model + API + endpoints. Phase 2 = registry + bgtask migration. Tuần tự trong cùng 1 phase. File riêng dễ track progress.

#### Confirmed Decisions

- **Template tag security**: No restriction — admin trusted, Django engine sandboxed, Context() defense in depth
- **Test-send retry**: Fail immediately + log — manual action, no auto-retry
- **Phase file structure**: Keep separate files, implement Phase 1 → Phase 2 sequentially

#### Action Items

- [ ] Phase 1: send_test_email_template_task — no retry, catch exception + log error + return
- No phase file changes needed — all decisions align with existing plan content

#### Impact on Phases

- Phase 1: Test-send Celery task: no autoretry_for, catch SMTP errors → log + return (no retry)
- No other phase changes needed

### Session 15 — 2026-03-06

**Trigger:** Final implementation-readiness validation — PR strategy, branch naming, admin app pattern verification
**Questions asked:** 3

#### Questions & Answers

1. **[PR Strategy]** PR strategy: Phase 1+2 (backend), Phase 3 (frontend), Phase 4 (seeding) — tách thành 3 PRs riêng hay gộp 1 PR lớn?
   - Options: 3 PRs riêng (Recommended) | 1 PR gộp tất cả | 2 PRs: backend + frontend
   - **Answer:** 3 PRs riêng
   - **Rationale:** Review dễ hơn, rollback granular. Phase 1+2 → PR1, Phase 3 → PR2, Phase 4 → PR3.

2. **[Branch]** Branch naming cho feature này?
   - Options: duonglx/feat/email-template-management (Recommended) | Tách branch per phase | Tên khác
   - **Answer:** duonglx/feat/email-template-management
   - **Rationale:** Single feature branch, tách PRs bằng commits.

3. **[Pre-scout]** Trước khi implement, cần scout admin app patterns (data fetching, store, service, routing) để tránh rework?
   - Options: Scout trước (Recommended) | Không cần, implement rồi adjust
   - **Answer:** Scout trước
   - **Rationale:** Session 6 nói "follow existing pattern" nhưng chưa verify. Scout trước tránh assume sai, ghi findings vào plan.

#### Confirmed Decisions

- **PRs**: 3 PRs riêng → develop (Phase 1+2, Phase 3, Phase 4)
- **Branch**: `duonglx/feat/email-template-management`
- **Pre-scout**: Scout admin app patterns trước khi implement frontend (Phase 3)

#### Action Items

- [ ] Create branch `duonglx/feat/email-template-management` from `develop`
- [ ] Phase 3: Scout admin app patterns (data fetching, store, service, routing) trước khi implement
- [ ] Submit 3 separate PRs: backend → frontend → seeding

#### Impact on Phases

- Phase 3: Add pre-implementation step — scout admin app existing patterns (store, service, data fetching, routing). Document findings before implementing.

### Session 16 — 2026-03-06

**Trigger:** Final gap analysis — editor UX on no-override, reset subject handling, is_active field scope
**Questions asked:** 3

#### Questions & Answers

1. **[Editor UX]** Retrieve API khi template không có override (html_content rỗng): trả gì cho editor? Admin mở template vừa reset/auto-create → editor hiện gì?
   - Options: Trả file content trong response (Recommended) | Trả empty, frontend hiện placeholder | Trả empty + thêm field default_content
   - **Answer:** Trả file content trong response
   - **Rationale:** API populate html_content từ file template khi DB rỗng. Editor luôn hiện nội dung. Admin thấy default template và edit từ đó. Tốt hơn cho UX — không cần extra step "Load default".

2. **[Reset UX]** Reset endpoint clear subject = empty string. Nhưng auto-create lưu default_subject. Sau reset, editor hiện subject rỗng (không phải default). Reset có nên re-set subject về default_subject không?
   - Options: Reset re-set subject = default_subject (Recommended) | Reset clear tất cả, subject = empty
   - **Answer:** Reset re-set subject = default_subject
   - **Rationale:** Consistent với auto-create behavior. Editor luôn hiện subject có giá trị. Admin không bị confuse bởi empty subject.

3. **[YAGNI]** Model có field is_active (BooleanField default=True) + render_email_template check is_active=True. Nhưng không phase nào có UI toggle active/inactive. Giữ field hay bỏ?
   - Options: Giữ field, không làm UI (Recommended) | Bỏ field, YAGNI | Giữ field + thêm toggle UI
   - **Answer:** Giữ field + thêm toggle UI
   - **Rationale:** Feature complete. Admin có thể disable template từ UI (email gửi fallback về file template). Toggle button trong editor page.

#### Confirmed Decisions

- **Retrieve no-override**: API populate file content trong response — editor luôn hiện nội dung
- **Reset subject**: Re-set về default_subject — consistent UX
- **is_active**: Giữ field + thêm toggle UI trong editor page

#### Action Items

- [ ] Phase 1: Retrieve endpoint populate html_content từ file template khi DB content rỗng (read-through)
- [ ] Phase 1: Reset endpoint set subject = registry default_subject (not empty)
- [ ] Phase 3: Thêm is_active toggle button trong editor page
- [ ] Phase 2: render_email_template() khi is_active=False → fallback to file template (existing logic handles this)

#### Impact on Phases

- Phase 1: Retrieve endpoint thêm logic: nếu html_content rỗng, populate từ file template trong response (không save vào DB). Reset endpoint set subject = registry default_subject thay vì empty.
- Phase 2: render_email_template() đã check is_active=True — khi disabled, fallback file template tự động. Không cần thay đổi.
- Phase 3: Thêm toggle button cho is_active trong editor page. Toggle calls PUT update với is_active field. Show visual indicator khi template disabled.

### Session 17 — 2026-03-06

**Trigger:** Final gap analysis — bgtask file enumeration, test-send error visibility, list page status indicator
**Questions asked:** 3

#### Questions & Answers

1. **[Bgtask Files]** Phase 2 Modify section chỉ list 5 bgtask files + '(+ remaining bgtask files)'. Registry có 12 templates nhưng không enumerate hết files cần sửa. Implementer có thể miss files. Cần enumerate tất cả trước khi implement không?
   - Options: Enumerate tất cả trước (Recommended) | Grep khi implement | Chỉ update 5 files listed
   - **Answer:** Enumerate tất cả trước
   - **Rationale:** Grepped codebase — found 11 files (10 bgtasks + 1 management command), 12 render_to_string calls. Full list prevents missed files during big bang migration.

2. **[Test-send UX]** Test-send dispatch Celery task, trả 202 Accepted. Nếu SMTP fail, task log error nhưng admin không nhận feedback nào trên UI. Acceptable cho MVP?
   - Options: Acceptable, MVP (Recommended) | Sync send thay Celery | Celery + polling status
   - **Answer:** Acceptable, MVP
   - **Rationale:** Admin check inbox. Nếu không nhận được → click lại. Log đủ cho debug. KISS.

3. **[List Status]** Session 16 thêm is_active toggle trong editor page. Nhưng list page chỉ show has_override badge, không show disabled status. Admin không biết template nào bị disabled mà không click vào từng cái. Thêm indicator trên list?
   - Options: Thêm indicator trên list (Recommended) | Không cần, editor đủ | Dim/grey out disabled rows
   - **Answer:** Thêm indicator trên list
   - **Rationale:** Admin thấy ngay template nào disabled. Badge/icon bên cạnh has_override badge. Quick visual scan.

#### Confirmed Decisions

- **Bgtask enumeration**: Full list of 11 files enumerated in Phase 2 — prevents missed migrations
- **Test-send error**: Acceptable for MVP — admin checks inbox, logs for debug
- **List status**: Disabled indicator on list page — badge/icon for quick visual scan

#### Action Items

- [x] Phase 2: Replace vague "(+ remaining)" with complete enumerated file list (11 files total)
- [ ] Phase 3: Add disabled badge/icon on list page next to has_override badge

#### Impact on Phases

- Phase 2: Modify section updated with complete file list (10 bgtasks + 1 management command)
- Phase 3: List page template card/row shows disabled indicator when is_active=False

### Session 18 — 2026-03-06

**Trigger:** Final gap analysis — preview data, concurrency, disable behavior
**Questions asked:** 5

#### Questions & Answers

1. **[Preview Data]** Preview endpoint hiện chỉ dùng sample_data cố định từ registry. Admin có thể muốn preview với data thật. Preview có nên accept custom variable values từ UI không?
   - Options: Sample data only (Recommended) | Custom data input | Sample data + editable JSON
   - **Answer:** Sample data only
   - **Rationale:** KISS. Admin test bằng test-send cho real data. Không thêm UI complexity.

2. **[Concurrency]** Hai admin cùng edit 1 template → last write wins. Cần optimistic locking không?
   - Options: Không cần, MVP (Recommended) | Optimistic locking | Warning UI only
   - **Answer:** Không cần, MVP
   - **Rationale:** Team nhỏ (4 người), probability thấp. YAGNI. Last write wins.

3. **[Disable Flow]** Template disabled (is_active=False): fallback về file template hay block email send?
   - Options: Fallback file template (Recommended) | Block email send | Fallback + warning log
   - **Answer:** Block email send
   - **Rationale:** Admin chủ động disable = không gửi email loại đó. Full control over email types.

4. **[Block API]** render_email_template() return gì khi template disabled để bgtask caller biết không gửi?
   - Options: Return None + bgtask skip (Recommended) | Raise DisabledTemplateError | Return (None, None) tuple
   - **Answer:** Return None + bgtask skip
   - **Rationale:** render_email_template() return None khi disabled. Bgtask check: if result is None → log + return (skip send). ~1 line extra per bgtask.

5. **[Critical Guard]** Disable auth/magic_signin = user không nhận magic link → không login được. Restrict disable cho critical templates?
   - Options: Restrict auth/\* templates (Recommended) | Warning UI, cho disable tất cả | Cho disable tất cả, không restrict
   - **Answer:** Restrict auth/\* templates
   - **Rationale:** Auth templates (magic_signin, forgot_password) không cho disable. Registry đánh dấu critical=True.

#### Confirmed Decisions

- **Preview data**: Sample data only — KISS, no custom input UI
- **Concurrency**: No optimistic locking — MVP, YAGNI
- **Disable behavior**: Block email send (NOT fallback to file template)
- **Block API**: render_email_template() returns None when disabled → bgtask skips send
- **Critical templates**: auth/\* marked critical=True in registry → cannot be disabled from UI/API

#### Action Items

- [ ] Phase 2: render_email_template() return None when is_active=False (not fallback)
- [ ] Phase 2: Registry add `critical: True` for auth/magic_signin and auth/forgot_password
- [ ] Phase 2: All bgtask callers check for None return → log + skip send
- [ ] Phase 1: Update endpoint reject is_active=False for critical templates (400 error)
- [ ] Phase 3: Disable toggle hidden/disabled for critical templates in editor UI
- [ ] Phase 3: Show warning text explaining disable = no email sent

#### Impact on Phases

- Phase 1: Update endpoint validates critical templates cannot be disabled (check registry critical flag → 400 error)
- Phase 2: render_email_template() returns None when is_active=False (breaking change from fallback behavior). Registry adds `critical: True` to auth templates. All bgtask callers add None check (~1 line each).
- Phase 3: Editor toggle disabled for critical templates. Warning text on disable toggle explaining emails won't be sent.

### Session 19 — 2026-03-06

**Trigger:** Pre-implementation verification — migration path, auto-escape, bgtask side effects, cross-app imports
**Questions asked:** 4

#### Questions & Answers

1. **[Migration]** Migration file listed tại `plane/db/migrations/` nhưng model ở `plane/license/models/`. Django tạo migration per-app. Plane có custom migration routing không?
   - Options: Cần verify trước (Recommended) | Dùng plane/db/migrations/ | Dùng plane/license/migrations/
   - **Answer:** Cần verify trước khi implement
   - **Rationale:** Scouted codebase — `plane/license/migrations/` tồn tại với 6 migrations (0001-0006). Plan reference `plane/db/migrations/` là SAI. Migration phải tạo trong `plane/license/migrations/`.

2. **[Auto-escape]** Django `Template()` auto-escapes by default. DB-rendered templates cần match file template behavior không?
   - Options: Autoescape off (Recommended) | Giữ autoescape on | Verify file templates trước
   - **Answer:** Verify file templates trước
   - **Rationale:** Grepped all email templates — chỉ 1 dùng `|safe` (`issue-updates.html: {{ actor_comment|safe }}`). Không có `{% autoescape off %}`. Default auto-escaping consistent giữa file và DB render. `|safe` filter works in cả 2 modes. Không cần special handling.

3. **[Side effects]** Bgtask early return khi template disabled có skip logic quan trọng không?
   - Options: Cần verify trước (Recommended) | Không cần, early return OK | Restructure skip logic
   - **Answer:** Cần verify trước khi implement
   - **Rationale:** **1 critical case**: `email_notification_task.py` line 292-295 có `EmailNotificationLog.update(sent_at=...)` + `release_lock(lock_id)` SAU `msg.send()`. Early return sẽ skip lock release → potential deadlock. Tất cả 10 bgtasks khác chỉ `msg.send()` → `return`, safe cho early return.

4. **[Import path]** 11 bgtask files import `render_email_template` từ `plane/license/utils/`. Cross-app dependency mới?
   - Options: Verify existing imports trước (Recommended) | Không lo | Move utility
   - **Answer:** Verify existing imports trước
   - **Rationale:** All 11 bgtask files đã import `from plane.license.utils.instance_value import get_email_configuration`. Pattern `bgtasks → license.utils` đã established. Adding `email_template_registry` import là consistent, không circular dependency.

#### Confirmed Decisions

- **Migration path**: `plane/license/migrations/` (NOT `plane/db/migrations/`) — fix plan reference
- **Auto-escape**: Default behavior sufficient — `|safe` filter works in both file and DB render modes
- **Side effects**: `email_notification_task.py` needs special handling — must release lock even when template disabled
- **Import path**: `bgtasks → license.utils` pattern already established — no architecture change needed

#### Action Items

- [x] Phase 1: Fix migration path from `plane/db/migrations/` to `plane/license/migrations/`
- [ ] Phase 2: `email_notification_task.py` — place None check AFTER lock acquisition but before send, ensure `release_lock()` runs in finally block or regardless of template status
- [ ] Phase 2: Document that `|safe` filter in `issue-updates.html` works in both render modes (no code change needed)

#### Impact on Phases

- Phase 1: Migration file path corrected to `apps/api/plane/license/migrations/0007_email_template.py`
- Phase 2: `email_notification_task.py` refactored to ensure lock release runs even when template is disabled — restructure to check template status after lock, release in finally block

### Session 20 — 2026-03-07

**Trigger:** Final gap analysis — concurrency safety, complex template UX, registry evolution
**Questions asked:** 3

#### Questions & Answers

1. **[Concurrency]** ensure_all_templates() sẽ được gọi bởi list endpoint. Trong production với multiple API workers (gunicorn), nhiều workers có thể chạy đồng thời lần đầu → race condition khi bulk_create. Xử lý thế nào?
   - Options: bulk_create(ignore_conflicts=True) (Recommended) | get_or_create per template | Database advisory lock
   - **Answer:** bulk_create(ignore_conflicts=True)
   - **Rationale:** Django built-in duplicate handling. Silent skip on unique constraint violation. Simple, robust. 1 query thay vì 12.

2. **[Complex UX]** issue-updates.html có 40+ Django template tags ({% for %}, {% if %}, |slice, |last...). Admin edit template này trong Monaco rất dễ break. Cần xử lý đặc biệt không?
   - Options: Warning banner on complex templates (Recommended) | Read-only for issue-updates | No special handling
   - **Answer:** Warning banner on complex templates
   - **Rationale:** Show "Advanced template — edit with caution" banner in editor. Admin still has full edit access. Low effort. Registry marks templates as `complex: True`.

3. **[Registry Evo]** Khi future code update thêm/xóa template từ TEMPLATE_REGISTRY, DB records cũ sẽ bị orphan (slug không còn trong registry). render_email_template() sẽ raise ValueError cho unknown slug. Xử lý thế nào?
   - Options: ensure_all_templates() cleans up orphans (Recommended) | Soft-hide orphans | Ignore — handle later
   - **Answer:** ensure_all_templates() cleans up orphans
   - **Rationale:** Delete DB records with slugs not in registry. Auto-sync on every list call. Clean state. Acceptable since registry changes are code changes (developer decision).

#### Confirmed Decisions

- **Concurrency**: bulk_create(ignore_conflicts=True) — race-safe, 1 query
- **Complex templates**: Warning banner in editor — registry `complex: True` flag
- **Registry evolution**: ensure_all_templates() deletes orphaned DB records

#### Action Items

- [ ] Phase 2: ensure_all_templates() use bulk_create(ignore_conflicts=True) for race condition safety
- [ ] Phase 2: ensure_all_templates() delete orphaned DB records (slugs not in registry)
- [ ] Phase 2: Registry add `complex: True` for `notifications/issue_updates` template
- [ ] Phase 3: Editor shows warning banner for complex templates (registry `complex: True`)

#### Impact on Phases

- Phase 2: ensure_all_templates() updated — bulk_create(ignore_conflicts=True) for concurrency safety + delete orphans (EmailTemplate.objects.exclude(slug\_\_in=registry_slugs).delete()). Registry adds `complex: True` to issue-updates entry.
- Phase 3: Editor page shows "Advanced template — edit with caution" warning banner when template has complex=True flag. IEmailTemplate type adds `is_complex: boolean` field.
