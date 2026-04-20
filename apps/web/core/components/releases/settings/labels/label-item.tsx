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
import React, { useState } from "react";
import { observer } from "mobx-react";
import type { ReleaseLabel } from "@plane/types";
// local
import type { ReleaseLabelOperationsCallbacks } from "./inline-form";
import { CreateUpdateReleaseLabelInline } from "./inline-form";
import { ReleaseLabelBlock } from "./label-block";
import { ReleaseLabelDndHOC } from "./label-dnd-hoc";

type Props = {
  label: ReleaseLabel;
  isLastChild: boolean;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  handleLabelDelete: (label: ReleaseLabel) => void;
  onDrop: (draggingLabelId: string, droppedLabelId: string | undefined, dropAtEndOfList: boolean) => void;
  labelOperationsCallbacks: ReleaseLabelOperationsCallbacks;
  permissions: {
    canReorder: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
};

export const ReleaseLabelItem = observer(function ReleaseLabelItem(props: Props) {
  const { label, isLastChild, setIsUpdating, handleLabelDelete, onDrop, labelOperationsCallbacks, permissions } = props;
  const [isEditForm, setEditForm] = useState(false);

  return (
    <ReleaseLabelDndHOC label={label} isLastChild={isLastChild} onDrop={onDrop} canReorder={permissions.canReorder}>
      {(isDragging: boolean, dragHandleRef: React.RefObject<HTMLButtonElement>) => (
        <div
          className={`rounded-sm ${isDragging ? "border-[2px] border-accent-strong" : "border-[1.5px] border-transparent"}`}
        >
          <div
            className={`rounded-sm text-primary ${!isDragging ? "border-[0.5px] border-subtle-1" : ""} ${isDragging ? "bg-layer-1" : "bg-surface-1"}`}
          >
            <div className="py-2 px-1">
              {isEditForm && permissions.canEdit ? (
                <CreateUpdateReleaseLabelInline
                  isUpdating
                  labelToUpdate={label}
                  labelOperationsCallbacks={labelOperationsCallbacks}
                  onClose={() => {
                    setEditForm(false);
                    setIsUpdating(false);
                  }}
                />
              ) : (
                <ReleaseLabelBlock
                  label={label}
                  isDragging={isDragging}
                  handleEdit={() => {
                    setEditForm(true);
                    setIsUpdating(true);
                  }}
                  handleDelete={handleLabelDelete}
                  dragHandleRef={dragHandleRef}
                  permissions={permissions}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </ReleaseLabelDndHOC>
  );
});
