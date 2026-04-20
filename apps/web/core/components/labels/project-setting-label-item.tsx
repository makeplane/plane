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

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { EditIcon, CloseIcon } from "@plane/propel/icons";
// types
import type { IIssueLabel } from "@plane/types";
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
  permissions: {
    canDragAndDrop: boolean;
    canDelete: boolean;
    canEdit: boolean;
  };
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
    permissions,
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
      CustomIcon: CloseIcon,
      onClick: removeFromGroup,
      isVisible: !!label.parent,
      text: "Remove from group",
      key: "remove_from_group",
    },
    {
      CustomIcon: EditIcon,
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
    <LabelDndHOC
      label={label}
      isGroup={false}
      isChild={isChild}
      isLastChild={isLastChild}
      canDragAndDrop={permissions.canDragAndDrop}
      onDrop={onDrop}
    >
      {(isDragging, isDroppingInLabel, dragHandleRef) => (
        <div
          className={`rounded-sm ${isDroppingInLabel ? "border-[2px] border-accent-strong" : "border-[1.5px] border-transparent"}`}
        >
          <div
            className={`py-3 px-1 group relative flex items-center justify-between gap-2 space-y-3 rounded-sm  ${
              isDroppingInLabel ? "" : "border-[0.5px] border-subtle"
            } ${isDragging || isParentDragging ? "bg-layer-1" : "bg-surface-1"}`}
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
                permissions={permissions}
              />
            )}
          </div>
        </div>
      )}
    </LabelDndHOC>
  );
}
