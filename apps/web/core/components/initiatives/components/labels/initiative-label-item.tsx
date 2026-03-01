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

import { EditIcon, TrashIcon } from "@plane/propel/icons";
// plane imports
import type { TInitiativeLabel } from "@plane/types";
// components
import type { TInitiativeLabelOperationsCallbacks } from "./create-update-initiative-label-inline";
import { CreateUpdateInitiativeLabelInline } from "./create-update-initiative-label-inline";
import type { IInitiativeCustomMenuItem } from "./initiative-label-block";
import { InitiativeLabelBlock } from "./initiative-label-block";
import { InitiativeLabelDndHOC } from "./initiative-label-drag-n-drop-HOC";

type Props = {
  label: TInitiativeLabel;
  handleLabelDelete: (label: TInitiativeLabel) => void;
  setIsUpdating: Dispatch<SetStateAction<boolean>>;
  isParentDragging: boolean;
  isChild: boolean;
  isLastChild: boolean;
  onDrop: (draggingLabelId: string, droppedLabelId: string | undefined, dropAtEndOfList: boolean) => void;
  labelOperationsCallbacks: TInitiativeLabelOperationsCallbacks;
};

export const InitiativeLabelItem = observer(function InitiativeLabelItem(props: Props) {
  const { label, handleLabelDelete, setIsUpdating, isParentDragging, isLastChild, onDrop, labelOperationsCallbacks } =
    props;

  // states
  const [isEditLabelForm, setEditLabelForm] = useState(false);

  const customMenuItems: IInitiativeCustomMenuItem[] = [
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
    {
      CustomIcon: TrashIcon,
      onClick: () => {
        handleLabelDelete(label);
      },
      isVisible: true,
      text: "Delete label",
      key: "delete_label",
    },
  ];

  return (
    <InitiativeLabelDndHOC label={label} isLastChild={isLastChild} onDrop={onDrop}>
      {(isDragging: boolean, dragHandleRef: React.RefObject<HTMLButtonElement>) => (
        <div
          className={`rounded-sm ${isDragging ? "border-[2px] border-accent-strong" : "border-[1.5px] border-transparent"}`}
        >
          <div
            className={`rounded-sm text-primary ${
              !isDragging ? "border-[0.5px] border-subtle-1" : ""
            } ${isDragging ? "bg-layer-1" : "bg-surface-1"} ${isParentDragging ? "opacity-60" : ""}`}
          >
            <div className="py-2 px-3">
              {isEditLabelForm ? (
                <CreateUpdateInitiativeLabelInline
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
                <InitiativeLabelBlock
                  label={label}
                  isDragging={isDragging}
                  customMenuItems={customMenuItems}
                  handleLabelDelete={handleLabelDelete}
                  dragHandleRef={dragHandleRef}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </InitiativeLabelDndHOC>
  );
});
