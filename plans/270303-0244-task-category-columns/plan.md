# Task Category Columns — All Work Items View

**Goal:** Add `Main Task Category` and `Sub Task Category` as display columns in the All Work Items spreadsheet view. Reorder the column hierarchy as: Department → Project/Team → Main Task Category → Sub Task Category → Work Items. Add both to the Display Properties toggle button.

## Summary

The backend **already supports** `main_task_category_id` / `sub_task_category_id` on `Issue` model and serializers. The frontend `TBaseIssue` type already includes these fields. What's missing is:

1. **Backend annotation** — Return category **names** alongside IDs in the list serializer.
2. **Frontend store** — A service + store to fetch and cache the category lookup (name by ID).
3. **Display properties** — Register `main_task_category` and `sub_task_category` as toggleable columns.
4. **Spreadsheet columns** — Two new column components and corresponding configuration.
5. **Column order** — Update `SPREADSHEET_PROPERTY_LIST` so the hierarchy is: `department_name` → `project_name` → `main_task_category` → `sub_task_category` → (other columns).

## Phases

| Phase | Name                             | Description                                                                    | Status   | Priority |
| ----- | -------------------------------- | ------------------------------------------------------------------------------ | -------- | -------- |
| 01    | Backend Annotation               | Annotate `main_task_category_name`/`sub_task_category_name` in list serializer | Complete | High     |
| 02    | Frontend Types & Constants       | Add display property keys, spreadsheet config, translations                    | Complete | High     |
| 03    | Column Components & Registration | Two new column components, wire into SPREADSHEET_COLUMNS                       | Complete | High     |

## Validation Log

### Session 1 — 2026-03-27

**Trigger:** Initial plan validation before coding begins
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Should Main Task Category and Sub Task Category columns be ON by default in Display Properties, or OFF (user must toggle on)?
   - Options: OFF by default | ON by default
   - **Answer:** ON by default
   - **Rationale:** Phase 02 must set the default value to `true` for both keys in `ISSUE_DISPLAY_PROPERTIES` config.

2. **[Architecture]** Should the category columns support sorting and/or filtering, or be strictly read-only display columns for now?
   - Options: Read-only, no sort/filter | Filterable only | Sortable + filterable
   - **Answer:** Sortable + filterable
   - **Rationale:** Phase 02 must mark both as sortable in `SPREADSHEET_PROPERTY_DETAILS` and wire filter constants. Phase 03 column components must handle the sort indicator pattern.

3. **[Architecture]** Phase 01 annotates category names in `to_representation()`. Performance concern?
   - Options: No concern, proceed | Annotate at queryset level instead
   - **Answer:** No concern, proceed — `select_related` is sufficient.

4. **[Assumptions]** Do `main_task_category_name`/`sub_task_category_name` already exist on `TIssue`?
   - Options: Not yet, need to add them | Already exist
   - **Answer:** Check and add if missing
   - **Custom input:** "check again, add if it miss"
   - **Rationale:** Phase 02 must grep `TIssue` type first, then add fields only if absent.

#### Confirmed Decisions

- Default ON: both columns enabled by default in Display Properties
- Sortable + filterable: full interactivity required, not read-only
- Backend: `to_representation()` annotation with `select_related` — sufficient
- TIssue fields: verify first, add only if missing

#### Action Items

- [ ] Phase 02: set `defaultValue: true` (or equivalent) for both keys in `ISSUE_DISPLAY_PROPERTIES`
- [ ] Phase 02: set `sortable: true` in `SPREADSHEET_PROPERTY_DETAILS` for both; add filter config
- [ ] Phase 02: grep `TIssue` before adding `main_task_category_name`/`sub_task_category_name`
- [ ] Phase 03: column components must support sort indicator (check existing sortable column pattern)

#### Impact on Phases

- Phase 02: Add `defaultValue: true` to display properties config; mark both as sortable; add filter wiring
- Phase 03: Update column component to handle sort indicator / sortable column pattern

### Session 2 — 2026-03-27

