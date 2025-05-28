import React, { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
// plane imports
import { DEFAULT_WORK_ITEM_FORM_VALUES, EWorkItemConversionType, EWorkItemTypeEntity } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ISearchIssueResponse, TIssue, TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import {
  extractAndSanitizeCustomPropertyValuesFormData,
  extractAndSanitizeWorkItemFormData,
  getPropertiesDefaultValues,
} from "@plane/utils";
// ce imports
import { TIssueModalProviderProps } from "@/ce/components/issues";
// components
import {
  IssueModalContext,
  TActiveAdditionalPropertiesProps,
  TCreateUpdatePropertyValuesProps,
  THandleProjectEntitiesFetchProps,
  THandleTemplateChangeProps,
  TPropertyValuesValidationProps,
} from "@/components/issues";
// plane web hooks
import { useLabel, useMember, useModule, useProjectState } from "@/hooks/store";
import { useIssuePropertiesActivity, useIssueTypes, useWorkItemTemplates } from "@/plane-web/hooks/store";
// plane web services
import { DraftIssuePropertyValuesService, IssuePropertyValuesService } from "@/plane-web/services/issue-types";
import { ConversionToastActionItems } from "../conversion-toast-action-items";

const issuePropertyValuesService = new IssuePropertyValuesService();
const draftIssuePropertyValuesService = new DraftIssuePropertyValuesService();

export const IssueModalProvider = observer((props: TIssueModalProviderProps) => {
  const { children, templateId, dataForPreload } = props;
  // states
  const [workItemTemplateId, setWorkItemTemplateId] = useState<string | null>(templateId ?? null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState<boolean>(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | null>(null);
  const [issuePropertyValues, setIssuePropertyValues] = useState<TIssuePropertyValues>({});
  const [issuePropertyValueErrors, setIssuePropertyValueErrors] = useState<TIssuePropertyValueErrors>({});
  // store hooks
  const { t } = useTranslation();
  const { getProjectStateIds, getAvailableWorkItemCreationStateIds, fetchProjectStates } = useProjectState();
  const { getProjectLabelIds, fetchProjectLabels } = useLabel();
  const { getModulesFetchStatusByProjectId, getProjectModuleIds, fetchModules } = useModule();
  const {
    project: { getProjectMemberFetchStatus, getProjectMemberIds, fetchProjectMembers },
  } = useMember();
  const { getTemplateById } = useWorkItemTemplates();
  const {
    isWorkItemTypeEnabledForProject,
    getIssueTypeById,
    convertWorkItem,
    getIssueTypeProperties,
    getProjectIssueTypes,
    getProjectDefaultIssueType,
    getProjectWorkItemPropertiesFetchedMap,
    fetchAllPropertiesAndOptions,
  } = useIssueTypes();
  const { fetchPropertyActivities } = useIssuePropertiesActivity();
  // helpers
  const getIssueTypeIdOnProjectChange = (projectId: string) => {
    // get active issue types for the project
    const projectIssueTypes = getProjectIssueTypes(projectId, true);
    // get default issue type for the project
    const defaultIssueType = getProjectDefaultIssueType(projectId);
    // if project has issue types, get the default issue type id or the first issue type id
    if (projectIssueTypes) {
      if (defaultIssueType?.id) {
        return defaultIssueType.id;
      } else {
        const issueTypeId = Object.keys(projectIssueTypes)[0];
        if (issueTypeId) return issueTypeId;
      }
    }
    // if no issue type available, return null
    return null;
  };

  const getActiveAdditionalPropertiesLength = (props: TActiveAdditionalPropertiesProps) => {
    const { projectId, watch, workspaceSlug } = props;
    const issueTypeId = watch("type_id");
    // if issue type is not enabled for the project or no issue type id, return 0
    const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    if (!isWorkItemTypeEnabled || !issueTypeId) return 0;
    // all properties for the issue type
    const properties = getIssueTypeProperties(issueTypeId);
    // filter all active properties
    const activeProperties = properties?.filter((property) => property.is_active);
    return activeProperties?.length || 0;
  };

  // handlers
  const handlePropertyValuesValidation = (props: TPropertyValuesValidationProps) => {
    const { projectId, watch, workspaceSlug } = props;

    const issueTypeId = watch("type_id");
    // if issue type is not enabled for the project, skip validation
    const isWorkItemTypeEnabled = !!projectId && isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    if (!isWorkItemTypeEnabled) return true;
    // if no issue type id or no issue property values, skip validation
    if (!issueTypeId) return true;
    // all properties for the issue type
    const properties = getIssueTypeProperties(issueTypeId);
    // filter all active & required propertyIds
    const activeRequiredPropertyIds = properties
      ?.filter((property) => property.is_active && property.is_required)
      .map((property) => property.id);
    // filter missing required property based on property values
    const missingRequiredPropertyIds = activeRequiredPropertyIds?.filter(
      (propertyId) =>
        propertyId &&
        (!issuePropertyValues[propertyId] ||
          !issuePropertyValues[propertyId].length ||
          issuePropertyValues[propertyId][0].trim() === "")
    );
    // set error state
    setIssuePropertyValueErrors(
      missingRequiredPropertyIds?.reduce((acc, propertyId) => {
        if (propertyId) acc[propertyId] = "REQUIRED";
        return acc;
      }, {} as TIssuePropertyValueErrors)
    );
    // return true if no missing required properties values
    return missingRequiredPropertyIds.length === 0;
  };

  const handleCreateUpdatePropertyValues = async (props: TCreateUpdatePropertyValuesProps) => {
    const { workspaceSlug, projectId, issueTypeId, issueId, isDraft = false } = props;
    // check if issue property values are empty
    if (Object.keys(issuePropertyValues).length === 0) return;
    // check if issue type display is enabled
    const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    if (!isWorkItemTypeEnabled) return;
    // get issue type details
    const issueType = issueTypeId ? getIssueTypeById(issueTypeId) : null;
    // get draft issue type details
    // filter property values that belongs to the issue type (required when issue type is changed)
    const filteredIssuePropertyValues = Object.keys(issuePropertyValues).reduce((acc, propertyId) => {
      if (issueType?.activeProperties?.find((property) => property.id === propertyId)) {
        acc[propertyId] = issuePropertyValues[propertyId];
      }
      return acc;
    }, {} as TIssuePropertyValues);
    // create issue property values
    await (
      isDraft
        ? draftIssuePropertyValuesService.create(workspaceSlug, projectId, issueId, filteredIssuePropertyValues)
        : issuePropertyValuesService.create(workspaceSlug, projectId, issueId, filteredIssuePropertyValues)
    )
      .then(() => {
        // mutate issue property values
        mutate(`ISSUE_PROPERTY_VALUES_${workspaceSlug}_${projectId}_${issueId}_${isWorkItemTypeEnabled}`);
        // fetch property activities
        fetchPropertyActivities(workspaceSlug, projectId, issueId);
        // reset issue property values
        setIssuePropertyValues({
          ...getPropertiesDefaultValues(issueType?.activeProperties ?? []),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Custom properties could not be created. Please try again.",
        });
      });
  };

  /**
   * Used to fetch all the entities for the project required for the work item modal
   */
  const handleProjectEntitiesFetch = useCallback(
    async (props: THandleProjectEntitiesFetchProps) => {
      const { workspaceSlug, templateId } = props;
      // get template details
      const template = getTemplateById(templateId);
      // get work item project id from the template
      const workItemProjectId = template?.template_data.project;

      if (!workItemProjectId) return;

      // Get all entities for the project
      const entitiesToFetch = [];
      // states
      const projectStateIds = getProjectStateIds(workItemProjectId);
      if (!projectStateIds) {
        entitiesToFetch.push(fetchProjectStates(workspaceSlug, workItemProjectId));
      }
      // project membership
      const isProjectMembersFetched = getProjectMemberFetchStatus(workItemProjectId);
      if (!isProjectMembersFetched) {
        entitiesToFetch.push(fetchProjectMembers(workspaceSlug, workItemProjectId));
      }
      // labels
      const projectLabelIds = getProjectLabelIds(workItemProjectId);
      if (!projectLabelIds) {
        entitiesToFetch.push(fetchProjectLabels(workspaceSlug, workItemProjectId));
      }
      // modules
      const modulesFetchStatus = getModulesFetchStatusByProjectId(workItemProjectId);
      if (!modulesFetchStatus) {
        entitiesToFetch.push(fetchModules(workspaceSlug, workItemProjectId));
      }
      // custom properties
      const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, workItemProjectId);
      const templateWorkItemTypeId = template.template_data.type?.id;
      if (isWorkItemTypeEnabled && templateWorkItemTypeId) {
        const isCustomPropertiesFetched = getProjectWorkItemPropertiesFetchedMap(
          workItemProjectId,
          EWorkItemTypeEntity.WORK_ITEM
        );
        if (!isCustomPropertiesFetched) {
          entitiesToFetch.push(
            fetchAllPropertiesAndOptions(workspaceSlug, workItemProjectId, EWorkItemTypeEntity.WORK_ITEM)
          );
        }
      }

      // fetch all entities
      await Promise.all(entitiesToFetch);
    },
    [
      getTemplateById,
      getProjectStateIds,
      getProjectMemberFetchStatus,
      getProjectLabelIds,
      getModulesFetchStatusByProjectId,
      isWorkItemTypeEnabledForProject,
      fetchProjectStates,
      fetchProjectMembers,
      fetchProjectLabels,
      fetchModules,
      getProjectWorkItemPropertiesFetchedMap,
      fetchAllPropertiesAndOptions,
    ]
  );

  /**
   * Used to handle template change in work item modal
   */
  const handleTemplateChange = useCallback(
    async (props: THandleTemplateChangeProps) => {
      const { workspaceSlug, reset, editorRef } = props;
      // check if work item template id is available
      if (!workItemTemplateId) return;
      // get template details
      const template = getTemplateById(workItemTemplateId);
      // handle local states
      setIsApplyingTemplate(true);

      if (template) {
        // fetch all entities required in the work item modal for the template
        await handleProjectEntitiesFetch({ workspaceSlug, templateId: workItemTemplateId });

        // Get the sanitized work item form data
        const { valid: sanitizedWorkItemFormData } = extractAndSanitizeWorkItemFormData({
          workItemData: template.template_data,
          getProjectStateIds: getAvailableWorkItemCreationStateIds,
          getProjectLabelIds,
          getProjectModuleIds,
          getProjectMemberIds,
        });

        // reset form values
        reset({
          ...DEFAULT_WORK_ITEM_FORM_VALUES,
          ...dataForPreload,
          ...sanitizedWorkItemFormData,
        });

        // Clear editor
        editorRef?.current?.clearEditor();
        // Set editor value, if available
        if (template.template_data.description_html) {
          editorRef?.current?.setEditorValue(template.template_data.description_html);
        }

        // Custom property values
        const isWorkItemTypeEnabled =
          !!template.template_data.project &&
          isWorkItemTypeEnabledForProject(workspaceSlug, template.template_data.project);
        const templateWorkItemTypeId = template.template_data.type?.id;
        // Handle custom property change if work item type is enabled and available
        if (isWorkItemTypeEnabled && templateWorkItemTypeId) {
          const templateWorkItemType = getIssueTypeById(templateWorkItemTypeId);
          const getPropertyById = templateWorkItemType?.getPropertyById;
          if (getPropertyById) {
            // Get the sanitized custom property values form data
            const sanitizedCustomPropertyValues = extractAndSanitizeCustomPropertyValuesFormData({
              properties: template.template_data.properties,
              getPropertyById,
            });
            // Update the custom property values
            setIssuePropertyValues({
              ...getPropertiesDefaultValues(templateWorkItemType?.activeProperties ?? []),
              ...sanitizedCustomPropertyValues,
            });
          }
        }
      }
      // set is applying template to false
      setIsApplyingTemplate(false);
    },
    [
      workItemTemplateId,
      getTemplateById,
      handleProjectEntitiesFetch,
      getAvailableWorkItemCreationStateIds,
      getProjectLabelIds,
      getProjectModuleIds,
      getProjectMemberIds,
      dataForPreload,
      isWorkItemTypeEnabledForProject,
      getIssueTypeById,
    ]
  );

  /**
   * Used to handle work item conversion
   */
  const handleConvert = async (workspaceSlug: string, data: Partial<TIssue> | undefined) => {
    if (data?.id && data?.project_id) {
      await convertWorkItem(workspaceSlug.toString(), data.project_id, data?.id, EWorkItemConversionType.WORK_ITEM)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("success"),
            message: "Epic converted to work item successfully",
            actionItems: <ConversionToastActionItems workspaceSlug={workspaceSlug} workItemId={data?.id} />,
          });
        })
        .catch((error) => {
          console.error(error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("error"),
            message: "Epic could not be converted to work item. Please try again.",
          });
          throw error;
        });
    }
  };

  return (
    <IssueModalContext.Provider
      value={{
        workItemTemplateId,
        setWorkItemTemplateId,
        isApplyingTemplate,
        setIsApplyingTemplate,
        selectedParentIssue,
        setSelectedParentIssue,
        issuePropertyValues,
        setIssuePropertyValues,
        issuePropertyValueErrors,
        setIssuePropertyValueErrors,
        getIssueTypeIdOnProjectChange,
        getActiveAdditionalPropertiesLength,
        handlePropertyValuesValidation,
        handleCreateUpdatePropertyValues,
        handleProjectEntitiesFetch,
        handleTemplateChange,
        handleConvert,
      }}
    >
      {children}
    </IssueModalContext.Provider>
  );
});
