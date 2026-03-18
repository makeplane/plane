# Workspace Work Item Types Refactor — Context Document

## Overview

This document provides the full context for the **workspace-level work item types refactor** happening on the `feat-workspace-work-item-types` branch. Use this as the initial context for any new session working on this feature.

---

## Background & Motivation

### Terminology Update (Important)
The entire Plane product is being renamed from "issues" to "work items":
- **Issue** → **Work item**
- **Issue type** → **Work item type**
- **Issue property** → **Custom property** (no longer "issue property" since properties are not limited to issues)

### What Changed Architecturally

**Before (Old System):**
- Work item types were created at the **project level**
- Custom properties lived **inside** a work item type — each type had its own isolated set of properties
- A property could not be shared across multiple work item types
- Everything was tightly coupled: type → properties

**After (New System):**
- Work item types are created at the **workspace level** (project-level creation will come in Phase 2 as an opt-in)
- Custom properties are **independent entities** — they exist at the workspace level, separate from work item types
- Properties are **linked** to work item types (many-to-many relationship via sort order)
- A single property can be shared across multiple work item types
- Properties and types are fully decoupled

---

## Refactoring Strategy

**We are NOT touching the old code.** The old components, stores, services, and types are still in place and serving other features (epic properties, customer properties, templates). Instead:

1. All new workspace work item types UI lives under `apps/web/core/components/work-item-types-new/`
2. All new custom properties UI lives under `apps/web/core/components/custom-properties/`
3. New TypeScript types live under `packages/types/src/work-item-types/` (the old ones are in `work-item-types-legacy/`)
4. Old code remains in `work-item-types-legacy/` until it can be safely deprecated

---

## New Data Model

### Work Item Type (`TWorkItemType`)
```ts
type TWorkItemType = {
  id: string;
  name: string;
  description: string;
  logo_props: TLogoProps;
  is_active: boolean;
  is_default: boolean;
  level: number;
  is_epic: boolean;
  is_global: boolean;
  properties: TWorkItemTypePropertyRef[]; // linked property IDs with sort order
  workspace: string;
  created_at: string;
  updated_at: string;
};
```

### Custom Property (`CustomProperty<T>`)
```ts
type CustomProperty<T extends CustomPropertyType = CustomPropertyType> = {
  id: string;
  name: string;                       // internal name/key
  display_name: string;               // user-facing label
  description: string;
  logo_props: TLogoProps;
  sort_order: number;
  relation_type: EIssuePropertyRelationType | null;
  is_required: boolean;               // mandatory property
  default_value: CustomPropertyDefaultValue<T> | null;
  is_active: boolean;
  is_global: boolean;
  issue_type: string | null;          // optional, still supports type-scoped properties
  is_multi: boolean;                  // multi-select (for OPTION type)
  property_type: T;
  project: string | null;
  settings: TWorkItemPropertySettingsMap[T];
  formula: TFormula | null;
};
```

### Property-Type Link (`TWorkItemTypePropertyRef`)
```ts
type TWorkItemTypePropertyRef = {
  [propertyId: string]: number; // propertyId → sort_order
};
```

### Custom Property Types (`CustomPropertyType`)
```
TEXT | DECIMAL | OPTION | BOOLEAN | DATETIME | RELATION | URL | FORMULA
```

---

## Directory Structure

### New Work Item Types Components
```
apps/web/core/components/work-item-types-new/
├── workspace/
│   ├── root.tsx                         # Workspace settings root (tabs: Types / Properties)
│   ├── types-tab-content.tsx            # Lists workspace work item types
│   └── properties-tab-content.tsx       # Lists workspace custom properties
├── project/
│   ├── root.tsx                         # Project settings root (tabs: Types / Properties)
│   ├── types-tab-content.tsx            # Lists project-level types (imported from workspace)
│   └── properties-tab-content.tsx       # Lists project-level properties
├── create-update/
│   ├── custom-type/
│   │   ├── modal.tsx                    # Create/update work item type modal
│   │   └── form.tsx                     # Form inside modal
│   └── property/
│       └── form.tsx                     # Create/update custom property form
├── common/
│   ├── icon-picker.tsx                  # Icon selector for work item types
│   ├── issue-type-logo.tsx              # Work item type logo display
│   └── lucide-icons-list.tsx            # Available icon list
├── work-item-types-list.tsx             # List renderer for work item types
├── work-item-type-list-item.tsx         # Single type list item
├── types-list-header.tsx                # Header: count + "Add work item type" button
├── properties-list-header.tsx           # Header for properties list
├── work-item-types-tabs.tsx             # Tab switcher: Types | Properties
└── mock/
    └── template-data.ts                 # Mock data for development/UI testing
```

