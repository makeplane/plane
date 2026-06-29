---
last_researched: 2026-06-29
dimension: features
---

# Project Research - Features

## Table Stakes For v1

### Template Selection During Project Creation

- User can create a project without selecting a template.
- User can select a template in the existing create Project modal/form.
- User can preview what the selected template will create at a useful summary level.
- Built-in templates are available without workspace setup.

Rationale: the core value is making new projects useful immediately without breaking the current empty-project flow.

### Built-In System Templates

Required built-ins from project context:

- `Software Project`
- `Marketing Campaign`
- `Operations Project`

Each built-in should define states, labels, modules, cycles, and starter issues.

### Custom Workspace Templates

- Workspace owners/admins can create custom templates.
- Workspace owners/admins can edit custom templates.
- Workspace owners/admins can delete or archive custom templates if unused.
- Custom templates can define states, labels, modules, cycles, and starter issues.
- Regular members and guests cannot manage workspace templates.

### Backend Application Of Templates

- Project creation accepts optional `template_id`.
- Backend validates template visibility and permissions.
- Backend applies template contents transactionally.
- Missing `template_id` preserves existing default behavior.
- Starter issues are mapped to generated states and optionally linked to generated modules/cycles.

## Differentiators To Defer

- Import/export templates as files.
- Share templates between workspaces or Plane instances.
- Template marketplace/library beyond local built-ins.
- Template recommendation based on project name or workspace history.
- Analytics showing which templates are most used.

## Anti-Features

- Do not force every project to use a template.
- Do not make users configure custom templates before getting value from built-ins.
- Do not let regular workspace members modify workspace-wide templates.
- Do not create template artifacts through multiple client-side API calls after project creation.

## UX Notes

The repo already has an empty `ProjectTemplateSelect` component at `apps/web/ce/components/projects/create/template-select.tsx`, rendered from `ProjectCreateHeader`. This suggests the intended UI slot exists but is not implemented.

For v1, the create modal can show a compact selector button in the header area and a dropdown/modal with:

- template name
- short description
- counts of states/labels/modules/cycles/issues
- badge for built-in vs custom

## Complexity Notes

- States are simple to apply but must ensure exactly one default non-triage state.
- Labels can have parent relationships; v1 should either support flat labels only or explicitly order parent creation before child labels.
- Modules and cycles can be created after project.
- Starter issues should be created after states and labels so references can be resolved.
- Issue-to-module and issue-to-cycle associations require mapping template temporary keys to created rows.

