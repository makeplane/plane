# Phase 3: God Mode Frontend

## Context Links

- [Research: God Mode Frontend](./research/researcher-02-godmode-frontend.md)
- [Admin routes](../../apps/admin/app/routes.ts)
- [Email page](<../../apps/admin/app/(all)/(dashboard)/email/page.tsx>)
- [Instance store](../../apps/admin/store/instance.store.ts)
- [Root store](../../apps/admin/store/root.store.ts)

## Overview

- **Priority**: P2
- **Status**: pending
- **Description**: New email-templates route in God Mode with list view, editor, variable sidebar, preview pane, and test-send functionality

## Key Insights

- Admin uses flat route config in `routes.ts` with `route()` helper
- Pattern: page.tsx (data fetch + state) -> form component (UI + submission)
- UI: `@plane/propel/*` primary, `@plane/ui` secondary
- Store: `makeObservable` explicit, `runInAction` for state updates
- No CE override needed for admin app

## Requirements

### Functional

- List all email templates with category grouping
- Click template to view/edit HTML content
- Show available variables for selected template
- Preview rendered HTML with sample data (iframe or shadow DOM)
- Send test email to specified address
- Reset template to default (delete DB override)

### Non-functional

- Components <150 lines each
- Code files <200 lines
- kebab-case file naming
- observer() on all MobX-reading components

## Architecture

### Route Structure

```
apps/admin/app/(all)/(dashboard)/email-templates/
  page.tsx                           # List page
  [id]/page.tsx                      # Edit page (UUID from EmailTemplate model)
<!-- Updated: Validation Session 1 - UUID routing instead of slug -->
```

### Store

```typescript
// apps/admin/store/email-template.store.ts
class EmailTemplateStore {
  templateMap: Record<string, IEmailTemplate> = {};
  loader: boolean = false;
  // Actions: fetchTemplates, updateTemplate, resetTemplate, previewTemplate, sendTestEmail
}
```

### Service

<!-- Updated: Validation Session 3 - All methods use UUID (id) instead of slug -->

```typescript
// apps/admin/services/email-template.service.ts
class EmailTemplateService {
  listTemplates(): Promise<IEmailTemplate[]>;
  getTemplate(id: string): Promise<IEmailTemplate>;
  updateTemplate(id: string, data: Partial<IEmailTemplate>): Promise<IEmailTemplate>;
  resetTemplate(id: string): Promise<void>;
  previewTemplate(id: string): Promise<{ html: string }>;
  sendTestEmail(id: string, email: string): Promise<void>;
}
```

### Components

<!-- Updated: Validation Session 3 - [id] → [id], textarea → Monaco (lazy loaded) -->

```
apps/admin/app/(all)/(dashboard)/email-templates/
  page.tsx                              # Template list page
  [id]/
    page.tsx                            # Editor page wrapper
    components/
      template-editor-form.tsx          # Monaco Editor (lazy loaded) + save
      template-variable-sidebar.tsx     # Variable list for selected template
      template-preview-pane.tsx         # Rendered HTML preview (iframe)
      template-test-send-form.tsx       # Email input + send button
```

## Related Code Files

### Create

- `apps/admin/store/email-template.store.ts` — MobX store
- `apps/admin/services/email-template.service.ts` — API service
- `apps/admin/hooks/store/use-email-template.ts` — Store hook
- `apps/admin/app/(all)/(dashboard)/email-templates/page.tsx` — List page
- `apps/admin/app/(all)/(dashboard)/email-templates/[id]/page.tsx` — Editor page
- `apps/admin/app/(all)/(dashboard)/email-templates/[id]/components/template-editor-form.tsx`
- `apps/admin/app/(all)/(dashboard)/email-templates/[id]/components/template-variable-sidebar.tsx`
- `apps/admin/app/(all)/(dashboard)/email-templates/[id]/components/template-preview-pane.tsx`
- `apps/admin/app/(all)/(dashboard)/email-templates/[id]/components/template-test-send-form.tsx`

### Modify

- `apps/admin/app/routes.ts` — Add email-templates routes
- `apps/admin/store/root.store.ts` — Register EmailTemplateStore
- `apps/admin/app/(all)/(dashboard)/layout.tsx` — Add sidebar nav item under Email settings
<!-- Updated: Validation Session 2 - Navigation placement under Email settings -->

