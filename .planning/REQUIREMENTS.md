# Requirements: Plane Project Templates

**Defined:** 2026-06-29
**Core Value:** Creating a new Project should produce a useful, ready-to-work structure immediately instead of an empty shell that admins must configure by hand every time.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Template Catalog

- [ ] **CAT-01**: Workspace project creation shows available Project Templates inside the existing create Project modal/form.
- [ ] **CAT-02**: User can create a Project without selecting a template and receives the existing default Project behavior.
- [x] **CAT-03**: User can select the built-in `Software Project` template when creating a Project.
- [x] **CAT-04**: User can select the built-in `Marketing Campaign` template when creating a Project.
- [x] **CAT-05**: User can select the built-in `Operations Project` template when creating a Project.
- [ ] **CAT-06**: User can see a useful summary of a template before selecting it, including counts or descriptions for states, labels, modules, cycles, and starter issues.

### Custom Templates

- [x] **CUST-01**: Workspace admin can create a custom Project Template scoped to that workspace.
- [x] **CUST-02**: Workspace admin can edit a custom Project Template scoped to that workspace.
- [x] **CUST-03**: Workspace admin can delete, archive, or deactivate a custom Project Template so it no longer appears for new Project creation.
- [x] **CUST-04**: Workspace admin can define template states with name, color, group, sequence/order, and default-state marker.
- [x] **CUST-05**: Workspace admin can define template labels with name, description, color, and order.
- [x] **CUST-06**: Workspace admin can define template modules with name, description, status, and optional date fields.
- [x] **CUST-07**: Workspace admin can define template cycles with name, description, and optional relative date/duration metadata.
- [x] **CUST-08**: Workspace admin can define starter issues with title/name, description, state reference, labels, module reference, cycle reference, and priority where supported by existing issue fields.
- [x] **CUST-09**: Workspace admin cannot edit built-in system templates directly.

### Project Creation

- [ ] **CREATE-01**: Project creation API accepts an optional `template_id` along with existing Project fields.
- [ ] **CREATE-02**: Project creation without `template_id` preserves current behavior, including existing default state creation.
- [ ] **CREATE-03**: Project creation with `template_id` validates that the selected template is available to the workspace.
- [ ] **CREATE-04**: Project creation with `template_id` applies template contents on the backend in a single transaction.
- [ ] **CREATE-05**: If template application fails validation, no partial Project, states, labels, modules, cycles, or starter issues remain.
- [ ] **CREATE-06**: Existing create Project success behavior remains intact, including adding the creator as Project admin, adding project lead when provided, optional favorite behavior, cover image behavior, and transition to the existing feature-selection step.

### Generated Contents

- [ ] **GEN-01**: A Project created from a template contains the template's configured workflow states instead of duplicate default states.
- [ ] **GEN-02**: A Project created from a template contains the template's configured labels.
- [ ] **GEN-03**: A Project created from a template contains the template's configured modules.
- [ ] **GEN-04**: A Project created from a template contains the template's configured cycles.
- [ ] **GEN-05**: A Project created from a template contains the template's configured starter issues.
- [ ] **GEN-06**: Starter issues are assigned to the correct generated states.
- [ ] **GEN-07**: Starter issues are linked to the correct generated labels, modules, and cycles when those references are present in the template.

### Permissions

- [x] **PERM-01**: Workspace admins can list built-in and workspace custom templates.
- [ ] **PERM-02**: Workspace members who can create Projects can list and select available templates when creating a Project.
- [x] **PERM-03**: Workspace guests cannot create, edit, delete, archive, or deactivate custom templates.
- [x] **PERM-04**: Workspace members who are not admins cannot create, edit, delete, archive, or deactivate custom templates.
- [x] **PERM-05**: API write operations for custom templates reject unauthorized users with an appropriate permission error.

### Frontend Experience

- [ ] **UI-01**: The existing `ProjectTemplateSelect` UI is implemented in the create Project header area.
- [ ] **UI-02**: Selecting a template updates the create Project form state and sends the selected `template_id` with the create request.
- [ ] **UI-03**: The selected template is visually clear before submit.
- [ ] **UI-04**: Template loading, empty, and error states are handled without blocking no-template Project creation.
- [ ] **UI-05**: Workspace admins have a discoverable workspace settings area for managing custom Project Templates.

