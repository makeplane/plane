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
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type {
  IWorkspaceView,
  TWorkItemFilterExpression,
  TWorkItemFiltersSaveViewOptions,
  TWorkItemFiltersUpdateViewOptions,
  WorkItemFilerViewCallbackArguments,
} from "@plane/types";
import { EViewAccess } from "@plane/types";
// helpers
import { removeNillKeys } from "@/helpers/common";
// components
import { CreateUpdateWorkspaceViewModal } from "@/components/workspace/views/modal";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useReleases } from "@/hooks/store/use-releases";
// local imports
import { WorkItemFiltersHOC } from "./base";
import type { TEnableSaveViewProps, TEnableUpdateViewProps, TSharedWorkItemFiltersHOCProps } from "./shared";

type TWorkspaceLevelWorkItemFiltersHOCProps = TSharedWorkItemFiltersHOCProps & {
  workspaceSlug: string;
} & TEnableSaveViewProps &
  TEnableUpdateViewProps;

export const WorkspaceLevelWorkItemFiltersHOC = observer(function WorkspaceLevelWorkItemFiltersHOC(
  props: TWorkspaceLevelWorkItemFiltersHOCProps
) {
  const { children, enableSaveView, enableUpdateView, entityId, initialWorkItemFilters, workspaceSlug } = props;
  // states
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [createViewPayload, setCreateViewPayload] = useState<Partial<IWorkspaceView> | undefined>(undefined);
  // hooks
  const {
    getViewDetailsById,
    updateGlobalView,
    permissions: { getCanCreate, getCanEdit },
  } = useGlobalView();
  const { joinedProjectIds } = useProject();
  const {
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  const { getWorkspaceLabelIds } = useLabel();
  const {
    release: { getReleaseIdsByWorkspaceSlug, isReleasesEnabled },
  } = useReleases();
  const allReleaseIds = getReleaseIdsByWorkspaceSlug(workspaceSlug);
  // derived values
  const isReleasesFeatureEnabled = isReleasesEnabled(workspaceSlug);
  const viewDetails = entityId ? getViewDetailsById(entityId) : null;
  const isDefaultView = typeof entityId === "string" && DEFAULT_GLOBAL_VIEWS_LIST.some((view) => view.key === entityId);
  const isViewLocked = viewDetails ? viewDetails?.is_locked : false;
  const canCreateViewPermission = getCanCreate(workspaceSlug);
  const canEditViewPermission = viewDetails ? getCanEdit(viewDetails.id) : false;
  const canCreateView = enableSaveView && !props.saveViewOptions?.isDisabled && canCreateViewPermission;
  const canUpdateView =
    enableUpdateView &&
    !isDefaultView &&
    !props.updateViewOptions?.isDisabled &&
    !isViewLocked &&
    canEditViewPermission;
  const createViewLabel = useMemo(() => props.saveViewOptions?.label, [props.saveViewOptions?.label]);
  const updateViewLabel = useMemo(() => props.updateViewOptions?.label, [props.updateViewOptions?.label]);
  const hasAdditionalChanges =
    !isEqual(initialWorkItemFilters?.displayFilters, viewDetails?.display_filters) ||
    !isEqual(
      removeNillKeys(initialWorkItemFilters?.displayProperties),
      removeNillKeys(viewDetails?.display_properties)
    );

  const getDefaultViewDetailPayload: () => Partial<IWorkspaceView> = useCallback(
    () => ({
      name: viewDetails ? `${viewDetails?.name} 2` : "Untitled",
      description: viewDetails ? viewDetails.description : "",
      access: viewDetails ? viewDetails.access : EViewAccess.PUBLIC,
    }),
    [viewDetails]
  );

  const getViewFilterPayload = useCallback(
    (args: WorkItemFilerViewCallbackArguments<TWorkItemFilterExpression>): Partial<IWorkspaceView> => ({
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

      updateGlobalView(
        workspaceSlug,
        viewDetails.id,
        {
          ...getViewFilterPayload(args),
        },
        /* No need to sync filters here as updateFilters already handles it */
        false
      )
        .then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Your view has been updated successfully.",
          })
        )
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Your view could not be updated. Please try again.",
          });
        });
    },
    [viewDetails, updateGlobalView, workspaceSlug, getViewFilterPayload]
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
        releaseIds={isReleasesFeatureEnabled ? allReleaseIds : undefined}
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
