import { useCallback, useMemo, useState } from "react";
import { isEqual, cloneDeep } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { DEFAULT_GLOBAL_VIEWS_LIST, EUserPermissionsLevel, GLOBAL_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { EUserProjectRoles, EViewAccess, IWorkspaceView, TWorkItemFilterExpression } from "@plane/types";
// components
import { setToast, TOAST_TYPE } from "@plane/ui";
import { removeNillKeys } from "@/components/issues/issue-layouts/utils";
import { CreateUpdateWorkspaceViewModal } from "@/components/workspace/views/modal";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// local imports
import { WorkItemFiltersHOC } from "./base";
import { TEnableSaveViewProps, TEnableUpdateViewProps, TSharedWorkItemFiltersHOCProps } from "./shared";

type TWorkspaceLevelWorkItemFiltersHOCProps = TSharedWorkItemFiltersHOCProps & {
  workspaceSlug: string;
} & TEnableSaveViewProps &
  TEnableUpdateViewProps;

export const WorkspaceLevelWorkItemFiltersHOC = observer((props: TWorkspaceLevelWorkItemFiltersHOCProps) => {
  const { children, enableSaveView, enableUpdateView, entityId, initialWorkItemFilters, workspaceSlug } = props;
  // states
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [createViewPayload, setCreateViewPayload] = useState<Partial<IWorkspaceView> | undefined>(undefined);
  // hooks
  const { getViewDetailsById, updateGlobalView } = useGlobalView();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { joinedProjectIds } = useProject();
  const {
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  const { getWorkspaceLabelIds } = useLabel();
  // derived values
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug
  );
  const viewDetails = entityId ? getViewDetailsById(entityId) : null;
  const isDefaultView = typeof entityId === "string" && DEFAULT_GLOBAL_VIEWS_LIST.some((view) => view.key === entityId);
  const isViewLocked = viewDetails ? viewDetails?.is_locked : false;
  const isCurrentUserOwner = viewDetails ? viewDetails.owned_by === currentUser?.id : false;
  const canCreateView = useMemo(
    () => enableSaveView && !props.saveViewOptions?.isDisabled && hasWorkspaceMemberLevelPermissions,
    [enableSaveView, props.saveViewOptions?.isDisabled, hasWorkspaceMemberLevelPermissions]
  );
  const canUpdateView = useMemo(
    () =>
      enableUpdateView &&
      !isDefaultView &&
      !props.updateViewOptions?.isDisabled &&
      !isViewLocked &&
      hasWorkspaceMemberLevelPermissions &&
      isCurrentUserOwner,
    [
      enableUpdateView,
      props.updateViewOptions?.isDisabled,
      isDefaultView,
      isViewLocked,
      hasWorkspaceMemberLevelPermissions,
      isCurrentUserOwner,
    ]
  );

  const getDefaultViewDetailPayload: () => Partial<IWorkspaceView> = useCallback(
    () => ({
      name: viewDetails ? `${viewDetails?.name} 2` : "Untitled",
      description: viewDetails ? viewDetails.description : "",
      access: viewDetails ? viewDetails.access : EViewAccess.PUBLIC,
    }),
    [viewDetails]
  );

  const getViewFilterPayload: (filterExpression: TWorkItemFilterExpression) => Partial<IWorkspaceView> = useCallback(
    (filterExpression: TWorkItemFilterExpression) => ({
      rich_filters: cloneDeep(filterExpression),
      display_filters: cloneDeep(initialWorkItemFilters?.displayFilters),
      display_properties: cloneDeep(initialWorkItemFilters?.displayProperties),
    }),
    [initialWorkItemFilters]
  );

  const handleViewUpdate = useCallback(
    (filterExpression: TWorkItemFilterExpression) => {
      if (!viewDetails) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "We couldn't find the view",
          message: "The view you're trying to update doesn't exist.",
        });

        return;
      }

      updateGlobalView(
        workspaceSlug,
        viewDetails.id,
        {
          ...getViewFilterPayload(filterExpression),
        },
        /* No need to sync filters here as updateFilters already handles it */
        false
      )
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Your view has been updated successfully.",
          });
          captureSuccess({
            eventName: GLOBAL_VIEW_TRACKER_EVENTS.update,
            payload: {
              view_id: viewDetails.id,
            },
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Your view could not be updated. Please try again.",
          });
          captureError({
            eventName: GLOBAL_VIEW_TRACKER_EVENTS.update,
            payload: {
              view_id: viewDetails.id,
            },
          });
        });
    },
    [viewDetails, updateGlobalView, workspaceSlug, getViewFilterPayload]
  );

  return (
    <>
      <CreateUpdateWorkspaceViewModal
        preLoadedData={createViewPayload}
        isOpen={isCreateViewModalOpen}
        onClose={() => {
          setCreateViewPayload(undefined);
          setIsCreateViewModalOpen(false);
        }}
      />
      <WorkItemFiltersHOC
        {...props}
        memberIds={getWorkspaceMemberIds(workspaceSlug)}
        labelIds={getWorkspaceLabelIds(workspaceSlug)}
        projectIds={joinedProjectIds}
        saveViewOptions={{
          label: props.saveViewOptions?.label,
          isDisabled: !canCreateView,
          onViewSave: (expression) => {
            setCreateViewPayload({
              ...getDefaultViewDetailPayload(),
              ...getViewFilterPayload(expression),
            });
            setIsCreateViewModalOpen(true);
          },
        }}
        updateViewOptions={{
          label: props.updateViewOptions?.label,
          isDisabled: !canUpdateView,
          hasAdditionalChanges:
            !isEqual(initialWorkItemFilters?.displayFilters, viewDetails?.display_filters) ||
            !isEqual(
              removeNillKeys(initialWorkItemFilters?.displayProperties),
              removeNillKeys(viewDetails?.display_properties)
            ),
          onViewUpdate: handleViewUpdate,
        }}
      >
        {children}
      </WorkItemFiltersHOC>
    </>
  );
});
