import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { merge } from "lodash-es";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
// plane imports
import {
  EProjectPriority,
  PROJECT_TEMPLATE_TRACKER_ELEMENTS,
  PROJECT_UNSPLASH_COVERS,
  RANDOM_EMOJI_CODES,
} from "@plane/constants";
import { usePreventOutsideClick } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import {
  EIssuePropertyType,
  IIssueProperty,
  IIssueType,
  TIssuePropertyValues,
  TProjectTemplateForm,
  TProjectTemplateFormData,
} from "@plane/types";
import { Button } from "@plane/ui";
import {
  cn,
  generateAdditionalProjectTemplateFormData,
  projectTemplateFormGettersHelpers,
  processWorkItemCustomProperties,
  projectTemplateDataToSanitizedFormData,
  TProjectSanitizationResult,
} from "@plane/utils";
// root store
import { useMember } from "@/hooks/store/use-member";
import { useAppRouter } from "@/hooks/use-app-router";
import { rootStore } from "@/lib/store-context";
// plane web imports
import { COMMON_BUTTON_CLASS_NAME } from "@/plane-web/components/templates/settings/common";
import { TemplateDetails } from "@/plane-web/components/templates/settings/common/form/template-details";
import { WorkItemBlueprintListRoot } from "@/plane-web/components/templates/settings/work-item/blueprint/list/root";
import { useProjectTemplates, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { IssuePropertyOption } from "@/plane-web/store/issue-types/issue-property-option";
import { IssueType } from "@/plane-web/store/issue-types/issue-type";
// local imports
import { DiscardModal } from "../../discard-modal";
import { ProjectAttributes } from "./attributes";
import { ProjectEpicWorkItemType } from "./epics";
import { ProjectFeatures } from "./features";
import { ProjectLabels } from "./labels";
import { ProjectTemplateLoader } from "./loader";
import { ProjectDetails } from "./project-details";
import { ProjectStates } from "./states";
import { ProjectWorkItemTypes } from "./work-item-types/root";

export enum EProjectFormOperation {
  CREATE = "create",
  UPDATE = "update",
}

export type TProjectTemplateFormSubmitData = {
  data: TProjectTemplateForm;
  workItemListCustomPropertyValues: Record<string, TIssuePropertyValues>;
};

export type TGetPreloadedDataProps = {
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

type TProjectTemplateFormRootProps = {
  workspaceSlug: string;
  templateId?: string;
  operation: EProjectFormOperation;
  handleFormCancel: () => void;
  handleFormSubmit: (data: TProjectTemplateFormSubmitData) => Promise<void>;
};

export const DEFAULT_PROJECT_TEMPLATE_FORM_DATA: TProjectTemplateForm = {
  template: {
    id: "",
    name: "",
    short_description: "",
  },
  project: {
    // basics
    id: "",
    name: "",
    description: "",
    logo_props: {
      in_use: "emoji",
      emoji: {
        value: RANDOM_EMOJI_CODES[Math.floor(Math.random() * RANDOM_EMOJI_CODES.length)],
      },
    },
    cover_image_url: PROJECT_UNSPLASH_COVERS[Math.floor(Math.random() * PROJECT_UNSPLASH_COVERS.length)],
    network: 2,
    project_lead: "",
    // attributes
    members: [],
    labels: [],
    states: [],
    workitem_types: {},
    epics: undefined,
    // work items
    workitems: [],
    // project grouping
    state_id: undefined,
    priority: EProjectPriority.NONE,
    start_date: undefined,
    target_date: undefined,
    // feature toggles
    cycle_view: false,
    module_view: false,
    issue_views_view: false,
    page_view: false,
    intake_view: false,
    intake_settings: {
      is_in_app_enabled: false,
      is_email_enabled: false,
      is_form_enabled: false,
    },
    is_time_tracking_enabled: false,
    is_issue_type_enabled: false,
    is_project_updates_enabled: false,
    is_epic_enabled: false,
    is_workflow_enabled: false,
  },
};

export const ProjectTemplateFormRoot = observer((props: TProjectTemplateFormRootProps) => {
  const { workspaceSlug, templateId, operation, handleFormCancel, handleFormSubmit } = props;
  const formRef = useRef<HTMLFormElement>(null);
  // router
  const router = useAppRouter();
  // ref
  const isDirtyRef = useRef<boolean>(false);
  // states
  const [bubbledHref, setBubbledHref] = useState<string | null>(null);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [preloadedData, setPreloadedData] = useState<TProjectTemplateForm | undefined>(undefined);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState<boolean>(false);
  const [templateInvalidIds, setTemplateInvalidIds] = useState<
    TProjectSanitizationResult<TProjectTemplateFormData>["invalid"] | undefined
  >(undefined);
  const [workItemListCustomPropertyValues, setWorkItemListCustomPropertyValues] = useState<
    Record<string, TIssuePropertyValues>
  >({});
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, getTemplateById } = useProjectTemplates();
  const {
    getUserDetails,
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  const { getProjectStateIdsByWorkspaceId } = useWorkspaceProjectStates();
  // form state
  const defaultValues = useMemo(
    () => ({
      ...DEFAULT_PROJECT_TEMPLATE_FORM_DATA,
      project: {
        ...DEFAULT_PROJECT_TEMPLATE_FORM_DATA.project,
        id: uuidv4(),
      },
    }),
    []
  );
  const methods = useForm<TProjectTemplateForm>({
    defaultValues,
  });
  const {
    watch,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
  // derived values
  const isDirty = Object.keys(methods.formState.dirtyFields).length > 0;

  /**
   * Reset the local states
   */
  const resetLocalStates = useCallback(() => {
    setPreloadedData(undefined);
    setTemplateInvalidIds(undefined);
  }, []);

  /**
   * Preload the work item custom properties values for the template
   */
  const preloadWorkItemCustomPropertyValues = useCallback(async () => {
    if (!templateId) return;
    const templateDetails = getTemplateById(templateId)?.asJSON;
    if (!templateDetails) return;
    const projectGetterHelpers = projectTemplateFormGettersHelpers(watch("project"));
    // Set the work item custom property values
    for (const workItem of templateDetails.template_data.workitems) {
      const workItemProperties = processWorkItemCustomProperties(
        workItem.type?.id,
        workItem.properties,
        projectGetterHelpers.getWorkItemTypeById
      );

      if (workItemProperties && workItem.id) {
        setWorkItemListCustomPropertyValues((prev) => ({
          ...prev,
          [workItem.id!]: workItemProperties, // Non-null assertion because we already checked for workItem.id
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTemplateById, templateId]);

  /**
   * Handle template data preload
   * This is used to generate form data from template details.
   */
  useEffect(() => {
    const generatedTemplateFormData = async () => {
      if (!templateId || loader === "init-loader") return;
      const templateDetails = getTemplateById(templateId)?.asJSON;
      if (!templateDetails) return;
      const projectGetterHelpers = projectTemplateFormGettersHelpers(watch("project"));

      setIsApplyingTemplate(true);

      // Get the sanitized project form data
      const { form: sanitizedProjectFormData, invalidIds } = await projectTemplateDataToSanitizedFormData({
        workspaceSlug,
        template: templateDetails,
        projectId: templateDetails.id ?? "",
        createWorkItemTypeInstance: (params) =>
          new IssueType({
            root: rootStore,
            ...params,
          }),
        createOptionInstance: (option) => new IssuePropertyOption(rootStore, option),
        getWorkspaceProjectStateIds: getProjectStateIdsByWorkspaceId,
        getWorkspaceMemberIds,
        getWorkItemTypeById: projectGetterHelpers.getWorkItemTypeById,
        getCustomPropertyById: projectGetterHelpers.getCustomPropertyById,
      });

      // Set the preloaded data and invalid IDs
      setPreloadedData(sanitizedProjectFormData);
      setTemplateInvalidIds(invalidIds);
      setIsApplyingTemplate(false);
    };

    if (templateId) {
      generatedTemplateFormData();
    } else {
      resetLocalStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, templateId, workspaceSlug, getTemplateById]);

  /**
   * Update default form data, whenever preloaded data is changed.
   */
  useEffect(() => {
    const updateDefaultFormData = async () => {
      const projectGetterHelpers = projectTemplateFormGettersHelpers(watch("project"));
      // Generate default form data
      const additionalDefaultValueForReset = await generateAdditionalProjectTemplateFormData({
        workspaceSlug: workspaceSlug?.toString(),
        projectId: preloadedData?.template?.id ?? "",
        createWorkItemTypeInstance: (params) =>
          new IssueType({
            root: rootStore,
            ...params,
          }),
        createOptionInstance: (option) => new IssuePropertyOption(rootStore, option),
        getWorkItemTypeById: projectGetterHelpers.getWorkItemTypeById,
        getCustomPropertyById: projectGetterHelpers.getCustomPropertyById,
      });
      // Reset the form with the default values
      if (preloadedData) {
        reset(merge({}, defaultValues, preloadedData));
        // Custom property values should be preloaded after the form is updated with the preloaded data since it depends on the work item types.
        await preloadWorkItemCustomPropertyValues();
      } else {
        // If no preloaded data is available, use the additional default values
        reset(merge({}, defaultValues, additionalDefaultValueForReset));
      }
    };

    updateDefaultFormData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedData]);

  /**
   * Handle template invalid ids change
   * @param key - The key of the invalid ids
   * @param invalidIds - The invalid ids
   */
  const handleTemplateInvalidIdsChange = useCallback(
    <K extends keyof TProjectTemplateFormData>(
      key: K,
      invalidIds: TProjectSanitizationResult<TProjectTemplateFormData>["invalid"][K]
    ) => {
      setTemplateInvalidIds((prev) => (prev ? { ...prev, [key]: invalidIds } : { [key]: invalidIds }));
    },
    []
  );

  /**
   * Handles the change of sub work item custom property values
   * @param workItemId - The work item id
   * @param customPropertyValues - The custom property values
   */
  const handleWorkItemListCustomPropertyValuesChange = useCallback(
    (workItemId: string, customPropertyValues: TIssuePropertyValues) => {
      setWorkItemListCustomPropertyValues((prev) => ({ ...prev, [workItemId]: customPropertyValues }));
    },
    []
  );

  /**
   * Handle form submit
   * @param data - The form data
   */
  const onSubmit = useCallback(
    async (data: TProjectTemplateForm) => {
      await handleFormSubmit({ data, workItemListCustomPropertyValues });
    },
    [handleFormSubmit, workItemListCustomPropertyValues]
  );

  /**
   * Handle form keydown
   * @param e - The keyboard event
   * @description This is used to handle the form keydown event.
   * @note We are disabling the default form submission on enter key press because there are multiple form fields and we don't want to trigger the default form submission.
   */
  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === "Enter") e.preventDefault();
      if (e.key === "Escape") {
        handleFormCancel();
      }
    },
    [handleFormCancel]
  );

  usePreventOutsideClick(
    formRef,
    (anchorElement: HTMLAnchorElement | null) => {
      if (!anchorElement || !anchorElement.href) return;

      if (isDirtyRef.current) {
        setIsDiscardModalOpen(true);
        setBubbledHref(anchorElement.href);
      } else {
        router.push(anchorElement.href);
      }
    },
    ["discard-modal-button"]
  );

  useEffect(() => {
    if (isDirty !== isDirtyRef.current) {
      isDirtyRef.current = isDirty;
    }
  }, [isDirty]);

  if (loader === "init-loader" || isApplyingTemplate || (templateId && !preloadedData)) {
    return <ProjectTemplateLoader />;
  }

  return (
    <>
      <DiscardModal
        isOpen={isDiscardModalOpen}
        onClose={() => setIsDiscardModalOpen(false)}
        onDiscard={() => {
          if (bubbledHref) {
            router.push(bubbledHref);
          }
        }}
      />
      <FormProvider {...methods}>
        <form onKeyDown={handleFormKeyDown} onSubmit={handleSubmit(onSubmit)} ref={formRef}>
          {/* Template Section */}
          <div className="space-y-4 w-full max-w-4xl py-page-y">
            <TemplateDetails
              fieldPaths={{
                name: "template.name",
                shortDescription: "template.short_description",
              }}
              validation={{
                name: {
                  required: t("templates.settings.form.project.template.name.validation.required"),
                  maxLength: t("templates.settings.form.project.template.name.validation.maxLength"),
                },
              }}
              placeholders={{
                name: t("templates.settings.form.project.template.name.placeholder"),
                shortDescription: t("templates.settings.form.project.template.description.placeholder"),
              }}
            />
          </div>
          <div className="border-t border-custom-border-100 size-full">
            <div className="w-full max-w-4xl py-page-y">
              {/* Project Details Section */}
              <div>
                {/* Project Details */}
                <div className="flex flex-col gap-y-4 py-6 w-full">
                  <ProjectDetails />
                </div>
                {/* Project Attributes */}
                <ProjectAttributes
                  workspaceSlug={workspaceSlug?.toString()}
                  templateInvalidIds={templateInvalidIds}
                  handleTemplateInvalidIdsChange={handleTemplateInvalidIdsChange}
                />
                {/* Project Features */}
                <ProjectFeatures />
                {/* Project States */}
                <ProjectStates
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={preloadedData?.template?.id ?? ""}
                />
                {/* Project Labels */}
                <ProjectLabels
                  workspaceSlug={workspaceSlug?.toString()}
                  projectId={preloadedData?.template?.id ?? ""}
                />
                {/* Project Work Item Types */}
                <ProjectWorkItemTypes
                  {...projectTemplateFormGettersHelpers(watch("project"))}
                  workspaceSlug={workspaceSlug?.toString()}
                  projectTemplateId={preloadedData?.template?.id}
                />
                {/* Project Epic Work Item Type */}
                <ProjectEpicWorkItemType />
                {/* Project Work Items */}
                <WorkItemBlueprintListRoot<TProjectTemplateForm>
                  {...projectTemplateFormGettersHelpers(watch("project"))}
                  borderVariant="strong"
                  emptyStateDescription={t("templates.empty_state.no_work_items.description")}
                  getUserDetails={getUserDetails}
                  handleWorkItemListInvalidIdsChange={(workItemsInvalidIds) =>
                    handleTemplateInvalidIdsChange("workitems", workItemsInvalidIds)
                  }
                  modalTitle={t("add_work_item")}
                  modalInputBorderVariant="primary"
                  sectionTitle={t("common.work_items")}
                  setWorkItemListCustomPropertyValues={handleWorkItemListCustomPropertyValuesChange}
                  workItemFieldPath="project.workitems"
                  workItemListCustomPropertyValues={workItemListCustomPropertyValues}
                  workItemListInvalidIds={templateInvalidIds?.workitems}
                  workspaceSlug={workspaceSlug?.toString()}
                  usePropsForAdditionalData
                />
              </div>
              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-8">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  className={cn(COMMON_BUTTON_CLASS_NAME)}
                  onClick={handleFormCancel}
                  disabled={isSubmitting}
                  data-ph-element={PROJECT_TEMPLATE_TRACKER_ELEMENTS.CREATE_UPDATE_FORM_CANCEL_BUTTON}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  size="sm"
                  className={cn("shadow-sm")}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  data-ph-element={PROJECT_TEMPLATE_TRACKER_ELEMENTS.CREATE_UPDATE_FORM_SUBMIT_BUTTON}
                >
                  {isSubmitting
                    ? t("common.confirming")
                    : operation === EProjectFormOperation.CREATE
                      ? t("templates.settings.form.project.button.create")
                      : t("templates.settings.form.project.button.update")}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </>
  );
});
