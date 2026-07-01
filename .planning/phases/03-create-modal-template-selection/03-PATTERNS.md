# Phase 03: Create Modal Template Selection - Pattern Map

**Mapped:** 2026-07-01
**Files analyzed:** 10
**Analogs found:** 10 / 10

## File Classification

| New/Modified File                                            | Role      | Data Flow                       | Closest Analog                                              | Match Quality |
| ------------------------------------------------------------ | --------- | ------------------------------- | ----------------------------------------------------------- | ------------- |
| `apps/web/ce/components/projects/create/template-select.tsx` | component | request-response + event-driven | `apps/web/core/components/dropdowns/project/base.tsx`       | role-match    |
| `apps/web/ce/components/projects/create/root.tsx`            | component | request-response                | `apps/web/ce/components/projects/create/root.tsx`           | exact         |
| `apps/web/core/components/project/create/header.tsx`         | component | event-driven                    | `apps/web/core/components/project/create/header.tsx`        | exact         |
| `apps/web/core/components/project/create-project-modal.tsx`  | component | event-driven                    | `apps/web/core/components/project/create-project-modal.tsx` | exact         |
| `apps/web/core/services/project/project.service.ts`          | service   | request-response                | `apps/web/core/services/project/project.service.ts`         | exact         |
| `apps/web/core/store/project/project.store.ts`               | store     | CRUD                            | `apps/web/core/store/project/project.store.ts`              | exact         |
| `packages/types/src/project/projects.ts`                     | model     | transform                       | `packages/types/src/project/projects.ts`                    | exact         |
| `packages/types/src/project/project_templates.ts`            | model     | transform                       | `packages/types/src/project/projects.ts`                    | role-match    |
| `packages/types/src/project/index.ts`                        | config    | transform                       | `packages/types/src/project/index.ts`                       | exact         |
| `packages/constants/src/fetch-keys.ts`                       | config    | transform                       | `packages/constants/src/fetch-keys.ts`                      | exact         |

## Pattern Assignments

### `apps/web/ce/components/projects/create/template-select.tsx` (component, request-response + event-driven)

**Analog:** `apps/web/core/components/dropdowns/project/base.tsx`

**Imports pattern** (lines 7-17):

```typescript
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CheckIcon, SearchIcon, ProjectIcon, ChevronDownIcon } from "@plane/propel/icons";
import { ComboDropDown } from "@plane/ui";
import { cn, sortBySelectedFirst } from "@plane/utils";
```

**Dropdown state + popper pattern** (lines 77-98):

```typescript
const dropdownRef = useRef<HTMLDivElement | null>(null);
const inputRef = useRef<HTMLInputElement | null>(null);
const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
const [query, setQuery] = useState("");
const [isOpen, setIsOpen] = useState(false);

const { styles, attributes } = usePopper(referenceElement, popperElement, {
  placement: placement ?? "bottom-start",
  modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
});
```

**Button pattern** (lines 190-220):

```typescript
<button
  ref={setReferenceElement}
  type="button"
  className={cn("clickable block h-full max-w-full outline-none", {
    "cursor-not-allowed text-secondary": disabled,
    "cursor-pointer": !disabled,
  })}
  onClick={handleOnClick}
  disabled={disabled}
>
  <DropdownButton className={buttonClassName} isActive={isOpen} tooltipHeading="Project">
    {!hideIcon && getProjectIcon(value)}
    <span className="max-w-40 truncate">{getDisplayName(value, placeholder)}</span>
    <ChevronDownIcon className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
  </DropdownButton>
</button>
```

**Options/search pattern** (lines 240-293):

```typescript
{isOpen && (
  <Combobox.Options className="fixed z-10" static>
    <div className="my-1 w-48 rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200 focus:outline-none">
      <div className="flex items-center gap-1.5 rounded-sm border border-subtle bg-surface-2 px-2">
        <SearchIcon className="h-3.5 w-3.5 text-placeholder" strokeWidth={1.5} />
        <Combobox.Input
          ref={inputRef}
          className="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          onKeyDown={searchInputKeyDown}
        />
      </div>
      <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
        {filteredOptions.length > 0 ? filteredOptions.map((option) => (
          <Combobox.Option key={option.value} value={option.value}>
            <span className="flex-grow truncate">{option.content}</span>
          </Combobox.Option>
        )) : <p className="px-1.5 py-1 text-placeholder italic">{t("no_matching_results")}</p>}
      </div>
    </div>
  </Combobox.Options>
)}
```

**SWR fetch pattern:** `apps/web/ce/components/projects/page.tsx` lines 23-27:

