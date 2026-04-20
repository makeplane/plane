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

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { ActionButton } from "@plane/propel/empty-state";
import type { IBaseLabel } from "@plane/types";
import { Loader } from "@plane/ui";
// hooks
import { useWorkspaceProjectLabels } from "@/hooks/store/use-workspace-project-labels";
// local imports
import type { TWorkspaceLabelOperationsCallbacks } from "./create-update-label-inline";
import { CreateUpdateWorkspaceLabelInline } from "./create-update-label-inline";
import { DeleteWorkspaceLabelModal } from "./delete-label-modal";
import { WorkspaceSettingLabelGroup } from "./workspace-label-group";
import { WorkspaceSettingLabelItem } from "./workspace-label-item";
import { useWorkspace } from "@/hooks/store/use-workspace";

type TWorkspaceProjectLabelsRoot = {
  workspaceSlug: string;
};

export const WorkspaceProjectLabelsRoot = observer(function WorkspaceProjectLabelsRoot(
  props: TWorkspaceProjectLabelsRoot
) {
  const { workspaceSlug } = props;
  // refs
  const scrollToRef = useRef<HTMLDivElement>(null);
  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IBaseLabel | null>(null);
  // store hooks
  const {
    loader,
    workspaceLabels,
    workspaceLabelsTree,
    fetchWorkspaceProjectLabels,
    createLabel,
    updateLabel,
    updateLabelPosition,
  } = useWorkspaceProjectLabels();
  const { permissions: workspacePermissions } = useWorkspace();

  // derived values
  const labelPermissions = workspacePermissions.getLabelPermissions(workspaceSlug);

  // fetch labels on mount
  useEffect(() => {
    if (workspaceSlug) {
      fetchWorkspaceProjectLabels(workspaceSlug);
    }
  }, [workspaceSlug, fetchWorkspaceProjectLabels]);

  // Enable Auto Scroll for Labels list
  useEffect(() => {
    const element = scrollableContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, []);

  const labelOperationsCallbacks: TWorkspaceLabelOperationsCallbacks = {
    createLabel: (data: Partial<IBaseLabel>) => createLabel(workspaceSlug, data),
    updateLabel: (labelId: string, data: Partial<IBaseLabel>) => updateLabel(workspaceSlug, labelId, data),
  };

  const newLabel = useCallback(() => {
    setIsUpdating(false);
    setLabelForm(true);
  }, []);

  const onDrop = (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    if (workspaceSlug) {
      updateLabelPosition(workspaceSlug, draggingLabelId, droppedParentId, droppedLabelId, dropAtEndOfList);
    }
  };

  const handleRemoveFromGroup = (label: IBaseLabel) => {
    if (!workspaceSlug) return;
    updateLabel(workspaceSlug, label.id, { parent: null });
  };

  const emptyStateActions: ActionButton[] = useMemo(() => {
    if (labelPermissions.canCreate) {
      return [
        {
          label: "Add label",
          onClick: newLabel,
        },
      ];
    }
    return [];
  }, [labelPermissions.canCreate, newLabel]);

  const isLoading = loader === "init";

  return (
    <>
      <DeleteWorkspaceLabelModal
        workspaceSlug={workspaceSlug}
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
      />
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <h6 className="text-h6-medium text-primary">Labels</h6>
          <p className="text-body-xs-regular text-tertiary">Structure and organise your projects with labels.</p>
        </div>
        {labelPermissions.canCreate && (
          <Button variant="secondary" size="lg" onClick={newLabel}>
            Add label
          </Button>
        )}
      </div>
      <div ref={scrollableContainerRef} className="w-full mt-6">
        {showLabelForm && (
          <div className="my-2 w-full rounded-sm border border-subtle px-3.5 py-2">
            <CreateUpdateWorkspaceLabelInline
              labelForm={showLabelForm}
              setLabelForm={setLabelForm}
              isUpdating={isUpdating}
              labelOperationsCallbacks={labelOperationsCallbacks}
              ref={scrollToRef}
              onClose={() => {
                setLabelForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}
        {isLoading ? (
          <Loader className="space-y-5">
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
          </Loader>
        ) : workspaceLabels && workspaceLabels.length > 0 ? (
          <div className="border border-subtle rounded-lg bg-layer-1 transition-all p-2">
            {workspaceLabelsTree?.map((label, index) => {
              if (label.children && label.children.length) {
                return (
                  <WorkspaceSettingLabelGroup
                    key={label.id}
                    label={label}
                    labelChildren={label.children || []}
                    handleLabelDelete={(label: IBaseLabel) => setSelectDeleteLabel(label)}
                    isUpdating={isUpdating}
                    setIsUpdating={setIsUpdating}
                    isLastChild={index === workspaceLabelsTree.length - 1}
                    onDrop={onDrop}
                    permissions={{
                      canReorder: labelPermissions.getCanReorder(label.id),
                      canEdit: labelPermissions.getCanEdit(label.id),
                      canDelete: labelPermissions.getCanDelete(label.id),
                      canCreate: labelPermissions.canCreate,
                    }}
                    labelOperationsCallbacks={labelOperationsCallbacks}
                    onRemoveFromGroup={handleRemoveFromGroup}
                  />
                );
              }
              return (
                <WorkspaceSettingLabelItem
                  label={label}
                  key={label.id}
                  setIsUpdating={setIsUpdating}
                  handleLabelDelete={(label) => setSelectDeleteLabel(label)}
                  isChild={false}
                  isLastChild={index === workspaceLabelsTree.length - 1}
                  onDrop={onDrop}
                  permissions={{
                    canReorder: labelPermissions.getCanReorder(label.id),
                    canEdit: labelPermissions.getCanEdit(label.id),
                    canDelete: labelPermissions.getCanDelete(label.id),
                    canCreate: labelPermissions.canCreate,
                  }}
                  labelOperationsCallbacks={labelOperationsCallbacks}
                  onRemoveFromGroup={handleRemoveFromGroup}
                />
              );
            })}
          </div>
        ) : (
          !showLabelForm && (
            <EmptyStateCompact
              assetKey="label"
              assetClassName="size-20"
              title="No labels yet"
              description="Create personalized labels to effectively categorize and manage your projects."
              actions={emptyStateActions}
              align="center"
              rootClassName="py-20 border border-subtle rounded-lg"
            />
          )
        )}
      </div>
    </>
  );
});