### New Custom Properties Components
```
apps/web/core/components/custom-properties/
├── list/
│   ├── root.tsx                         # Root: loader / empty state / list
│   ├── property-list.tsx                # Container with actions/permissions interface
│   ├── property-list-item.tsx           # Individual property row (edit/delete)
│   ├── quick-actions.tsx                # Action buttons per item
│   └── delete-confirmation-modal.tsx    # Confirm before delete
├── create-update/
│   ├── mandatory-field.tsx              # "Mandatory property" checkbox with confirm modal
│   └── dropdowns/
│       ├── property-type.tsx            # Select property type (TEXT, OPTION, etc.)
│       ├── property-title.tsx           # Display name input
│       ├── property-attributes.tsx      # Configure attributes
│       └── selected-attribute-properties.tsx  # Show current attribute config
├── attributes/
│   ├── text.tsx                         # Text: single-line / multi-line / readonly
│   ├── number.tsx                       # Decimal number
│   ├── dropdown.tsx                     # Option: single select / multi select
│   ├── boolean.tsx                      # Toggle / checkbox
│   ├── date-picker.tsx                  # Date with format selection
│   ├── member-picker.tsx                # User relation
│   ├── formula.tsx                      # Formula with field references
│   ├── url.tsx                          # URL
│   ├── attribute-pill.tsx               # Badge to show current attribute
│   ├── options/
│   │   ├── root.tsx                     # Options list management
│   │   ├── option.tsx                   # Single option item (edit/reorder)
│   │   ├── create-option-item.tsx       # New option input row
│   │   └── default-option-select.tsx    # Select which option is default
│   ├── formula/
│   │   ├── field-reference-picker.tsx   # Pick other fields to reference in formula
│   │   └── formula-input.tsx            # Formula expression editor
│   └── common/
│       ├── property-settings-configuration.tsx  # Generic settings configurator
│       └── property-multi-select.tsx            # Multi-select attribute display
└── common/
    └── property-icon.tsx                # Icon for each property type
```

---

## Type Definitions

### New Types Location: `packages/types/src/work-item-types/`
| File | Purpose |
|------|---------|
| `work-item-types.ts` | `TWorkItemType`, store schemas |
| `work-item-properties.ts` | `CustomProperty<T>`, `CustomPropertyType`, `CustomPropertyDefaultValue` |
| `work-item-property-configurations.ts` | `TWorkItemPropertySettingsMap`, `TTextAttributeConfigurations`, `TDateAttributeConfigurations`, `TFormulaAttributeConfigurations` |
| `work-item-property-option.ts` | `CustomPropertyOption` |
| `services.ts` | Service payload types |

### Legacy Types Location: `packages/types/src/work-item-types-legacy/`
These are the OLD types. Do not use these for new work:
- `work-item-types-extended.ts` — `TIssueType`, `IIssueType`, `IIssueTypesStore`
- `work-item-property-configurations.ts` — old `EIssuePropertyType` enum

---

## Services

### Workspace Work Item Types (`WorkspaceWorkItemTypesService`)
```
**GET**    /api/workspaces/{slug}/work-item-types/                                  — list all workspace types (flat array)
GET    /api/workspaces/{slug}/work-item-types/{typeId}/                         — get single type
POST   /api/workspaces/{slug}/work-item-types/                                  — create type
PATCH  /api/workspaces/{slug}/work-item-types/{typeId}/                         — update type
DELETE /api/workspaces/{slug}/work-item-types/{typeId}/                         — delete type
GET    /api/workspaces/{slug}/work-item-types/{typeId}/work-item-properties/    — list properties linked to type
POST   /api/workspaces/{slug}/work-item-types/{typeId}/work-item-properties/    — link properties to type
         body: { "properties": { "<propertyId>": <sortOrder>, ... } }
PATCH  /api/workspaces/{slug}/work-item-types/{typeId}/work-item-properties/{propertyId}/ — update sort_order
         body: { "sort_order": <number> }
DELETE /api/workspaces/{slug}/work-item-types/{typeId}/work-item-properties/{propertyId}/ — unlink property
```

**Important:** The link (POST) endpoint takes a `properties` dict in the body (not a single propertyId in the URL). Multiple properties can be linked in a single request.

### Workspace Custom Properties (`WorkspacePropertiesService`)
```
GET    /api/workspaces/{slug}/work-item-properties/                — list all workspace properties (flat array, no pagination)
POST   /api/workspaces/{slug}/work-item-properties/                — create property
PATCH  /api/workspaces/{slug}/work-item-properties/{propertyId}/   — update property
DELETE /api/workspaces/{slug}/work-item-properties/{propertyId}/   — delete property
```

**Note:** The properties list endpoint returns a flat array (pagination was removed). The backend view at `WorkspaceWorkItemPropertyEndpoint.get()` uses `Response(serializer.data)` directly.

### Project Work Item Types (`ProjectWorkItemTypesService`)
```
GET    /api/workspaces/{slug}/projects/{id}/work-item-types/       — list project types
POST   /api/workspaces/{slug}/projects/{id}/issue-types/           — create project type (legacy route)
PATCH  /api/workspaces/{slug}/projects/{id}/issue-types/{typeId}/  — update project type
DELETE /api/workspaces/{slug}/projects/{id}/issue-types/{typeId}/  — delete project type
POST   /api/workspaces/{slug}/projects/{id}/import-work-item-types/ — import global types to project
```

---

## Stores