**Trigger:** Re-validation — conflict detected between Phase 02 step 3 ("non-sortable initially") and Session 1 confirmed decision ("sortable + filterable"); two implementation gaps found.
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Phase 02 Step 3 says 'non-sortable initially' but Session 1 confirmed 'Sortable + filterable'. Which is canonical?
   - Options: Sortable + filterable | Read-only for now
   - **Answer:** Sortable + filterable
   - **Rationale:** Phase 02 Step 3 wording was incorrect; must override to mark both as sortable in `SPREADSHEET_PROPERTY_DETAILS`.

2. **[Architecture]** For filtering by task category, what filter mechanism to use?
   - Options: Category ID dropdown | Text search | Skip filtering for now
   - **Answer:** Category ID dropdown
   - **Rationale:** Phase 02 must reuse the existing task-category service to populate a dropdown of available categories. Filter constants should use category IDs, not name strings.

3. **[Assumptions]** Should both columns be ON by default in Display Properties?
   - Options: ON by default | OFF by default
   - **Answer:** ON by default
   - **Rationale:** Phase 02 implementation steps must explicitly set `defaultValue: true` (or equivalent) in `ISSUE_DISPLAY_PROPERTIES` for both keys.

#### Confirmed Decisions

- Sortable + filterable: override the "non-sortable initially" wording in Phase 02 Step 3
- Filter type: category ID dropdown (reuse task-category service)
- Default ON: `defaultValue: true` must appear explicitly in Phase 02 implementation steps

#### Action Items

- [x] Fix Phase 02 Step 3 — change "non-sortable initially" → mark both sortable in `SPREADSHEET_PROPERTY_DETAILS`
- [x] Add filter wiring detail to Phase 02 — category ID dropdown using task-category service
- [x] Add explicit `defaultValue: true` to Phase 02 implementation steps

#### Impact on Phases

- Phase 02: Fix Step 3 wording + add filter/default details

## Completion Summary

**Project Status:** COMPLETE (2026-03-27)

All three phases have been successfully implemented and delivered:

### Phase 01: Backend Annotation

- ✅ Added `main_task_category_name`/`sub_task_category_name` to `IssueListDetailSerializer` (issue.py:929-930)
- ✅ Added `main_task_category_id`/`sub_task_category_id` (missing fields) to `ViewIssueListSerializer` (view.py:53-56)
- ✅ Added category names to `ViewIssueListSerializer` (view.py:53-56)
- ✅ Optimized queries with `select_related("main_task_category", "sub_task_category")` in `IssuePaginatedViewSet.get()` (base.py:1110)
- ✅ Optimized queries in `WorkspaceViewIssuesViewSet.get_queryset()` (view/base.py:229-231)

### Phase 02: Frontend Types & Constants

- ✅ Added `main_task_category_name`/`sub_task_category_name` to `TIssue` type (issue.ts:110-111)
- ✅ Added `main_task_category`/`sub_task_category` to `IIssueDisplayProperties` (view-props.ts:196-197)
- ✅ Added sort keys to `TIssueOrderByOptions`
- ✅ Updated `KEYS` array in `common.ts` with both category columns
- ✅ Updated `DISPLAY_PROPERTIES` array with correct defaults (both ON by default)
- ✅ Updated `SPREADSHEET_PROPERTY_LIST` with proper column ordering hierarchy
- ✅ Updated `SPREADSHEET_PROPERTY_DETAILS` with sortable entries for both columns
- ✅ Added `?? true` defaults to `getComputedDisplayProperties` in `packages/utils/src/work-item/base.ts`
- ✅ Added translations (en/ko/vi)

### Phase 03: Column Components & Registration

- ✅ Column components already existed and were properly structured
- ✅ Added exports to `index.ts`
- ✅ Added imports to `utils.tsx`
- ✅ Added `SPREADSHEET_COLUMNS` entries to register both columns in the spreadsheet view

### Key Outcomes

- **Feature Complete:** Main Task Category and Sub Task Category columns now display in All Work Items view
- **User Experience:** Both columns visible by default in Display Properties toggle
- **Functionality:** Full sorting and filtering support enabled
- **Performance:** Optimized backend queries with `select_related`
- **Translations:** Support for EN/KO/VI languages

### Docs Impact

Minor — feature addition with no breaking changes. New display properties added to existing configuration structure.
