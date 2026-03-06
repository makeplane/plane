---
title: "Email Template Management in God Mode"
description: "Admin panel for viewing, editing, previewing, and test-sending email templates"
status: pending
priority: P2
effort: 16h
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

| #   | Phase               | Effort | Status  | File                                            |
| --- | ------------------- | ------ | ------- | ----------------------------------------------- |
| 1   | Backend Model & API | 5h     | pending | [phase-01](./phase-01-backend-model-and-api.md) |
| 2   | Template Registry   | 3h     | pending | [phase-02](./phase-02-template-registry.md)     |
| 3   | God Mode Frontend   | 6h     | pending | [phase-03](./phase-03-godmode-frontend.md)      |
| 4   | Migration & Seeding | 2h     | pending | [phase-04](./phase-04-migration-and-seeding.md) |

## Dependencies

- Phase 2 depends on Phase 1 (model must exist)
- Phase 3 depends on Phase 1 (API endpoints needed)
- Phase 4 depends on Phase 1 + 2 (model + registry)
- Phases 3 and 4 can run in parallel after Phase 2

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
