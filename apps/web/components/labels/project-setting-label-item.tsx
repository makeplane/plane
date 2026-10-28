/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { CloseOutline, EditOutline } from "@makeplane/propel/icons";
// types
import type { IIssueLabel } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useLabel } from "@/hooks/store/use-label";
// components
import type { TLabelOperationsCallbacks } from "./create-update-label-inline";
import { CreateUpdateLabelInline } from "./create-update-label-inline";
import type { ICustomMenuItem } from "./label-block/label-item-block";
import { LabelItemBlock } from "./label-block/label-item-block";
import { LabelDndHOC } from "./label-drag-n-drop-HOC";

type Props = {
  label: IIssueLabel;
  handleLabelDelete: (label: IIssueLabel) => void;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isParentDragging?: boolean;
  isChild: boolean;
  isLastChild: boolean;
  onDrop: (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => void;
  labelOperationsCallbacks: TLabelOperationsCallbacks;
  isEditable?: boolean;
};

export function ProjectSettingLabelItem(props: Props) {
  const {
    label,
    setIsUpdating,
    handleLabelDelete,
    isChild,
    isLastChild,
    isParentDragging = false,
    onDrop,
    labelOperationsCallbacks,
    isEditable = false,
  } = props;
  // states
  const [isEditLabelForm, setEditLabelForm] = useState(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { updateLabel } = useLabel();

  const removeFromGroup = (label: IIssueLabel) => {
    if (!workspaceSlug || !projectId) return;

    updateLabel(workspaceSlug.toString(), projectId.toString(), label.id, {
      parent: null,
    });
  };

  const customMenuItems: ICustomMenuItem[] = [
    {
      CustomIcon: CloseOutline,
      onClick: removeFromGroup,
      isVisible: !!label.parent,
      text: "Remove from group",
      key: "remove_from_group",
    },
    {
      CustomIcon: EditOutline,
      onClick: () => {
        setEditLabelForm(true);
        setIsUpdating(true);
      },
      isVisible: true,
      text: "Edit label",
      key: "edit_label",
    },
  ];

  return (
    <LabelDndHOC label={label} isGroup={false} isChild={isChild} isLastChild={isLastChild} onDrop={onDrop}>
      {(isDragging, isDroppingInLabel, dragHandleRef) => (
        <div
          className={cn(
            "group relative overflow-hidden rounded-md border bg-surface-1",
            isDroppingInLabel ? "border-accent-strong ring-1 ring-accent-strong" : "border-subtle-1",
            (isDragging || isParentDragging) && "bg-layer-1"
          )}
        >
          <div
            className={cn("flex min-h-10 items-center justify-between gap-2 py-2.5 pr-3", isEditLabelForm && "pl-3")}
          >
            {isEditLabelForm ? (
              <CreateUpdateLabelInline
                labelForm={isEditLabelForm}
                setLabelForm={setEditLabelForm}
                isUpdating
                labelToUpdate={label}
                labelOperationsCallbacks={labelOperationsCallbacks}
                onClose={() => {
                  setEditLabelForm(false);
                  setIsUpdating(false);
                }}
              />
            ) : (
              <LabelItemBlock
                label={label}
                isDragging={isDragging}
                customMenuItems={customMenuItems}
                handleLabelDelete={handleLabelDelete}
                dragHandleRef={dragHandleRef}
                disabled={!isEditable}
              />
            )}
          </div>
        </div>
      )}
    </LabelDndHOC>
  );
}