### Types (create in same files or inline — admin app doesn't use @plane/types extensively)

```typescript
interface IEmailTemplate {
  id: string;
  slug: string;
  subject: string;
  html_content: string;
  is_active: boolean;
  has_override: boolean;
  variables: Array<{ key: string; label: string; type: string }>;
  category: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

## Implementation Steps

1. **Types**: Define `IEmailTemplate` interface in store file or separate types file

2. **Service**: Create `email-template.service.ts`
   - Extend pattern from existing admin services
   - Base URL: `/api/instances/email-templates/`
   - Methods: list, get, update, reset (DELETE), preview (POST), testSend (POST)

3. **Store**: Create `email-template.store.ts`
   - `makeObservable` with explicit annotations
   - Observable: `templateMap`, `loader`
   - Actions: `fetchTemplates`, `updateTemplate`, `resetTemplate`, `previewTemplate`, `sendTestEmail`
   - Computed: `templateList` (sorted by category), `getTemplateBySlug`

4. **Root Store**: Add `emailTemplate: EmailTemplateStore` to root store

5. **Hook**: Create `use-email-template.ts` in `hooks/store/`

6. **List Page**: `email-templates/page.tsx`
   - useSWR to fetch templates
   - Group by category, display as cards/table
   - Click navigates to `email-templates/{uuid}` (UUID from EmailTemplate model)
   - Show override badge if `has_override === true`

7. **Editor Page**: `email-templates/[id]/page.tsx`
   - Fetch single template detail
   - Two-column layout: editor (left) + preview (right)
   - Variable sidebar below or beside editor
   - Save, Reset, Preview, Test Send actions

8. **Editor Form**: `template-editor-form.tsx`
   - Monaco Editor (lazy loaded via dynamic import) for HTML content with syntax highlighting
   - Subject line input
   - Save button calls `updateTemplate`
   - Reset button calls `resetTemplate` with confirmation

9. **Variable Sidebar**: `template-variable-sidebar.tsx`
   - List variables with key, label, type
   - Click-to-copy `{{ variable_name }}` syntax

10. **Preview Pane**: `template-preview-pane.tsx`
    - Button triggers preview API call
    - Render result in sandboxed iframe (srcdoc)

11. **Test Send Form**: `template-test-send-form.tsx`
    - Email input + send button
    - Toast notification on success/error

12. **Variable Warning**: Show warning banner/toast when save response contains `warnings` (missing variables)
<!-- Updated: Validation Session 2 - Variable warning UI on save -->

13. **Routes**: Add to `routes.ts`:
    ```typescript
    route("email-templates", "./(all)/(dashboard)/email-templates/page.tsx"),
    route("email-templates/:id", "./(all)/(dashboard)/email-templates/[id]/page.tsx"),
    ```

## Todo List

- [ ] Create IEmailTemplate type
- [ ] Create email-template.service.ts
- [ ] Create email-template.store.ts
- [ ] Register store in root.store.ts
- [ ] Create store hook
- [ ] Create list page
- [ ] Create editor page
- [ ] Create template-editor-form component
- [ ] Create template-variable-sidebar component
- [ ] Create template-preview-pane component
- [ ] Create template-test-send-form component
- [ ] Add routes to routes.ts
- [ ] Add sidebar navigation link

## Success Criteria

- Admin can browse all 12 templates grouped by category
- Editor displays current HTML content (DB override or file default)
- Preview renders correctly with sample data
- Test email arrives at specified address
- Reset removes DB override and shows file default
- All components <150 lines

## Risk Assessment

- **HTML editor UX**: Using Monaco Editor (@monaco-editor/react — needs install, not yet in deps) for syntax highlighting + autocomplete
  <!-- Updated: Validation Session 5 - Monaco NOT in deps, needs pnpm add -->
  <!-- Updated: Validation Session 1 - Monaco Editor instead of textarea, UUID routing, +3h effort -->
- **Preview XSS**: Sandboxed iframe with `srcdoc` prevents script execution in parent
- **Route slug encoding**: N/A — UUID routing eliminates slug encoding issues
<!-- Updated: Validation Session 2 - Navigation under Email settings, variable warning UI -->

## Security Considerations

- Admin-only routes (same auth as other god-mode pages)
- Preview iframe sandboxed to prevent script execution
- Test-send rate limiting: consider adding cooldown (future enhancement)