```typescript
useSWR(
  workspaceSlug && currentWorkspace ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
  workspaceSlug && currentWorkspace ? () => fetchProjects(workspaceSlug.toString()) : null,
  { revalidateIfStale: false, revalidateOnFocus: false }
);
```

**Planner notes:** This selector likely needs a local Combobox rather than plain `CustomSearchSelect` because Phase 03 requires pinned `No template`, inline error + `Retry`, no persistent checkmark treatment, and custom name/description rows. Copy the Plane classes and behavior from `ProjectDropdownBase`; use `CustomSearchSelect` only if those state slots stay clean.

---

### `apps/web/ce/components/projects/create/root.tsx` (component, request-response)

**Analog:** `apps/web/ce/components/projects/create/root.tsx`

**Imports/form ownership pattern** (lines 7-25):

```typescript
import { useState } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import type { TProject } from "@plane/types";
```

**Local state + form defaults pattern** (lines 37-50):

```typescript
export const CreateProjectForm = observer(function CreateProjectForm(props: TCreateProjectFormProps) {
  const { setToFavorite, workspaceSlug, data, onClose, handleNextStep, updateCoverImageStatus } = props;
  const { t } = useTranslation();
  const { addProjectToFavorites, createProject, updateProject } = useProject();
  const [shouldAutoSyncIdentifier, setShouldAutoSyncIdentifier] = useState(true);
  const methods = useForm<TProject>({
    defaultValues: { ...getProjectFormValues(), ...data },
    reValidateMode: "onChange",
  });
```

**Submit pattern to preserve** (lines 63-95):

```typescript
const onSubmit = async (formData: Partial<TProject>) => {
  formData.identifier = formData.identifier?.toUpperCase();
  const coverImage = formData.cover_image_url;
  let uploadedAssetUrl: string | null = null;

  if (coverImage) {
    const imageType = getCoverImageType(coverImage);
    if (imageType === "local_static") {
      try {
        uploadedAssetUrl = await uploadCoverImage(coverImage, {
          workspaceSlug: workspaceSlug.toString(),
          entityIdentifier: "",
          entityType: EFileAssetType.PROJECT_COVER,
          isUserAsset: false,
        });
      } catch (error) {
        console.error("Error uploading cover image:", error);
        setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: error instanceof Error ? error.message : "Failed to upload cover image" });
        return Promise.reject(error);
      }
    } else {
      formData.cover_image = coverImage;
      formData.cover_image_asset = null;
    }
  }

  return createProject(workspaceSlug.toString(), formData)
```

**Success and post-create flow** (lines 95-114):

```typescript
return createProject(workspaceSlug.toString(), formData).then(async (res) => {
  if (uploadedAssetUrl) {
    await updateCoverImageStatus(res.id, uploadedAssetUrl);
    await updateProject(workspaceSlug.toString(), res.id, { cover_image_url: uploadedAssetUrl });
  }
  setToast({
    type: TOAST_TYPE.SUCCESS,
    title: t("success"),
    message: t("project_created_successfully"),
  });
  if (setToFavorite) handleAddToFavorites(res.id);
  return handleNextStep(res.id);
});
```

**Error handling pattern** (lines 115-164):

```typescript
.catch((err) => {
  try {
    const errorData = err?.data ?? {};
    const nameError = errorData.name?.includes("PROJECT_NAME_ALREADY_EXIST");
    const identifierError = errorData?.identifier?.includes("PROJECT_IDENTIFIER_ALREADY_EXIST");
    const nameSpecialCharError = errorData?.name?.includes("PROJECT_NAME_CANNOT_CONTAIN_SPECIAL_CHARACTERS");

    if (nameError || identifierError || nameSpecialCharError) {
      // existing field-specific toasts
    } else {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  } catch (error) {
    console.error("Error processing API error:", error);
    setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
  }
});
```

**Planner notes:** Add `selectedTemplate` local state here, pass it to the header selector, and build a typed payload such as `{ ...formData, ...(selectedTemplate ? { template_id: selectedTemplate.id } : {}) }`. Do not initialize from `templateId`; D-18 says every newly opened modal starts with no selection.

---

### `apps/web/core/components/project/create/header.tsx` (component, event-driven)

**Analog:** `apps/web/core/components/project/create/header.tsx`

**Imports pattern** (lines 7-22):

```typescript
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon } from "@plane/propel/icons";
import type { IProject } from "@plane/types";
import { getTabIndex } from "@plane/utils";
import { CoverImage } from "@/components/common/cover-image";
import { ImagePickerPopover } from "@/components/core/image-picker-popover";
import { ProjectTemplateSelect } from "@/plane-web/components/projects/create/template-select";
```

