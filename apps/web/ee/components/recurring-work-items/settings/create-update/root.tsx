import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EWorkItemTypeEntity, PartialDeep, TRecurringWorkItemForm, TWorkItemBlueprintFormData } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import {
  TWorkItemSanitizationResult,
  processWorkItemCustomProperties,
  getRecurringWorkItemSettingsPath,
  recurringWorkItemDataToSanitizedFormData,
  recurringWorkItemFormDataToRecurringWorkItem,
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
import { RecurringWorkItemActivityRoot } from "@/plane-web/components/recurring-work-items/settings/activity/root";
import { useFlag, useIssueTypes } from "@/plane-web/hooks/store";
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
// local imports
import { ERecurringWorkItemFormOperation, TRecurringWorkItemFormSubmitData, RecurringWorkItemFormRoot } from "./form";
import { RecurringWorkItemLoader } from "./loader";

type TCreateUpdateRecurringWorkItemProps = {
  projectId: string;
  recurringWorkItemId?: string;
  workspaceSlug: string;
};

export const CreateUpdateRecurringWorkItem = observer((props: TCreateUpdateRecurringWorkItemProps) => {
  const { projectId, recurringWorkItemId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // states
  const [preloadedData, setPreloadedData] = useState<TRecurringWorkItemForm | undefined>(undefined);
  const [recurringWorkItemInvalidIds, setRecurringWorkItemInvalidIds] = useState<
    TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"] | undefined
  >(undefined);
  const [isPreloadingData, setIsPreloadingData] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const {
    loader: workItemTypeLoader,
    isWorkItemTypeEnabledForProject,
    getIssueTypeById,
    getIssuePropertyById,
    getProjectDefaultIssueType,
    getProjectWorkItemPropertiesLoader,
  } = useIssueTypes();
  const { getStateById, getProjectDefaultStateId, getProjectStateIds } = useProjectState();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  const { getLabelById, getProjectLabelIds } = useLabel();
  const { getModuleById, getProjectModuleIds } = useModule();
  const { loader, getRecurringWorkItemById, createRecurringWorkItem, fetchRecurringWorkItemById } =
    useRecurringWorkItems();
  // context hooks
  const { issuePropertyValues, setIssuePropertyValues, handleProjectEntitiesFetch } = useIssueModal();
  // derived values
  const recurringWorkItemSettingsPagePath = getRecurringWorkItemSettingsPath({ workspaceSlug, projectId });
  const operationToPerform = recurringWorkItemId
    ? ERecurringWorkItemFormOperation.UPDATE
    : ERecurringWorkItemFormOperation.CREATE;
  const isRecurringWorkItemsEnabled = useFlag(workspaceSlug, "RECURRING_WORKITEMS");
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
  const isRecurringWorkItemInitializing = loader === "init-loader";
  const isWorkItemTypeInitializing = isWorkItemTypeEnabled ? workItemTypeLoader === "init-loader" : false;
  const isWorkItemPropertiesInitializing = isWorkItemTypeEnabled
    ? getProjectWorkItemPropertiesLoader(projectId, EWorkItemTypeEntity.WORK_ITEM) === "init-loader"
    : false;
  const isInitializingData =
    isRecurringWorkItemInitializing || isWorkItemTypeInitializing || isWorkItemPropertiesInitializing;
  // fetch recurring work item details
  useSWR(
    workspaceSlug && recurringWorkItemId && isRecurringWorkItemsEnabled
      ? ["recurringWorkItem", workspaceSlug, recurringWorkItemId, isRecurringWorkItemsEnabled]
      : null,
    workspaceSlug && recurringWorkItemId && isRecurringWorkItemsEnabled
      ? () => fetchRecurringWorkItemById(workspaceSlug, projectId, recurringWorkItemId)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const resetLocalStates = useCallback(() => {
    setPreloadedData(undefined);
    setRecurringWorkItemInvalidIds(undefined);
  }, []);

  useEffect(() => {
    const handleRecurringWorkItemDataPreload = async () => {
      if (!recurringWorkItemId || isInitializingData) return;
      const recurringWorkItem = getRecurringWorkItemById(recurringWorkItemId)?.asJSON;
      if (!recurringWorkItem) return;

      setIsPreloadingData(true);

      // fetch all entities required for the recurring work item
      await handleProjectEntitiesFetch({
        workItemProjectId: recurringWorkItem.workitem_blueprint?.project,
        workItemTypeId: recurringWorkItem.workitem_blueprint?.type?.id,
        workspaceSlug,
      });

      // Get the sanitized work item form data
      const { form: sanitizedWorkItemFormData, invalidIds } = recurringWorkItemDataToSanitizedFormData({
        recurringWorkItem,
        getProjectStateIds,
        getProjectLabelIds,
        getProjectModuleIds,
        getProjectMemberIds,
      });

      // Set the preloaded data and invalid IDs
      setPreloadedData(sanitizedWorkItemFormData);
      setRecurringWorkItemInvalidIds(invalidIds);

      // Custom property values
      const isWorkItemTypeEnabled =
        !!recurringWorkItem.workitem_blueprint?.project &&
        isWorkItemTypeEnabledForProject(workspaceSlug, recurringWorkItem.workitem_blueprint?.project);
      if (isWorkItemTypeEnabled) {
        // For main work item
        const workItemProperties = processWorkItemCustomProperties(
          recurringWorkItem.workitem_blueprint?.type?.id,
          recurringWorkItem.workitem_blueprint?.properties,
          getIssueTypeById
        );

        if (workItemProperties) {
          setIssuePropertyValues(workItemProperties);
        }
      }

      setIsPreloadingData(false);
    };

    if (recurringWorkItemId) {
      handleRecurringWorkItemDataPreload();
    } else {
      resetLocalStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getRecurringWorkItemById, recurringWorkItemId, isInitializingData, workspaceSlug]);

  const getDataForPreload = useCallback((): PartialDeep<TRecurringWorkItemForm> | undefined => {
    if (preloadedData && recurringWorkItemId) {
      return preloadedData;
    }

    const defaultStateId = getProjectDefaultStateId(projectId);
    const defaultIssueType = getProjectDefaultIssueType(projectId);
    return {
      workitem_blueprint: {
        project_id: projectId,
        type_id: defaultIssueType?.id,
        state_id: defaultStateId,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedData, projectId]);

  // Handle preloaded invalid IDs change
  const handleRecurringWorkItemInvalidIdsChange = useCallback(
    <K extends keyof TWorkItemBlueprintFormData>(
      key: K,
      invalidIds: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"][K]
    ) => {
      setRecurringWorkItemInvalidIds((prev) => (prev ? { ...prev, [key]: invalidIds } : { [key]: invalidIds }));
    },
    []
  );

  const handleFormSubmit = async (data: TRecurringWorkItemFormSubmitData) => {
    const { data: recurringWorkItemData } = data;

    // Get current workspace detail
    const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
    if (!currentWorkspace) return;

    const payload = recurringWorkItemFormDataToRecurringWorkItem({
      workspaceId: currentWorkspace.id,
      formData: recurringWorkItemData,
      customPropertyValues: issuePropertyValues,
      getWorkItemTypeById: getIssueTypeById,
      getWorkItemPropertyById: getIssuePropertyById,
      getStateById: getStateById,
      getUserDetails: getUserDetails,
      getLabelById: getLabelById,
      getModuleById: getModuleById,
    });

    if (operationToPerform === ERecurringWorkItemFormOperation.UPDATE && recurringWorkItemData.id) {
      const recurringWorkItem = getRecurringWorkItemById(recurringWorkItemData.id);
      if (recurringWorkItem) {
        await recurringWorkItem
          .update(payload)
          .then(() => {
            router.push(recurringWorkItemSettingsPagePath);
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: t("recurring_work_items.toasts.update.success.title"),
              message: t("recurring_work_items.toasts.update.success.message", {
                name: recurringWorkItem.workitem_blueprint.name,
              }),
            });
          })
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("recurring_work_items.toasts.update.error.title"),
              message: t("recurring_work_items.toasts.update.error.message"),
            });
          });
      }
    } else {
      await createRecurringWorkItem(workspaceSlug, projectId, payload)
        .then((recurringWorkItem) => {
          resetLocalStates();
          router.push(recurringWorkItemSettingsPagePath);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("recurring_work_items.toasts.create.success.title"),
            message: t("recurring_work_items.toasts.create.success.message", {
              name: recurringWorkItem?.workitem_blueprint?.name,
            }),
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("recurring_work_items.toasts.create.error.title"),
            message: t("recurring_work_items.toasts.create.error.message"),
          });
        });
    }
  };

  const handleFormCancel = () => {
    resetLocalStates();
    router.back();
  };

  if (isInitializingData || isPreloadingData) {
    return <RecurringWorkItemLoader />;
  }

  return (
    <>
      <RecurringWorkItemFormRoot
        workspaceSlug={workspaceSlug}
        handleFormCancel={handleFormCancel}
        handleFormSubmit={handleFormSubmit}
        handleRecurringWorkItemInvalidIdsChange={handleRecurringWorkItemInvalidIdsChange}
        operation={operationToPerform}
        preloadedData={getDataForPreload()}
        recurringWorkItemInvalidIds={recurringWorkItemInvalidIds}
      />
      {recurringWorkItemId && (
        <RecurringWorkItemActivityRoot
          projectId={projectId}
          recurringWorkItemId={recurringWorkItemId}
          workspaceSlug={workspaceSlug}
        />
      )}
    </>
  );
});