### Store Access via Hooks
```ts
// Work item types
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
import { useWorkItemType } from "@/plane-web/hooks/store/work-item-types/use-work-item-type";

// Custom properties
import { useWorkspaceCustomProperties } from "@/plane-web/hooks/store/custom-properties/use-workspace-custom-properties";
import { useCustomProperty } from "@/plane-web/hooks/store/custom-properties/use-custom-property";
// useCustomProperty returns: { getCustomProperty(id), getCustomPropertiesByIds(ids) }
```

### Store Schemas (see `packages/types/src/work-item-types/work-item-types.ts`)
```ts
RootWorkItemTypesStoreSchema {
  allTypes: BaseWorkItemTypeInstanceSchema[];
  get(typeId: string): BaseWorkItemTypeInstanceSchema | undefined;
  addOrMutate(typeId: string, instance: BaseWorkItemTypeInstanceSchema): void;
  remove(typeId: string): void;
  workspaceWorkItemTypesStore: WorkspaceWorkItemTypesStoreSchema;
  projectWorkItemTypesStore: ProjectWorkItemTypesStoreSchema;
}

WorkspaceWorkItemTypesStoreSchema {
  getLoaderByWorkspaceSlug(slug: string): TLoader | undefined;
  getWorkItemTypesByWorkspaceSlug(slug: string): BaseWorkItemTypeInstanceSchema[];
  fetchTypes(workspaceSlug: string): Promise<TWorkItemTypeResponse[]>;
  createType(payload: TCreateWorkspaceWorkItemTypePayload): Promise<TWorkItemTypeResponse | undefined>;
  deleteType(payload: TDeleteWorkspaceWorkItemTypePayload): Promise<void>;
  canCreate / canView(workspaceSlug: string): boolean;  // canDelete is on instances
}
// Note: linkPropertyToType / unlinkPropertyFromType were moved to instances (see Instance-Owned Operations)
```

---

## Pages & Routing

### Workspace Settings
- **Route:** `/[workspaceSlug]/settings/work-item-types/`
- **Page:** `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/work-item-types/page.tsx`
- **Access:** Workspace admins only
- **Feature Flag:** `EWorkspaceFeatures.IS_WORK_ITEM_TYPES_ENABLED`
- **Tabs:** Types | Properties

### Project Settings
- **Route:** `/[workspaceSlug]/settings/projects/[projectId]/work-item-types/`
- **Page:** `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/work-item-types/page.tsx`
- **Access:** Project admins only

---

## Constants & Utilities

### Constants: `packages/constants/src/work-item-properties.ts`
- `ISSUE_PROPERTY_TYPE_DETAILS` — maps each `CustomPropertyType` to icon, i18n key, default settings
- `DROPDOWN_ATTRIBUTES` — single/multi-select options for OPTION and RELATION_USER types
- `ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS` — settings UI config (text display format, date format options)
- `RESTRICTED_WORK_ITEM_PROPERTY_DISPLAY_NAMES` — reserved names: "state", "due date", "cycle", "modules"
- `ALLOWED_FORMULA_PROPERTY_TYPES` — TEXT, DECIMAL, DATETIME, BOOLEAN, URL

### Utilities: `packages/utils/src/work-item-properties.ts` & `custom-properties.ts`
- `getIssuePropertyTypeKey(type)` — returns string key from type enum
- `getIssuePropertyTypeDetails(type)` — returns icon + config for a property type
- `getTextAttributeDisplayNameKey(settings)` — i18n key for text format
- `getDateAttributeDisplayName(settings)` — format example for date
- `getMultiSelectAttributeDisplayName(isMulti)` — "Single select" or "Multi select"
- `getCustomPropertyTypeKey(type)` — new-system equivalent of `getIssuePropertyTypeKey`
- `getCustomPropertyAttributeDisplayNameKey(type, settings)` — new-system attribute display name

---

## UI Design Summary (from mockups)

### Workspace Settings — Types Tab
- Info banner: "Your workspace starts with default work item types and properties that you can add, edit, or remove anytime."
- "Allow projects to create custom work item types" toggle with project chips (QA, Design, etc.)
- **Types list** with count badge, search bar, filter/sort icons, "Add work item type" button
- Each type row: chevron expand, logo, name (with "Global" badge), property count, toggle (active/inactive), `...` menu
- Expanded type row: **Custom properties** section with a **right-side panel** for drag-and-drop property linking