**Existing selector slot** (lines 24-31, 57-60):

```typescript
type Props = {
  handleClose: () => void;
  isMobile?: boolean;
  handleFormOnChange?: () => void;
  isClosable?: boolean;
  handleTemplateSelect?: () => void;
  showActionButtons?: boolean;
};

{showActionButtons && (
  <div className="absolute top-2.5 left-2.5">
    <ProjectTemplateSelect onClick={handleTemplateSelect} />
  </div>
)}
```

**Planner notes:** Extend the props from `handleTemplateSelect?: () => void` to selector data props (`workspaceSlug`, `selectedTemplate`, `onChange`, disabled if needed) and keep the absolute cover placement unchanged.

---

### `apps/web/core/components/project/create-project-modal.tsx` (component, event-driven)

**Analog:** `apps/web/core/components/project/create-project-modal.tsx`

**Modal reset pattern** (lines 37-48):

```typescript
export function CreateProjectModal(props: Props) {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug, data, templateId } = props;
  const [currentStep, setCurrentStep] = useState<EProjectCreationSteps>(EProjectCreationSteps.CREATE_PROJECT);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(EProjectCreationSteps.CREATE_PROJECT);
      setCreatedProjectId(null);
    }
  }, [isOpen]);
```

**Form handoff pattern** (lines 68-83):

```typescript
<ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXXXL}>
  {currentStep === EProjectCreationSteps.CREATE_PROJECT && (
    <CreateProjectForm
      setToFavorite={setToFavorite}
      workspaceSlug={workspaceSlug}
      onClose={onClose}
      updateCoverImageStatus={handleCoverImageStatusUpdate}
      handleNextStep={handleNextStep}
      data={data}
      templateId={templateId}
    />
  )}
  {currentStep === EProjectCreationSteps.FEATURE_SELECTION && (
    <ProjectFeatureUpdate projectId={createdProjectId} workspaceSlug={workspaceSlug} onClose={onClose} />
  )}
</ModalCore>
```

**Planner notes:** The modal already resets project creation step on open. Phase 03 can leave `templateId` unused downstream or remove that pass-through if the planner wants stricter D-18 enforcement; do not change feature-selection behavior.

---

### `apps/web/core/services/project/project.service.ts` (service, request-response)

**Analog:** `apps/web/core/services/project/project.service.ts`

**Imports and constructor pattern** (lines 7-24):

```typescript
import { API_BASE_URL } from "@plane/constants";
import type {
  GithubRepositoriesResponse,
  IProjectUserPropertiesResponse,
  ISearchIssueResponse,
  TProjectAnalyticsCount,
  TProjectAnalyticsCountParams,
  TProjectIssuesSearchParams,
} from "@plane/types";
import type { TProject, TPartialProject } from "@plane/types";
import { APIService } from "@/services/api.service";

export class ProjectService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
```

**Create method pattern** (lines 27-33):

```typescript
async createProject(workspaceSlug: string, data: Partial<TProject>): Promise<TProject> {
  return this.post(`/api/workspaces/${workspaceSlug}/projects/`, data)
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response;
    });
}
```

**List method pattern** (lines 47-60):

```typescript
async getProjectsLite(workspaceSlug: string): Promise<TPartialProject[]> {
  return this.get(`/api/workspaces/${workspaceSlug}/projects/`)
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });
}

async getProjects(workspaceSlug: string): Promise<TProject[]> {
  return this.get(`/api/workspaces/${workspaceSlug}/projects/details/`)
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });
}
```

**Planner notes:** Add `getProjectTemplates(workspaceSlug): Promise<TProjectTemplate[]>` beside the project list methods, using `/api/workspaces/${workspaceSlug}/project-templates/` and the same `.then(response?.data).catch(...)` style. Prefer `error?.response?.data` for the list endpoint and keep `createProject` error shape unchanged unless all callers are updated.

---

### `apps/web/core/store/project/project.store.ts` (store, CRUD)

**Analog:** `apps/web/core/store/project/project.store.ts`

**Store interface pattern** (lines 54-72):

```typescript
// helper actions
processProjectAfterCreation: (workspaceSlug: string, data: TProject) => void;

// fetch actions
fetchPartialProjects: (workspaceSlug: string) => Promise<TPartialProject[]>;
fetchProjects: (workspaceSlug: string) => Promise<TProject[]>;
fetchProjectDetails: (workspaceSlug: string, projectId: string) => Promise<TProject>;

// CRUD actions
createProject: (workspaceSlug: string, data: Partial<TProject>) => Promise<TProject>;
updateProject: (workspaceSlug: string, projectId: string, data: Partial<TProject>) => Promise<TProject>;
deleteProject: (workspaceSlug: string, projectId: string) => Promise<void>;
```

