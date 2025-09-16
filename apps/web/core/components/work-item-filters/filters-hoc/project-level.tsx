import { useCallback, useMemo, useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel, PROJECT_VIEW_TRACKER_EVENTS } from "@plane/constants";
import { EUserProjectRoles, EViewAccess, IProjectView, TWorkItemFilterExpression } from "@plane/types";
// components
import { setToast, TOAST_TYPE } from "@plane/ui";
import { removeNillKeys } from "@/components/issues/issue-layouts/utils";
import { CreateUpdateProjectViewModal } from "@/components/views/modal";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { getAdditionalProjectLevelFiltersHOCProps } from "@/plane-web/helpers/work-item-filters/project-level";
// local imports
import { WorkItemFiltersHOC } from "./base";
import { TEnableSaveViewProps, TEnableUpdateViewProps, TSharedWorkItemFiltersHOCProps } from "./shared";

type TProjectLevelWorkItemFiltersHOCProps = TSharedWorkItemFiltersHOCProps & {
  workspaceSlug: string;
  projectId: string;
} & TEnableSaveViewProps &
  TEnableUpdateViewProps;

export const ProjectLevelWorkItemFiltersHOC = observer((props: TProjectLevelWorkItemFiltersHOCProps) => {
  const { children, enableSaveView, enableUpdateView, entityId, initialWorkItemFilters, projectId, workspaceSlug } =
    props;
  // states
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [createViewPayload, setCreateViewPayload] = useState<Partial<IProjectView> | null>(null);
  // hooks
  const { getViewById, updateView } = useProjectView();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { getProjectCycleIds } = useCycle();
  const { getProjectLabelIds } = useLabel();
  const {
    project: { getProjectMemberIds },
  } = useMember();
  const { getProjectModuleIds } = useModule();
  const { getProjectStateIds } = useProjectState();
  // derived values
  const hasProjectMemberLevelPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const viewDetails = entityId ? getViewById(entityId) : null;
  const isViewLocked = viewDetails ? viewDetails?.is_locked : false;
  const isCurrentUserOwner = viewDetails ? viewDetails.owned_by === currentUser?.id : false;
  const canCreateView = useMemo(
    () => enableSaveView && !props.saveViewOptions?.isDisabled && hasProjectMemberLevelPermissions,
    [enableSaveView, props.saveViewOptions?.isDisabled, hasProjectMemberLevelPermissions]
  );
  const canUpdateView = useMemo(
    () =>
      enableUpdateView &&
      !props.updateViewOptions?.isDisabled &&
      !isViewLocked &&
      hasProjectMemberLevelPermissions &&
      isCurrentUserOwner,
    [
      enableUpdateView,
      props.updateViewOptions?.isDisabled,
      isViewLocked,
      hasProjectMemberLevelPermissions,
      isCurrentUserOwner,
    ]
  );

  const getDefaultViewDetailPayload: () => Partial<IProjectView> = useCallback(
    () => ({
      name: viewDetails ? `${viewDetails?.name} 2` : "Untitled",
      description: viewDetails ? viewDetails.description : "",
      logo_props: viewDetails ? viewDetails.logo_props : undefined,
      access: viewDetails ? viewDetails.access : EViewAccess.PUBLIC,
    }),
    [viewDetails]
  );

  const getViewFilterPayload: (filterExpression: TWorkItemFilterExpression) => Partial<IProjectView> = useCallback(
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

      updateView(workspaceSlug, projectId, viewDetails.id, {
        ...getViewFilterPayload(filterExpression),
      })
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Your view has been updated successfully.",
          });
          captureSuccess({
            eventName: PROJECT_VIEW_TRACKER_EVENTS.update,
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
            eventName: PROJECT_VIEW_TRACKER_EVENTS.update,
            payload: {
              view_id: viewDetails.id,
            },
          });
        });
    },
    [viewDetails, updateView, workspaceSlug, projectId, getViewFilterPayload]
  );

  return (
    <>
      <CreateUpdateProjectViewModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        preLoadedData={createViewPayload}
        isOpen={isCreateViewModalOpen}
        onClose={() => {
          setCreateViewPayload(null);
          setIsCreateViewModalOpen(false);
        }}
      />
      <WorkItemFiltersHOC
        {...props}
        {...getAdditionalProjectLevelFiltersHOCProps({
          workspaceSlug,
          projectId,
        })}
        cycleIds={getProjectCycleIds(projectId) ?? undefined}
        labelIds={getProjectLabelIds(projectId)}
        memberIds={getProjectMemberIds(projectId, false) ?? undefined}
        moduleIds={getProjectModuleIds(projectId) ?? undefined}
        stateIds={getProjectStateIds(projectId)}
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
