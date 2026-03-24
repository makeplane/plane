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
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type {
  TTeamspaceView,
  TWorkItemFilterExpression,
  TWorkItemFiltersSaveViewOptions,
  TWorkItemFiltersUpdateViewOptions,
  WorkItemFilerViewCallbackArguments,
} from "@plane/types";
import { EUserProjectRoles, EViewAccess } from "@plane/types";
// helpers
import { removeNillKeys } from "@/helpers/common";
import { WorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/base";
import type {
  TEnableSaveViewProps,
  TEnableUpdateViewProps,
  TSharedWorkItemFiltersHOCProps,
} from "@/components/work-item-filters/filters-hoc/shared";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { CreateUpdateTeamspaceViewModal } from "@/components/teamspaces/views/modals/create-update/modal";
import { useTeamspaceViews } from "@/plane-web/hooks/store/teamspaces/use-teamspace-views";
// store imports
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

type TTeamspaceLevelWorkItemFiltersHOCProps = TSharedWorkItemFiltersHOCProps & {
  teamspaceId: string;
  workspaceSlug: string;
} & TEnableSaveViewProps &
  TEnableUpdateViewProps;

export const TeamspaceLevelWorkItemFiltersHOC = observer(function TeamspaceLevelWorkItemFiltersHOC(
  props: TTeamspaceLevelWorkItemFiltersHOCProps
) {
  const { children, enableSaveView, enableUpdateView, entityId, initialWorkItemFilters, teamspaceId, workspaceSlug } =
    props;
  // states
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [createViewPayload, setCreateViewPayload] = useState<Partial<TTeamspaceView> | undefined>(undefined);
  // hooks
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { isCurrentUserMemberOfTeamspace, getTeamspaceMemberIds, getTeamspaceProjectIds } = useTeamspaces();
  const { getViewById, updateView } = useTeamspaceViews();
  const { getProjectLabelIds } = useLabel();
  // derived values
  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug
  );
  const viewDetails = entityId ? getViewById(teamspaceId, entityId) : null;
  const isViewLocked = viewDetails ? viewDetails?.is_locked : false;
  const isCurrentUserOwner = viewDetails ? viewDetails.owned_by === currentUser?.id : false;
  const canCreateView = useMemo(
    () =>
      enableSaveView &&
      !props.saveViewOptions?.isDisabled &&
      hasWorkspaceMemberLevelPermissions &&
      isCurrentUserMemberOfTeamspace(teamspaceId),
    [
      enableSaveView,
      props.saveViewOptions?.isDisabled,
      hasWorkspaceMemberLevelPermissions,
      isCurrentUserMemberOfTeamspace,
      teamspaceId,
    ]
  );
  const canUpdateView = useMemo(
    () =>
      enableUpdateView &&
      !props.updateViewOptions?.isDisabled &&
      !isViewLocked &&
      isCurrentUserMemberOfTeamspace(teamspaceId) &&
      hasWorkspaceMemberLevelPermissions &&
      isCurrentUserOwner,
    [
      enableUpdateView,
      props.updateViewOptions?.isDisabled,
      isViewLocked,
      isCurrentUserMemberOfTeamspace,
      teamspaceId,
      hasWorkspaceMemberLevelPermissions,
      isCurrentUserOwner,
    ]
  );
  const createViewLabel = useMemo(() => props.saveViewOptions?.label, [props.saveViewOptions?.label]);
  const updateViewLabel = useMemo(() => props.updateViewOptions?.label, [props.updateViewOptions?.label]);
  const hasAdditionalChanges =
    !isEqual(initialWorkItemFilters?.displayFilters, viewDetails?.display_filters) ||
    !isEqual(
      removeNillKeys(initialWorkItemFilters?.displayProperties),
      removeNillKeys(viewDetails?.display_properties)
    );
  const teamspaceProjectIds = useMemo(() => getTeamspaceProjectIds(teamspaceId), [getTeamspaceProjectIds, teamspaceId]);
  const teamspaceLabelIds = useMemo(() => {
    const labelIdSet = new Set<string>();
    teamspaceProjectIds?.forEach((projectId) => {
      const ids = getProjectLabelIds(projectId);
      if (Array.isArray(ids)) {
        ids.forEach((id) => labelIdSet.add(id));
      }
    });
    return Array.from(labelIdSet);
  }, [getProjectLabelIds, teamspaceProjectIds]);

  const getDefaultViewDetailPayload: () => Partial<TTeamspaceView> = useCallback(
    () => ({
      name: viewDetails ? `${viewDetails?.name} 2` : "Untitled",
      description: viewDetails ? viewDetails.description : "",
      logo_props: viewDetails?.logo_props,
      access: viewDetails ? viewDetails.access : EViewAccess.PUBLIC,
    }),
    [viewDetails]
  );

  const getViewFilterPayload = useCallback(
    (args: WorkItemFilerViewCallbackArguments<TWorkItemFilterExpression>): Partial<TTeamspaceView> => ({
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
      setCreateViewPayload({
        ...getDefaultViewDetailPayload(),
        ...getViewFilterPayload(args),
      });
      setIsCreateViewModalOpen(true);
    },
    [getDefaultViewDetailPayload, getViewFilterPayload]
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

      updateView(workspaceSlug, teamspaceId, viewDetails.id, {
        ...getViewFilterPayload(args),
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
    [viewDetails, updateView, workspaceSlug, teamspaceId, getViewFilterPayload]
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
      <CreateUpdateTeamspaceViewModal
        preLoadedData={createViewPayload}
        isOpen={isCreateViewModalOpen}
        onClose={() => {
          setCreateViewPayload(undefined);
          setIsCreateViewModalOpen(false);
        }}
        workspaceSlug={workspaceSlug}
        teamspaceId={teamspaceId}
      />
      <WorkItemFiltersHOC
        {...props}
        memberIds={getTeamspaceMemberIds(teamspaceId)}
        labelIds={teamspaceLabelIds}
        teamspaceProjectIds={teamspaceProjectIds}
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