**Create action pattern** (lines 529-544):

```typescript
/**
 * Creates a project in the workspace and adds it to the store
 * @param workspaceSlug
 * @param data
 * @returns Promise<TProject>
 */
createProject = async (workspaceSlug: string, data: any) => {
  try {
    const response = await this.projectService.createProject(workspaceSlug, data);
    this.processProjectAfterCreation(workspaceSlug, response);
    return response;
  } catch (error) {
    console.log("Failed to create project from project store");
    throw error;
  }
};
```

**Planner notes:** Do not add template catalog or selected-template observables here. Only tighten `createProject` input from `any`/`Partial<TProject>` to the new create-payload type if needed so the form can submit optional `template_id` without `as any`.

---

### `packages/types/src/project/projects.ts` (model, transform)

**Analog:** `packages/types/src/project/projects.ts`

**Imports and project shape pattern** (lines 7-19, 45-62):

```typescript
import type { TLogoProps } from "../common";
import type { TUserPermissions } from "../enums";
import type { TStateGroups } from "../state";
import type { IUser, IUserLite } from "../users";
import type { IWorkspace } from "../workspace";

export interface IProject extends IPartialProject {
  cover_image_asset?: null;
  cover_image?: string;
  readonly cover_image_url?: string;
  default_assignee?: IUser | string | null;
  default_state?: string | null;
  description?: string;
  estimate?: string | null;
  anchor?: string | null;
  is_favorite?: boolean;
  members?: string[];
  timezone?: string;
  next_work_item_sequence?: number;
}
```

**Type alias export pattern** (lines 176-178):

```typescript
export type TPartialProject = IPartialProject;

export type TProject = TPartialProject & IProject;
```

**Backend payload validation source:** `apps/api/plane/app/serializers/project.py` lines 34-45 and 116-121:

```python
template_id = serializers.UUIDField(
    required=False,
    allow_null=True,
    write_only=True,
)

validated_data.pop("template_id", None)
```

**Planner notes:** Add a narrow create payload type near the project aliases, for example `export type TProjectCreatePayload = Partial<TProject> & { template_id?: string };`. Phase 03 decisions require omitting `template_id` when no template is selected, not sending `null`.

---

### `packages/types/src/project/project_templates.ts` (model, transform)

**Analog:** `packages/types/src/project/projects.ts`

**New file pattern:** Start with the same AGPL header and exported type/interface conventions as `projects.ts` lines 1-19. Keep frontend fields aligned to backend read serializer.

**Backend read serializer source:** `apps/api/plane/app/serializers/project_template.py` lines 584-610:

```python
class ProjectTemplateSerializer(BaseSerializer):
    """Read serializer used by the workspace catalog list endpoint."""

    workspace = serializers.SerializerMethodField()

    class Meta:
        model = ProjectTemplate
        fields = [
            "id",
            "name",
            "description",
            "template_type",
            "system_key",
            "is_system",
            "is_active",
            "payload",
            "workspace",
            "start_offset_days",
            "target_offset_days",
            "duration_days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_workspace(self, obj):
        return str(obj.workspace_id) if obj.workspace_id else None
```

**Planner notes:** If created, export a `TProjectTemplate` type with at least `id`, `name`, and `description`, plus the serializer fields above for correctness. The selector must render only `name` and optional `description`.

---

### `packages/types/src/project/index.ts` (config, transform)

**Analog:** `packages/types/src/project/index.ts`

**Barrel export pattern** (lines 7-10):

```typescript
export * from "./activity";
export * from "./project_filters";
export * from "./projects";
export * from "./project_link";
```

**Planner notes:** Add `export * from "./project_templates";` only if `project_templates.ts` is created. Keep this as a simple barrel export with no logic.

---

### `packages/constants/src/fetch-keys.ts` (config, transform)

**Analog:** `packages/constants/src/fetch-keys.ts`

**Workspace fetch-key pattern** (lines 56-72):

```typescript
export const USER_WORKSPACES_LIST = "USER_WORKSPACES_LIST";

export const WORKSPACE_PARTIAL_PROJECTS = (workspaceSlug: string) =>
  `WORKSPACE_PARTIAL_PROJECTS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_MEMBERS = (workspaceSlug: string) => `WORKSPACE_MEMBERS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_MODULES = (workspaceSlug: string) => `WORKSPACE_MODULES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_CYCLES = (workspaceSlug: string) => `WORKSPACE_CYCLES_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_LABELS = (workspaceSlug: string) => `WORKSPACE_LABELS_${workspaceSlug.toUpperCase()}`;

export const WORKSPACE_ESTIMATES = (workspaceSlug: string) => `WORKSPACE_ESTIMATES_${workspaceSlug.toUpperCase()}`;
```