### Workspace Settings — Properties Tab
- "Allow projects to create custom properties" toggle with project chips
- **Properties list** with count badge, search, filter/sort, "Add work item type" button
- Each property row: name, "Global" badge, description, type badge (# Number, ⊙ Dropdown, etc.), linked-types count, active toggle, `...` menu

### Work Item Type Expanded View (Types tab)
- Left: main list of types
- Right side panel: **Properties panel** with "Add" button
  - Lists all workspace properties available to link
  - Shows: property name, type badge (# Number, Global)
- In the expanded type: shows linked properties with "Mandatory", "Active" badges and `...` action

### Create/Edit Work Item Type Modal
- Icon picker (emoji/color/lucide icon)
- Name field
- Description field

### Create New Custom Property Modal
- Text label input
- Short description textarea
- Property type dropdown (Select type)
- "Cancel" / "Create" buttons

---

## What Is Complete vs. In Progress

### Done
- New TypeScript types (`packages/types/src/work-item-types/`)
- Service classes (`packages/services/src/work-item-types/`)
- Store schemas and hooks defined
- **Store implementation** — MobX observable stores with ID-based tracking (see [Store Architecture](#store-architecture) below)
- **Instance-owned updates** — `updateType()` / `updateProperty()` / `linkProperties()` / `unlinkProperty()` / `reorderProperty()` live on instances, not stores. Base instances define protected templates (`update()`, `link()`, `unlink()`) for optimistic update + rollback; concrete instances bind the service. Stores only handle create/delete/fetch.
- **Instance-owned permissions** — `canEdit`, `canDelete`, `canEnableDisable`, `canLinkProperties`, `canUnlinkProperties`, `canReorderProperties` are computed getters on instances. Role-getter functions are dependency-injected from root store → sub-store → instance constructor. Store-level `canCreate` and `canView` remain on stores (no instance exists for those checks).
- **Simplified list components** — List items receive the instance and read permissions / call updates directly. Only `edit` (UI state) and `delete` (store op) are passed as actions from parents.
- Pages and routing set up
- Workspace settings root component with tab navigation
- Types tab content — **wired to real store data**, CRUD working
- Properties tab content — **wired to real store data**, CRUD working
- Property linking/unlinking from types tab — **working**
- Custom properties component library (`apps/web/core/components/custom-properties/`)
- All attribute type UIs (text, number, dropdown, boolean, date, member, formula, url)
- Constants and utility functions updated
- Centralized data fetching in workspace-wrapper (SWR)
- Backend pagination removed from properties list endpoint

### In Progress / Not Started
- Project-level work item types (import from workspace) — import/remove working, UI wired to real store data
- Search, filter, sort on types/properties lists
- "Allow projects to create" toggle logic
- Feature flag enable/disable flow for workspace
- Right-side panel for drag-and-drop property linking (current UI uses modal)

---

## Store Architecture

### ID-Based Tracking Pattern

The core architectural pattern uses a **central data Map** at the root store level with **scope-specific ID arrays** in sub-stores for efficient lookups:

```
RootWorkItemTypesStore
├── data: Map<string, BaseWorkItemTypeInstanceSchema>     ← central source of truth
├── get(typeId): instance from data Map (computedFn)
├── addOrMutate(typeId, instance): create or update
├── remove(typeId): delete from Map
│
├── WorkspaceWorkItemTypesStore
│   ├── workspaceTypeIds: Map<string, string[]>           ← IDs per workspace
│   └── getWorkItemTypesByWorkspaceSlug(slug):
│         resolves IDs → instances via args.get()
│
└── ProjectWorkItemTypesStore
    ├── projectTypeIds: Map<string, string[]>             ← IDs per project
    └── getWorkItemTypesByProjectId(projectId):
          resolves IDs → instances via args.get()
```

The same pattern applies to `RootCustomPropertiesStore` → `WorkspaceCustomPropertiesStore` / `ProjectCustomPropertiesStore`. `RootCustomPropertiesStore` also exposes `getByIds(ids: string[])` for batch lookups (used by the UI to resolve linked property IDs to instances).

**Why this pattern:** Sub-stores previously filtered `allTypes`/`allProperties` arrays on every access (O(n) per query). The ID Map pattern gives O(1) lookups and the scope ID arrays maintain proper membership tracking across create/delete operations.

### Abstract/Concrete Instance Pattern

Instances own their own updates and permissions. The base level is entity-agnostic (no knowledge of workspaceSlug, projectId). Concrete instances bind the service and permission logic using their own fields.

```
BaseWorkItemTypeInstance (abstract)
├── Observable properties: id, name, is_active, properties, etc.
├── Computed: asJSON, workspaceSlug, linkedPropertyIds
├── Protected templates (optimistic update + rollback):
│   ├── update(callback, data) — for updateType()
│   ├── link(callback, properties) — for linkProperties()
│   └── unlink(callback, propertyId) — for unlinkProperty()
├── Concrete: reorderProperty(propertyId, newSortOrder) — delegates to updateType()
├── Abstract actions: updateType(), linkProperties(), unlinkProperty()
├── Abstract permissions: canEdit, canDelete, canEnableDisable, canLinkProperties, canUnlinkProperties, canReorderProperties
│
├── WorkspaceWorkItemTypeInstance (concrete)
│   ├── updateType() → this.update(() => workspaceTypeService.update(...), data)
│   ├── linkProperties() → this.link(() => workspaceTypeService.linkProperty(...), properties)
│   ├── unlinkProperty() → this.unlink(() => workspaceTypeService.unlinkProperty(...), propertyId)
│   └── canEdit/canDelete/canEnableDisable/canLink*/canUnlink*/canReorder* → checks workspace ADMIN role
│
└── ProjectWorkItemTypeInstance (concrete)
    ├── updateType() → this.update(() => projectTypeService.update(...), data)
    ├── linkProperties() → this.link(() => projectTypeService.linkProperty(...), properties)
    ├── unlinkProperty() → this.unlink(() => projectTypeService.unlinkProperty(...), propertyId)
    └── canEdit/canDelete/canEnableDisable/canLink*/canUnlink*/canReorder* → checks project ADMIN role

BaseCustomPropertyInstance<T> (abstract, generic over CustomPropertyType)
├── Observable properties: id, name, property_type, settings, etc.
├── Computed: asJSON, sortedActivePropertyOptions, workspaceSlug
├── Protected: update() — optimistic update + rollback template
├── Abstract: updateProperty(data: Partial<CustomProperty<T>>) — subclass must implement
├── Abstract permissions: canEdit, canDelete, canEnableDisable
│
└── WorkItemCustomPropertyInstance<T> (concrete)
    ├── updateProperty() → constructs payload from this.workspaceSlug + this.id, calls workspacePropertiesService.update()
    └── canEdit/canDelete/canEnableDisable → checks workspace ADMIN role via getWorkspaceRoleByWorkspaceSlug()
```

**Key design choices:**
- `updateType()` / `updateProperty()` are on the base interface so UI code can call `instance.updateType(...)` / `instance.updateProperty(...)` directly without casting to workspace/project-specific types.
- `updateType()` takes just `Partial<TWorkItemType>` (not a full payload with workspaceSlug/typeId). The instance constructs the full service payload internally using its own fields.
- Permissions are on instances, not stores. The instance receives a role-getter function via constructor args and checks the role itself. Store-level `canCreate` and `canView` remain on stores (no instance exists when checking these).
- Role-getter functions are dependency-injected from the root store through sub-stores to instances at construction time.

### Read-Only Proxy for Project-Level Instances

Project stores (`ProjectWorkItemTypesStore`, `ProjectCustomPropertiesStore`) resolve instances from the same central data Map as workspace stores. Since workspace admins have `canEdit: true` on the original instances, project settings would incorrectly show edit controls.

**Solution:** `asReadOnly()` (`packages/shared-state/src/store/work-item-types/instances/as-read-only.ts`) wraps instances in a JS Proxy that intercepts all `can*` permission getters and returns `false`:

```ts
export function asReadOnly<T extends object>(instance: T): T {
  return new Proxy(instance, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && prop.startsWith("can")) return false;
      return Reflect.get(target, prop, receiver);
    },
  });
}
```

Applied in both project stores' getter methods:
- `ProjectWorkItemTypesStore.getWorkItemTypesByProjectId()` wraps each instance in `asReadOnly()`
- `ProjectCustomPropertiesStore.getPropertiesByProjectId()` wraps each instance in `asReadOnly()`

**Convention:** Uses the `can` prefix pattern (matching abstract getters in `BaseWorkItemTypeInstance` and `BaseCustomPropertyInstance`) so new permission getters are automatically covered.

**MobX compatibility:** Non-permission properties delegate via `Reflect.get(target, prop, receiver)`, which invokes MobX's observable getters on the target. MobX's internal `$mobx` admin (a Symbol-keyed data property) resolves correctly through the Proxy, so `observer()` components track dependencies as expected. Permission overrides return a static `false` — no reactivity needed for those.

**UI effect:** Components conditionally render action controls (Switch, quick-action menus, link/unlink buttons) based on `can*` getters. When all permissions are `false`, project settings show types and properties as read-only cards.

### Optimistic Update Pattern

Both `BaseWorkItemTypeInstance` and `BaseCustomPropertyInstance` use protected template methods for optimistic updates with rollback. `BaseWorkItemTypeInstance` has three templates — `update()`, `link()`, and `unlink()` — each following the same pattern:

```ts
// update() — for updateType() (returns TWorkItemTypeResponse)
protected update = async (callback, data) => {
  const originalData = cloneDeep(this.asJSON);
  try {
    this.mutateProperties(data);
    const response = await callback();
    return response;
  } catch (error) {
    this.mutateProperties(originalData);
    throw error;
  }
};

// link() — for linkProperties() (appends new refs, returns void)
protected link = async (callback, properties) => {
  const newRefs = Object.entries(properties).map(([id, sortOrder]) => ({ [id]: sortOrder }));
  const updatedProperties = [...(this.properties ?? []), ...newRefs];
  const originalData = cloneDeep(this.asJSON);
  try {
    this.mutateProperties({ properties: updatedProperties });
    await callback();
  } catch (error) {
    this.mutateProperties(originalData);
    throw error;
  }
};

// unlink() — for unlinkProperty() (filters out ref, returns void)
protected unlink = async (callback, propertyId) => {
  const updatedProperties = (this.properties ?? []).filter((ref) => Object.keys(ref)[0] !== propertyId);
  const originalData = cloneDeep(this.asJSON);
  try {
    this.mutateProperties({ properties: updatedProperties });
    await callback();
  } catch (error) {
    this.mutateProperties(originalData);
    throw error;
  }
};
```

Concrete instances call these templates, passing the service call as the callback. The instance constructs the full service payload internally — the caller only provides the data to change. `reorderProperty()` is a concrete method on the base class that delegates to `updateType()`.

### Centralized Data Fetching

All workspace-level data is fetched once in `workspace-wrapper.tsx` via SWR:
```ts
// apps/web/core/layouts/auth-layout/workspace-wrapper.tsx
useSWR(
  isWorkspaceWorkItemTypesEnabled ? `WORKSPACE_WORK_ITEM_TYPES_${workspaceSlug}` : null,
  () => fetchAllWorkspaceWorkItemTypes(workspaceSlug),
  { revalidateIfStale: false, revalidateOnFocus: false }
);
useSWR(
  isWorkspaceWorkItemTypesEnabled ? `WORKSPACE_CUSTOM_PROPERTIES_${workspaceSlug}` : null,
  () => fetchAllWorkspaceCustomProperties(workspaceSlug),
  { revalidateIfStale: false, revalidateOnFocus: false }
);
```

UI tab components (types-tab-content, properties-tab-content) do NOT fetch data themselves — they only consume from the store.

### Loader States

```ts
loaderMap: Map<string, "init-loader" | "mutation" | "loaded">

// "init-loader" — first-time fetch, show skeleton/spinner
// "mutation" — refetching after an action, show existing data
// "loaded" — ready
```

### MobX Observable Configuration

- `observable.ref`: Primitives and references (id, name, is_active, etc.)
- `observable`: Arrays and nested objects (logo_props, properties, propertyOptions)
- `computed`: Derived values (asJSON, linkedPropertyIds, sortedActivePropertyOptions)
- `action`: All mutation methods
- `computedFn` (from mobx-utils): Memoized functions with arguments (getWorkItemTypesByWorkspaceSlug, etc.)

---

## Service Payload Types

Defined in `packages/types/src/work-item-types/services.ts`:

```ts
// Work Item Type CRUD
TCreateWorkspaceWorkItemTypePayload  { workspaceSlug, data: TWorkItemType }
TUpdateWorkspaceWorkItemTypePayload  { workspaceSlug, typeId, data: TWorkItemType }
TDeleteWorkspaceWorkItemTypePayload  { workspaceSlug, typeId }

// Property Linking (batch — supports multiple properties per call)
TLinkPropertyToGlobalTypePayload     { workspaceSlug, typeId, properties: Record<string, number> }
TUnlinkPropertyFromGlobalTypePayload { workspaceSlug, typeId, propertyId }

// Custom Property CRUD
TCreateGlobalPropertyPayload         { workspaceSlug, data: TWorkItemPropertyPayload }
TUpdateGlobalPropertyPayload         { workspaceSlug, propertyId, data: TWorkItemPropertyPayload }
TDeleteGlobalPropertyPayload         { workspaceSlug, propertyId }
```

---

## Backend Views

### `WorkspaceWorkItemPropertyEndpoint` (`apps/api/plane/ee/views/app/issue_property/base.py`)

- **GET** (list): Returns flat array via `IssuePropertySerializer` — no pagination
- **GET** (detail with pk): Returns single property
- **POST**: Creates a new workspace property
- **PATCH**: Updates a property
- **DELETE**: Soft-deletes a property
- All methods check `@check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)`

### `WorkspaceWorkItemTypePropertyEndpoint` (`apps/api/plane/ee/views/app/issue_property/type.py`)

Manages the junction table (`IssueTypeProperty`) between types and properties:

- **POST** (to list URL): Links properties — expects body `{ "properties": { "<id>": sortOrder } }`. Uses `bulk_create` with `ignore_conflicts=True`
- **PATCH** (to detail URL with property ID): Updates `sort_order` of a linked property
- **DELETE** (to detail URL with property ID): Removes the type-property link

### URL Routing (`apps/api/plane/ee/urls/app/issue_property.py`)
```
workspaces/<str:slug>/work-item-types/<uuid:work_item_type_id>/work-item-properties/            → list/create
workspaces/<str:slug>/work-item-types/<uuid:work_item_type_id>/work-item-properties/<uuid:pk>/  → detail/update/delete
```

---

## UI Patterns

### Instance-Owned Operations in List Components

List item components (`WorkItemTypeListItem`, `CustomPropertyListItem`) receive the instance directly and call operations on it. They do NOT receive permissions or update actions from parent components:

```ts
// Work item type list item — uses instance directly
const handleEnableDisable = async (isActive: boolean) => {
  await workItemType.updateType({ is_active: isActive }); // instance owns the update
};

// Permissions are read from the instance
workItemType.canEdit       // instance knows if it can be edited
workItemType.canDelete     // instance knows if it can be deleted
workItemType.canEnableDisable // instance knows if it can be toggled
```

Only two actions are passed from parents: `edit` (UI state — opens modal) and `delete` (store operation — removes from store's ID tracking).

```ts
// Actions passed to list components
type WorkItemTypeListActions = {
  edit: (typeId: string) => void;        // UI state only
  delete: (typeId: string) => Promise<void>; // store operation
};
```

### Property Linking — Instance-Owned Operations

Property linking, unlinking, and reordering are **instance-owned** operations (not store operations). The list item component calls methods directly on the instance:

```ts
// In WorkItemTypeListItem — actions passed to LinkedPropertiesRoot
actions={{
  link: (propertyIds) => {
    const properties: Record<string, number> = {};
    for (const id of propertyIds) properties[id] = 65535; // default sort order
    return workItemType.linkProperties(properties);
  },
  unlink: (propertyId) => workItemType.unlinkProperty(propertyId),
  reorder: (propertyId, newSortOrder) => workItemType.reorderProperty(propertyId, newSortOrder),
}}
permissions={{
  canLink: workItemType.canLinkProperties,
  canUnlink: workItemType.canUnlinkProperties,
  canReorder: workItemType.canReorderProperties,
}}
```

All three operations are optimistic — the UI updates immediately and rolls back on error via the base class templates (`link()`, `unlink()`, `update()`).

### Resolving Linked Properties — Store-Agnostic UI Pattern

**Key principle:** List components (`WorkItemTypeListRoot`, `WorkItemTypeList`, `WorkItemTypeListItem`) are **store-agnostic**. They do not import or call hooks. Property data is resolved at the page level and passed down as props.

The page-level component (`types-tab-content`) provides two callbacks:
1. **`availableProperties`** — all workspace properties (from `useWorkspaceCustomProperties`)
2. **`getLinkedProperties(propertyIds: string[])`** — resolves IDs to property data (from `useCustomProperty().getCustomPropertiesByIds`)

```ts
// In types-tab-content.tsx (page level — store-aware)
const { getPropertiesByWorkspaceSlug } = useWorkspaceCustomProperties();
const { getCustomPropertiesByIds } = useCustomProperty();

const availableProperties = useMemo(
  () => getPropertiesByWorkspaceSlug(workspaceSlug).map((p) => p.asJSON),
  [getPropertiesByWorkspaceSlug, workspaceSlug]
);

const getLinkedProperties = useCallback(
  (propertyIds: string[]) => getCustomPropertiesByIds(propertyIds).map((p) => p.asJSON),
  [getCustomPropertiesByIds]
);
```

The list item uses `workItemType.linkedPropertyIds` (a computed on the instance) to get IDs, then calls the getter:

```ts
// In WorkItemTypeListItem (store-agnostic — no hooks)
const linkedProperties = useMemo(
  () => getLinkedProperties(workItemType.linkedPropertyIds),
  [getLinkedProperties, workItemType.linkedPropertyIds]
);
```

**`RootCustomPropertiesStore.getByIds(ids)`** powers this — a plain method (not `computedFn`) that resolves an array of IDs to instances from the central data Map. It was added specifically for this pattern.

The `linkedPropertyIds` computed on the instance provides a shortcut for just the IDs:
```ts
get linkedPropertyIds(): string[] {
  return (this.properties ?? []).map((ref) => Object.keys(ref)[0]).filter(Boolean);
}
```

---

## Bug Fixes Applied During Refactor

### 1. Property Update — "Property not found" Error
**Root cause:** `updateProperty` in `workspace-properties.store.ts` used `this.args.allProperties.find(...)` to locate the property. But `allProperties` is a computed array passed at construction time — with ID-based tracking, the sub-store resolves via ID maps, so `allProperties` may not reflect the current state.
**Fix:** Changed to `this.args.get(payload.propertyId)` which uses the reactive `get()` from the root store's data Map.

### 2. Property Linking — Empty Payload
**Root cause:** The service `linkProperty` was POSTing to `.../work-item-properties/{propertyId}/` (the detail URL) with no body. The backend POST endpoint is on the **list URL** and expects `{ "properties": { propertyId: sortOrder } }`.
**Fix:** Updated `TLinkPropertyToGlobalTypePayload` to `{ properties: Record<string, number> }`, changed service URL to list endpoint, and updated UI to batch property IDs into a dict with default sort order.

### 3. Properties List — Pagination Response
**Root cause:** The backend `WorkspaceWorkItemPropertyEndpoint.get()` used `self.paginate()` which wraps results in `{ results: [...], total_count, next_cursor, ... }`. The store's `list()` method called `data.forEach(...)` expecting a flat array.
**Fix:** Removed pagination from the backend — changed to `Response(serializer.data, status=status.HTTP_200_OK)` to return a flat array, matching the work item types endpoint pattern.

---

## Key Constraints & Decisions

1. **No touching old code:** Legacy `IIssueTypesStore`, old components in `work-item-types/` (non-new), `work-item-types-legacy/` types — leave these alone until full deprecation.
2. **Mock data for now:** `mock/template-data.ts` is used for UI development while store/API is being wired.
3. **Phase 1 scope:** Only workspace-level types + independent properties. Project-level type creation is Phase 2.
4. **Flexibility preserved:** The new `CustomProperty` model supports `is_global`, `project`, and `issue_type` fields to allow future project-scoped and type-scoped properties.
5. **Naming convention:** Always use new terminology — "work item type" (not "issue type"), "custom property" (not "issue property").
6. **Feature toggle:** The entire workspace work item types feature is gated behind `EWorkspaceFeatures.IS_WORK_ITEM_TYPES_ENABLED`.
7. **Instances own their operations:** Updates (`updateType`, `updateProperty`), property linking (`linkProperties`, `unlinkProperty`, `reorderProperty`), and permissions (`canEdit`, `canDelete`, `canEnableDisable`, `canLinkProperties`, `canUnlinkProperties`, `canReorderProperties`) live on instances, not stores. Base instances define protected templates (`update`, `link`, `unlink`) for optimistic update + rollback; concrete instances bind the service callback. Stores only handle operations where no instance exists yet (`create`, `fetchTypes`, `canCreate`, `canView`).
8. **Store-agnostic UI:** List components (`WorkItemTypeListRoot`, `WorkItemTypeList`, `WorkItemTypeListItem`) do **not** import store hooks. Property data (`availableProperties`, `getLinkedProperties`) is resolved at the page level (`types-tab-content`) and passed down as props. List items call instance methods directly for actions (`linkProperties`, `unlinkProperty`, `reorderProperty`) and read permissions from the instance (`canLinkProperties`, etc.). Only `edit` (UI state) and `delete` (store op) are passed as action callbacks from parents.
9. **Keep this document updated:** After completing a set of architectural changes, always update this document to reflect the new patterns, removed APIs, and changed data flows. This prevents future sessions from working with stale context.

---

## Key Files Quick Reference

### Type Definitions
| What | Where |
|------|-------|
| Work item type schemas | `packages/types/src/work-item-types/work-item-types.ts` |
| Custom property schemas | `packages/types/src/work-item-types/work-item-properties.ts` |
| Service payload types | `packages/types/src/work-item-types/services.ts` |
| Old/legacy type definitions | `packages/types/src/work-item-types-legacy/` |

### Store Implementation
| What | Where |
|------|-------|
| Root types store | `packages/shared-state/src/store/work-item-types/root.store.ts` |
| Base types store (abstract) | `packages/shared-state/src/store/work-item-types/base.store.ts` |
| Workspace types store | `packages/shared-state/src/store/work-item-types/workspace/store.ts` |
| Project types store | `packages/shared-state/src/store/work-item-types/project/store.ts` |
| Base type instance (abstract) | `packages/shared-state/src/store/work-item-types/instances/base-instance.ts` |
| Workspace type instance | `packages/shared-state/src/store/work-item-types/workspace/instance.ts` |
| Project type instance | `packages/shared-state/src/store/work-item-types/project/instance.ts` |
| Read-only proxy utility | `packages/shared-state/src/store/work-item-types/instances/as-read-only.ts` |
| Root properties store | `packages/shared-state/src/store/custom-properties/root.store.ts` |
| Base properties store (abstract) | `packages/shared-state/src/store/custom-properties/base.store.ts` |
| Workspace properties store | `packages/shared-state/src/store/custom-properties/workspace-properties.store.ts` |
| Project properties store | `packages/shared-state/src/store/custom-properties/project-properties.store.ts` |
| Base property instance (abstract) | `packages/shared-state/src/store/custom-properties/instances/instance.ts` |
| Work item property instance (concrete) | `packages/shared-state/src/store/custom-properties/instances/work-item-custom-property.instance.ts` |

### Services
| What | Where |
|------|-------|
| Workspace types service | `packages/services/src/work-item-types/workspace-types.service.ts` |
| Workspace properties service | `packages/services/src/work-item-types/workspace-properties.service.ts` |

### UI Components
| What | Where |
|------|-------|
| Workspace types tab | `apps/web/core/components/work-item-types-new/settings/workspace/types-tab-content.tsx` |
| Workspace properties tab | `apps/web/core/components/work-item-types-new/settings/workspace/properties-tab-content.tsx` |
| Project types tab (mock data) | `apps/web/core/components/work-item-types-new/settings/project/types-tab-content.tsx` |
| Workspace settings root | `apps/web/core/components/work-item-types-new/settings/workspace/root.tsx` |
| Custom properties list | `apps/web/core/components/custom-properties/list/root.tsx` |
| Data fetching (SWR) | `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx` |
| Linked properties types | `apps/web/core/components/work-item-types-new/settings/linked-properties/types.ts` |

### Hooks
| What | Where |
|------|-------|
| useWorkspaceWorkItemTypes | `apps/web/ee/hooks/store/work-item-types/use-workspace-work-item-types.ts` |
| useWorkItemType | `apps/web/ee/hooks/store/work-item-types/use-work-item-type.ts` |
| useWorkspaceCustomProperties | `apps/web/ee/hooks/store/custom-properties/use-workspace-custom-properties.ts` |
| useCustomProperty (`getCustomProperty`, `getCustomPropertiesByIds`) | `apps/web/ee/hooks/store/custom-properties/use-custom-property.ts` |

### Backend
| What | Where |
|------|-------|
| Properties endpoint view | `apps/api/plane/ee/views/app/issue_property/base.py` |
| Type-properties endpoint view | `apps/api/plane/ee/views/app/issue_property/type.py` |
| URL routing | `apps/api/plane/ee/urls/app/issue_property.py` |

### Other
| What | Where |
|------|-------|
| Constants | `packages/constants/src/work-item-properties.ts` |
| Utilities | `packages/utils/src/work-item-properties.ts`, `packages/utils/src/custom-properties.ts` |
| Workspace settings page | `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/work-item-types/page.tsx` |
| Mock data | `apps/web/core/components/work-item-types-new/mock/template-data.ts` |
