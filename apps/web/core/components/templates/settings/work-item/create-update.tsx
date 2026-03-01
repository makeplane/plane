/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { PartialDeep, TWorkItemTemplateForm, TWorkItemTemplateFormData, TIssuePropertyValues } from "@plane/types";
import { ETemplateType } from "@plane/types";
import type { TWorkItemSanitizationResult } from "@plane/utils";
import {
  getTemplateTypeI18nName,
  getTemplateSettingsBasePath,
  workItemTemplateDataToSanitizedFormData,
  workItemTemplateFormDataToTemplate,
  processWorkItemCustomProperties,
} from "@plane/utils";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag, useIssueTypes, useWorkItemTemplates } from "@/plane-web/hooks/store";
// local imports
import type { TWorkItemTemplateFormSubmitData } from "./form";
import { EWorkItemFormOperation, WorkItemTemplateFormRoot } from "./form";
import { WorkItemTemplateLoader } from "./loader";

type TCreateUpdateWorkItemTemplateProps = {
  workspaceSlug: string;
  templateId?: string;
} & (
  | {
      currentLevel: ETemplateLevel.WORKSPACE;
    }
  | {
      currentLevel: ETemplateLevel.PROJECT;
      projectId: string;
    }
);

export const CreateUpdateWorkItemTemplate = observer(function CreateUpdateWorkItemTemplate(
  props: TCreateUpdateWorkItemTemplateProps
) {
  const { workspaceSlug, templateId, currentLevel } = props;
  // router
  const router = useAppRouter();
  // states
  const [preloadedData, setPreloadedData] = useState<TWorkItemTemplateForm | undefined>(undefined);
  const [templateInvalidIds, setTemplateInvalidIds] = useState<
    TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"] | undefined
  >(undefined);
  const [subWorkItemCustomPropertyValues, setSubWorkItemCustomPropertyValues] = useState<
    Record<string, TIssuePropertyValues>
  >({});
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { isWorkItemTypeEnabledForProject, getIssueTypeById, getIssuePropertyById, getProjectDefaultIssueType } =
    useIssueTypes();
  const { getStateById, getProjectDefaultStateId, getProjectStateIds } = useProjectState();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  const { getLabelById, getProjectLabelIds } = useLabel();
  const { getModuleById, getProjectModuleIds } = useModule();
  const { loader, createWorkItemTemplate, getTemplateById, fetchTemplateById } = useWorkItemTemplates();
  // context hooks
  const {
    isApplyingTemplate,
    issuePropertyValues,
    setIsApplyingTemplate,
    setIssuePropertyValues,
    handleProjectEntitiesFetch,
  } = useIssueModal();
  // derived values
  const templateSettingsPagePath = getTemplateSettingsBasePath({
    workspaceSlug,
    ...("projectId" in props
      ? { level: ETemplateLevel.PROJECT, projectId: props.projectId }
      : { level: ETemplateLevel.WORKSPACE }),
  });
  const operationToPerform = templateId ? EWorkItemFormOperation.UPDATE : EWorkItemFormOperation.CREATE;
  const isWorkItemTemplatesEnabled = useFlag(workspaceSlug, "WORKITEM_TEMPLATES");
  // fetch template details
  useSWR(
    workspaceSlug && templateId && isWorkItemTemplatesEnabled
      ? ["workItemTemplates", workspaceSlug, templateId, isWorkItemTemplatesEnabled]
      : null,
    workspaceSlug && templateId && isWorkItemTemplatesEnabled
      ? () =>
          fetchTemplateById({
            workspaceSlug,
            templateId,
            ...("projectId" in props
              ? { level: ETemplateLevel.PROJECT, projectId: props.projectId }
              : { level: ETemplateLevel.WORKSPACE }),
          })
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const resetLocalStates = useCallback(() => {
    setPreloadedData(undefined);
    setTemplateInvalidIds(undefined);
  }, []);

  useEffect(() => {
    const handleTemplateDataPreload = async () => {
      if (!templateId || loader === "init-loader") return;
      const templateDetails = getTemplateById(templateId)?.asJSON;
      if (!templateDetails) return;

      setIsApplyingTemplate(true);

      // fetch all entities required for the template
      await handleProjectEntitiesFetch({
        workItemProjectId: templateDetails.template_data.project,
        workItemTypeId: templateDetails.template_data.type?.id,
        workspaceSlug,
      });

      // Get the sanitized work item form data
      const { form: sanitizedWorkItemFormData, invalidIds } = workItemTemplateDataToSanitizedFormData({
        template: templateDetails,
        getProjectStateIds,
        getProjectLabelIds,
        getProjectModuleIds,
        getProjectMemberIds,
      });

      // Set the preloaded data and invalid IDs
      setPreloadedData(sanitizedWorkItemFormData);
      setTemplateInvalidIds(invalidIds);

      // Custom property values
      const isWorkItemTypeEnabled =
        !!templateDetails.template_data.project &&
        isWorkItemTypeEnabledForProject(workspaceSlug, templateDetails.template_data.project);
      if (isWorkItemTypeEnabled) {
        // For main work item
        const workItemProperties = processWorkItemCustomProperties(
          templateDetails.template_data.type?.id,
          templateDetails.template_data.properties,
          getIssueTypeById
        );

        if (workItemProperties) {
          setIssuePropertyValues(workItemProperties);
        }

        // For sub work items
        for (const subWorkItem of templateDetails.template_data.sub_workitems) {
          const subWorkItemProperties = processWorkItemCustomProperties(
            subWorkItem.type?.id,
            subWorkItem.properties,
            getIssueTypeById
          );

          if (subWorkItemProperties && subWorkItem.id) {
            setSubWorkItemCustomPropertyValues((prev) => ({
              ...prev,
              [subWorkItem.id!]: subWorkItemProperties, // Non-null assertion because we already checked for subWorkItem.id
            }));
          }
        }
      }

      setIsApplyingTemplate(false);
    };

    if (templateId) {
      handleTemplateDataPreload();
    } else {
      resetLocalStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, templateId, workspaceSlug, getTemplateById]);

  const getDataForPreload = useCallback((): PartialDeep<TWorkItemTemplateForm> | undefined => {
    if (preloadedData && templateId) {
      return preloadedData;
    }

    if (currentLevel === ETemplateLevel.PROJECT) {
      const defaultStateId = getProjectDefaultStateId(props.projectId);
      const defaultIssueType = getProjectDefaultIssueType(props.projectId);

      return {
        work_item: {
          project_id: props.projectId,
          type_id: defaultIssueType?.id,
          state_id: defaultStateId,
        },
      };
    }

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedData, templateId, props]);

  // Handle preloaded invalid IDs change
  const handleTemplateInvalidIdsChange = useCallback(
    <K extends keyof TWorkItemTemplateFormData>(
      key: K,
      invalidIds: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"][K]
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
      setSubWorkItemCustomPropertyValues((prev) => ({ ...prev, [workItemId]: customPropertyValues }));
    },
    []
  );

  const handleFormSubmit = async (data: TWorkItemTemplateFormSubmitData) => {
    const { data: templateData } = data;

    // Get current workspace detail
    const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
    if (!currentWorkspace) return;

    const payload = workItemTemplateFormDataToTemplate({
      workspaceId: currentWorkspace.id,
      formData: templateData,
      customPropertyValues: issuePropertyValues,
      subWorkItemListCustomPropertyValues: subWorkItemCustomPropertyValues,
      getWorkItemTypeById: getIssueTypeById,
      getWorkItemPropertyById: getIssuePropertyById,
      getStateById: getStateById,
      getUserDetails: getUserDetails,
      getLabelById: getLabelById,
      getModuleById: getModuleById,
    });

    if (operationToPerform === EWorkItemFormOperation.UPDATE && templateData.template.id) {
      const template = getTemplateById(templateData.template.id);
      if (template) {
        template
          .update(payload)
          .then(() => {
            router.push(templateSettingsPagePath);
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: t("templates.toasts.update.success.title"),
              message: t("templates.toasts.update.success.message", {
                templateName: templateData.template.name,
                templateType: t(getTemplateTypeI18nName(template.template_type))?.toLowerCase(),
              }),
            });
          })
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("templates.toasts.update.error.title"),
              message: t("templates.toasts.update.error.message"),
            });
          });
      }
    } else {
      await createWorkItemTemplate({
        workspaceSlug,
        templateData: payload,
        ...("projectId" in props
          ? { level: ETemplateLevel.PROJECT, projectId: props.projectId }
          : { level: ETemplateLevel.WORKSPACE }),
      })
        .then(() => {
          resetLocalStates();
          router.push(templateSettingsPagePath);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("templates.toasts.create.success.title"),
            message: t("templates.toasts.create.success.message", {
              templateName: templateData.template.name,
              templateType: t(getTemplateTypeI18nName(ETemplateType.WORK_ITEM))?.toLowerCase(),
            }),
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("templates.toasts.create.error.title"),
            message: t("templates.toasts.create.error.message"),
          });
        });
    }
  };

  const handleFormCancel = () => {
    resetLocalStates();
    router.back();
  };

  if (loader === "init-loader" || isApplyingTemplate || (templateId && !preloadedData)) {
    return <WorkItemTemplateLoader />;
  }

  return (
    <WorkItemTemplateFormRoot
      currentLevel={currentLevel}
      handleFormCancel={handleFormCancel}
      handleFormSubmit={handleFormSubmit}
      handleTemplateInvalidIdsChange={handleTemplateInvalidIdsChange}
      handleWorkItemListCustomPropertyValuesChange={handleWorkItemListCustomPropertyValuesChange}
      operation={operationToPerform}
      preloadedData={getDataForPreload()}
      subWorkItemCustomPropertyValues={subWorkItemCustomPropertyValues}
      templateId={templateId}
      templateInvalidIds={templateInvalidIds}
    />
  );
});
