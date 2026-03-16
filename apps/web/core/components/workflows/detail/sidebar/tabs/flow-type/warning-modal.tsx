/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Button } from "@plane/propel/button";
import type { TWorkflowStateType } from "@plane/types";
import { ModalCore } from "@plane/ui";
import { AlertIcon } from "@plane/propel/icons";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  newFlowType: TWorkflowStateType;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

export function FlowTypeChangeWarningModal(props: Props) {
  const { isOpen, onClose, newFlowType, onSubmit, isSubmitting = false } = props;

  // derived values
  const oldFlowLabel = newFlowType === "approval" ? "Transition" : "Approval";
  const newFlowLabel = newFlowType === "approval" ? "Approval" : "Transition";

  // TODO: use AlertModalCore once it supports variant
  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex gap-1.5">
          <AlertIcon className="size-5 text-icon-warning-subtle" />
          <div className="flex flex-col gap-1">
            <h5 className="text-h5-medium">
              Switch from “{oldFlowLabel}” to “{newFlowLabel}”?
            </h5>
            <p className="text-body-sm-regular text-tertiary">
              {newFlowType === "approval" ? (
                <span>
                  This state is currently using a <span className="font-medium">Transition</span>. Switching will remove
                  the existing transition settings.
                </span>
              ) : (
                <span>
                  This state is currently using an <span className="font-medium">Approval</span>. Switching will remove
                  the existing approval review settings.
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="border-t border-subtle" />
        <div className="flex gap-3 justify-end items-center">
          <Button variant="ghost" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button size="lg" onClick={onSubmit} loading={isSubmitting}>
            Switch to {newFlowType}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