### Verification

- [ ] **VER-01**: Backend tests cover Project creation without a template.
- [ ] **VER-02**: Backend tests cover Project creation from each built-in template type at least at the apply-service level.
- [ ] **VER-03**: Backend tests cover custom template CRUD permissions.
- [ ] **VER-04**: Backend tests cover rollback behavior when template application fails.
- [ ] **VER-05**: Frontend checks cover type safety for template types, services, and create Project form payload changes.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Templates

- **ADV-01**: Workspace admin can duplicate an existing Project into a reusable custom Project Template.
- **ADV-02**: Workspace admin can import/export templates as files.
- **ADV-03**: Instance admin can define system-wide custom templates shared across workspaces.
- **ADV-04**: Template labels support parent/child hierarchy in the custom template editor.
- **ADV-05**: Template cycles support advanced date scheduling presets and recurring cycle generation.
- **ADV-06**: Template usage analytics show which templates are selected most often.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                       | Reason                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| Template marketplace                          | Requires distribution, trust, versioning, and moderation; not needed for local value |
| Cross-instance template sharing               | Import/export and marketplace workflows are deferred                                 |
| Public Space templates                        | Initial requirement is Workspace Project creation                                    |
| Visual workflow-builder-grade template editor | Too large for v1; structured form/editor is sufficient                               |
| Client-side multi-call template application   | Risks partial Projects; backend transaction is required                              |
| Direct editing of built-in system templates   | Built-ins should stay stable; admins can create custom copies instead                |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| CAT-01      | Phase 3 | Pending  |
| CAT-02      | Phase 2 | Pending  |
| CAT-03      | Phase 1 | Complete |
| CAT-04      | Phase 1 | Complete |
| CAT-05      | Phase 1 | Complete |
| CAT-06      | Phase 3 | Pending  |
| CUST-01     | Phase 1 | Complete |
| CUST-02     | Phase 1 | Complete |
| CUST-03     | Phase 1 | Complete |
| CUST-04     | Phase 1 | Complete |
| CUST-05     | Phase 1 | Complete |
| CUST-06     | Phase 1 | Complete |
| CUST-07     | Phase 1 | Complete |
| CUST-08     | Phase 1 | Complete |
| CUST-09     | Phase 1 | Complete |
| CREATE-01   | Phase 2 | Pending  |
| CREATE-02   | Phase 2 | Pending  |
| CREATE-03   | Phase 2 | Pending  |
| CREATE-04   | Phase 2 | Pending  |
| CREATE-05   | Phase 2 | Pending  |
| CREATE-06   | Phase 2 | Pending  |
| GEN-01      | Phase 2 | Pending  |
| GEN-02      | Phase 2 | Pending  |
| GEN-03      | Phase 2 | Pending  |
| GEN-04      | Phase 2 | Pending  |
| GEN-05      | Phase 2 | Pending  |
| GEN-06      | Phase 2 | Pending  |
| GEN-07      | Phase 2 | Pending  |
| PERM-01     | Phase 1 | Complete |
| PERM-02     | Phase 3 | Pending  |
| PERM-03     | Phase 1 | Complete |
| PERM-04     | Phase 1 | Complete |
| PERM-05     | Phase 1 | Complete |
| UI-01       | Phase 3 | Pending  |
| UI-02       | Phase 3 | Pending  |
| UI-03       | Phase 3 | Pending  |
| UI-04       | Phase 3 | Pending  |
| UI-05       | Phase 4 | Pending  |
| VER-01      | Phase 2 | Pending  |
| VER-02      | Phase 2 | Pending  |
| VER-03      | Phase 2 | Pending  |
| VER-04      | Phase 2 | Pending  |
| VER-05      | Phase 3 | Pending  |

**Coverage:**

- v1 requirements: 43 total
- Mapped to phases: 43
- Unmapped: 0

---

_Requirements defined: 2026-06-29_
_Last updated: 2026-06-29 after roadmap creation_
