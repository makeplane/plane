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

import { useCallback, useMemo, useState } from "react";
import { isEqual, cloneDeep } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { enrichRichFiltersWithEntityContext } from "@plane/shared-state";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type {
  IProjectView,
  TWorkItemFilterExpression,
  TWorkItemFiltersSaveViewOptions,
  TWorkItemFiltersUpdateViewOptions,
  WorkItemFilerViewCallbackArguments,
} from "@plane/types";
import { EIssuesStoreType, EUserProjectRoles, EViewAccess } from "@plane/types";
// helpers
import { removeNillKeys } from "@/helpers/common";
// components
import { CreateUpdateProjectViewModal } from "@/components/views/modal";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useEpicMeta } from "@/hooks/store/use-epic-meta";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useReleases } from "@/hooks/store/use-releases";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
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
  const {
    children,
    enableSaveView,
    enableUpdateView,
    entityId,
    entityType,
    initialWorkItemFilters,
    projectId,
    workspaceSlug,
  } = props;
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
  const {
    release: { getReleaseIdsByWorkspaceSlug, isReleasesEnabled },
  } = useReleases();
  const { getProjectActiveWorkflows, isWorkflowsEnabled } = useWorkflows();
  const allReleaseIds = getReleaseIdsByWorkspaceSlug(workspaceSlug);
  const { getProjectEpicDetails, getProjectIssueTypes, isWorkItemTypeEnabledForProject, isEpicEnabledForProject } =
    useIssueTypes();
  const { getProjectMilestoneIds, isMilestonesEnabled } = useMilestones();
  const { getProjectEpicIds } = useEpicMeta();
  // derived values
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
  const isEpicEnabled = isEpicEnabledForProject(workspaceSlug, projectId);
  const isReleasesFeatureEnabled = isReleasesEnabled(workspaceSlug);
  const isWorkflowsFeatureEnabled = isWorkflowsEnabled(workspaceSlug, projectId);
  const projectWorkItemTypes = Object.values(getProjectIssueTypes(projectId, false));
  const projectWorkItemTypeIds = useMemo(
    () => projectWorkItemTypes.map((workItemType) => workItemType.id).filter((id) => id !== undefined),
    [projectWorkItemTypes]
  );
  const projectEpicDetails = getProjectEpicDetails(projectId);
  const projectMilestoneIds = getProjectMilestoneIds(projectId);
  const projectEpicIds = getProjectEpicIds(projectId);
  const projectWorkflowIds = useMemo(
    () =>
      isWorkflowsFeatureEnabled
        ? getProjectActiveWorkflows(projectId)
            .filter((workflow) => !workflow.is_default)
            .map((workflow) => workflow.id)
        : [],
    [getProjectActiveWorkflows, isWorkflowsFeatureEnabled, projectId]
  );
  const isMilestonesFeatureEnabled = isMilestonesEnabled(workspaceSlug, projectId);
  const hasProjectMemberLevelPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const hasWorkspaceAdminLevelPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug
  );
  const projectDetails = getProjectById(projectId);
  const viewDetails = entityId ? getViewById(entityId) : null;
  const isViewLocked = !!viewDetails?.is_locked;
  const isCurrentUserOwner = viewDetails?.owned_by === currentUser?.id;
  const canCreateView =
    projectDetails?.issue_views_view === true &&
    enableSaveView &&
    !props.saveViewOptions?.isDisabled &&
    hasProjectMemberLevelPermissions;
  const canUpdateView =
    enableUpdateView &&
    !props.updateViewOptions?.isDisabled &&
    !isViewLocked &&
    (hasWorkspaceAdminLevelPermissions || isCurrentUserOwner);
  const createViewLabel = useMemo(() => props.saveViewOptions?.label, [props.saveViewOptions?.label]);
  const updateViewLabel = useMemo(() => props.updateViewOptions?.label, [props.updateViewOptions?.label]);
  const hasAdditionalChanges =
    !isEqual(initialWorkItemFilters?.displayFilters, viewDetails?.display_filters) ||
    !isEqual(
      removeNillKeys(initialWorkItemFilters?.displayProperties),
      removeNillKeys(viewDetails?.display_properties)
    );
  const customPropertyIds: string[] | undefined = useMemo(() => {
    // Get custom property IDs based on entity type and feature flags
    if (entityType === EIssuesStoreType.EPIC && isEpicEnabled) {
      // Get epic custom property IDs
      return projectEpicDetails?.properties
        ?.map((property) => property.id)
        .filter((propertyId) => propertyId !== undefined);
    } else if (isWorkItemTypeEnabled) {
      // Get work item type custom property IDs across all project work item types
      return projectWorkItemTypes
        .flatMap((workItemType) => workItemType.properties.map((property) => property.id))
        .filter((propertyId) => propertyId !== undefined);
    }
    return undefined;
  }, [entityType, isEpicEnabled, isWorkItemTypeEnabled, projectWorkItemTypes, projectEpicDetails]);

  const getDefaultViewDetailPayload: () => Partial<IProjectView> = useCallback(
    () => ({
      name: viewDetails ? `${viewDetails?.name} 2` : "Untitled",
      description: viewDetails ? viewDetails.description : "",
      logo_props: viewDetails ? viewDetails.logo_props : undefined,
      access: viewDetails ? viewDetails.access : EViewAccess.PUBLIC,
    }),
    [viewDetails]
  );

  const getViewFilterPayload = useCallback(
    (args: WorkItemFilerViewCallbackArguments<TWorkItemFilterExpression>): Partial<IProjectView> => ({
      display_filters: cloneDeep(initialWorkItemFilters?.displayFilters),
      display_properties: cloneDeep(initialWorkItemFilters?.displayProperties),
      last_used_filter: args.type,
      ...(args.type === "rich_filters"
        ? { rich_filters: cloneDeep(args.expression) }
        : { pql_filters: cloneDeep(args.value) }),
    }),
    [initialWorkItemFilters]
  );

  const handleViewSave = useCallback(
    (args: WorkItemFilerViewCallbackArguments<TWorkItemFilterExpression>) => {
      const filterPayload = getViewFilterPayload(args);
      const enrichedFilterPayload: Partial<IProjectView> = {
        ...filterPayload,
        rich_filters: enrichRichFiltersWithEntityContext({
          richFilters: filterPayload.rich_filters,
          entityType: entityType,
          entityId: entityId,
        }),
      };

      setCreateViewPayload({
        ...getDefaultViewDetailPayload(),
        ...enrichedFilterPayload,
      });
      setIsCreateViewModalOpen(true);
    },
    [getDefaultViewDetailPayload, getViewFilterPayload, entityType, entityId]
  );

  const handleViewUpdate = useCallback(
    (args: WorkItemFilerViewCallbackArguments<TWorkItemFilterExpression>) => {
      if (!viewDetails) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "We couldn't find the view",
          message: "The view you're trying to update doesn't exist.",
        });

        return;
      }

      updateView(workspaceSlug, projectId, viewDetails.id, {
        ...getViewFilterPayload(args),
      })
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Your view has been updated successfully.",
          });
          return;
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

  const saveViewOptions: TWorkItemFiltersSaveViewOptions<TWorkItemFilterExpression> = useMemo(
    () => ({
      label: createViewLabel,
      isDisabled: !canCreateView,
      onViewSave: handleViewSave,
    }),
    [createViewLabel, canCreateView, handleViewSave]
  );

  const updateViewOptions: TWorkItemFiltersUpdateViewOptions<TWorkItemFilterExpression> = useMemo(
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
        cycleIds={getProjectCycleIds(projectId) ?? undefined}
        labelIds={getProjectLabelIds(projectId)}
        memberIds={getProjectMemberIds(projectId, false) ?? undefined}
        moduleIds={getProjectModuleIds(projectId) ?? undefined}
        releaseIds={isReleasesFeatureEnabled ? allReleaseIds : undefined}
        stateIds={getProjectStateIds(projectId)}
        workflowIds={projectWorkflowIds.length > 0 ? projectWorkflowIds : undefined}
        workItemTypeIds={isWorkItemTypeEnabled ? projectWorkItemTypeIds : undefined}
        milestoneIds={isMilestonesFeatureEnabled ? projectMilestoneIds : undefined}
        epicIds={isEpicEnabled ? projectEpicIds : undefined}
        customPropertyIds={customPropertyIds}
        viewOptions={{
          saveViewOptions,
          updateViewOptions,
        }}
      >
        {children}
      </WorkItemFiltersHOC>
    </>
  );
});
