import { useCallback, useMemo, useState } from "react";
import { isEqual, cloneDeep } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IProjectView, TWorkItemFilterExpression } from "@plane/types";
import { EUserProjectRoles, EViewAccess } from "@plane/types";
// components
import { removeNillKeys } from "@/components/issues/issue-layouts/utils";
import { CreateUpdateProjectViewModal } from "@/components/views/modal";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { getAdditionalProjectLevelFiltersHOCProps } from "@/plane-web/helpers/work-item-filters/project-level";
// local imports
import { WorkItemFiltersHOC } from "./base";
import type { TEnableSaveViewProps, TEnableUpdateViewProps, TSharedWorkItemFiltersHOCProps } from "./shared";

type TProjectLevelWorkItemFiltersHOCProps = TSharedWorkItemFiltersHOCProps & {
  workspaceSlug: string;
  projectId: string;
} & TEnableSaveViewProps &
  TEnableUpdateViewProps;

export const ProjectLevelWorkItemFiltersHOC = observer(function ProjectLevelWorkItemFiltersHOC(
  props: TProjectLevelWorkItemFiltersHOCProps
) {
  const { children, enableSaveView, enableUpdateView, entityId, initialWorkItemFilters, projectId, workspaceSlug } =
    props;
  // states
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [createViewPayload, setCreateViewPayload] = useState<Partial<IProjectView> | null>(null);
  // hooks
  const { getProjectById } = useProject();
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
  const projectDetails = getProjectById(projectId);
  const viewDetails = entityId ? getViewById(entityId) : null;
  const isViewLocked = viewDetails ? viewDetails?.is_locked : false;
  const isCurrentUserOwner = viewDetails ? viewDetails.owned_by === currentUser?.id : false;
  const canCreateView = useMemo(
    () =>
      projectDetails?.issue_views_view === true &&
      enableSaveView &&
      !props.saveViewOptions?.isDisabled &&
      hasProjectMemberLevelPermissions,
    [
      projectDetails?.issue_views_view,
      enableSaveView,
      props.saveViewOptions?.isDisabled,
      hasProjectMemberLevelPermissions,
    ]
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
  const createViewLabel = useMemo(() => props.saveViewOptions?.label, [props.saveViewOptions?.label]);
  const updateViewLabel = useMemo(() => props.updateViewOptions?.label, [props.updateViewOptions?.label]);
  const hasAdditionalChanges = useMemo(
    () =>
      !isEqual(initialWorkItemFilters?.displayFilters, viewDetails?.display_filters) ||
      !isEqual(
        removeNillKeys(initialWorkItemFilters?.displayProperties),
        removeNillKeys(viewDetails?.display_properties)
      ),
    [initialWorkItemFilters, viewDetails]
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

  const handleViewSave = useCallback(
    (expression: TWorkItemFilterExpression) => {
      setCreateViewPayload({
        ...getDefaultViewDetailPayload(),
        ...getViewFilterPayload(expression),
      });
      setIsCreateViewModalOpen(true);
    },
    [getDefaultViewDetailPayload, getViewFilterPayload]
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
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Your view could not be updated. Please try again.",
          });
        });
    },
    [viewDetails, updateView, workspaceSlug, projectId, getViewFilterPayload]
  );

  const saveViewOptions = useMemo(
    () => ({
      label: createViewLabel,
      isDisabled: !canCreateView,
      onViewSave: handleViewSave,
    }),
    [createViewLabel, canCreateView, handleViewSave]
  );

  const updateViewOptions = useMemo(
    () => ({
      label: updateViewLabel,
      isDisabled: !canUpdateView,
      hasAdditionalChanges,
      onViewUpdate: handleViewUpdate,
    }),
    [updateViewLabel, canUpdateView, hasAdditionalChanges, handleViewUpdate]
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
          entityType: props.entityType,
          workspaceSlug,
          projectId,
        })}
        cycleIds={getProjectCycleIds(projectId) ?? undefined}
        labelIds={getProjectLabelIds(projectId)}
        memberIds={getProjectMemberIds(projectId, false) ?? undefined}
        moduleIds={getProjectModuleIds(projectId) ?? undefined}
        stateIds={getProjectStateIds(projectId)}
        saveViewOptions={saveViewOptions}
        updateViewOptions={updateViewOptions}
      >
        {children}
      </WorkItemFiltersHOC>
    </>
  );
});