**Planner notes:** If centralizing the selector SWR key, add a workspace-level key such as `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)`. If the planner keeps the key local to the selector, no constants change is required.

## Shared Patterns

### Service-Layer API Access

**Source:** `apps/web/core/services/project/project.service.ts`
**Apply to:** `ProjectTemplateSelect` fetch path through `ProjectService`, not inline `fetch`

```typescript
return this.get(`/api/workspaces/${workspaceSlug}/projects/details/`)
  .then((response) => response?.data)
  .catch((error) => {
    throw error?.response?.data;
  });
```

### SWR Request Keys And Retry

**Source:** `apps/web/ce/components/projects/page.tsx` lines 23-27; `apps/web/core/layouts/auth-layout/project-wrapper.tsx` lines 90-94
**Apply to:** Template catalog loading/error/retry state in `template-select.tsx`

```typescript
useSWR(
  currentUserData?.id ? PROJECT_MEMBER_PREFERENCES(projectId, currentProjectRole) : null,
  currentUserData?.id ? () => fetchProjectUserProperties(workspaceSlug, projectId) : null,
  { revalidateIfStale: false, revalidateOnFocus: false }
);
```

### Dropdown Closing, Escape, And Outside Click

**Source:** `apps/web/core/hooks/use-dropdown.ts` lines 44-71
**Apply to:** Local Combobox implementation in `template-select.tsx`

```typescript
const handleClose = () => {
  if (!isOpen) return;
  setIsOpen(false);
  onClose?.();
  setQuery?.("");
};

const toggleDropdown = () => {
  if (!isOpen) onOpen?.();
  setIsOpen((prevIsOpen) => !prevIsOpen);
  if (isOpen) onClose?.();
};

const handleKeyDown = useDropdownKeyDown(toggleDropdown, handleClose);
useOutsideClickDetector(dropdownRef, handleClose);
```

### Backend Template Catalog Contract

**Source:** `apps/api/plane/app/urls/workspace.py` lines 261-266 and `apps/api/plane/app/views/workspace/project_template.py` lines 78-82
**Apply to:** `ProjectService.getProjectTemplates`

```python
path(
    "workspaces/<str:slug>/project-templates/",
    WorkspaceProjectTemplateViewSet.as_view({"get": "list", "post": "create"}),
    name="workspace-project-templates",
)

@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
def list(self, request, slug):
    queryset = self.get_queryset().order_by("is_system", "name")
    serializer = ProjectTemplateSerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
```

### Create Submit Error Handling

**Source:** `apps/web/ce/components/projects/create/root.tsx` lines 115-164
**Apply to:** Keep Project create failure toasts unchanged; template list failures stay inline in dropdown

```typescript
.catch((err) => {
  try {
    const errorData = err?.data ?? {};
    const nameError = errorData.name?.includes("PROJECT_NAME_ALREADY_EXIST");
    const identifierError = errorData?.identifier?.includes("PROJECT_IDENTIFIER_ALREADY_EXIST");
    // field-specific toasts, else generic toast
  } catch (error) {
    console.error("Error processing API error:", error);
    setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
  }
});
```

## No Analog Found

| File | Role | Data Flow | Reason                                                                      |
| ---- | ---- | --------- | --------------------------------------------------------------------------- |
| None | —    | —         | Every required or optional Phase 03 frontend file has a close local analog. |

## Implementation Guardrails For Planner

- `ProjectTemplateSelect` should use `ProjectIcon`, `ChevronDownIcon`, and `SearchIcon` from `@plane/propel/icons`.
- Keep `No template` as the first selectable row in every loading, empty, error, and results state.
- Do not show built-in/custom badges, group headers, counts, checkmark-only summaries, or detailed payload previews.
- Do not call `setToast` for template catalog fetch failures; render `Could not load templates` and `Retry` inline.
- Do not add selected-template state to `ProjectStore`; at most update create payload typing.
- Omit `template_id` entirely when no template is selected.

## Metadata

**Analog search scope:** `apps/web/ce/components/projects/create`, `apps/web/core/components/project`, `apps/web/core/components/dropdowns`, `apps/web/core/services/project`, `apps/web/core/store/project`, `packages/ui/src/dropdowns`, `packages/types/src/project`, `packages/constants/src`, backend serializer/view URL contract.
**Files scanned:** 18
**Pattern extraction date:** 2026-07-01
