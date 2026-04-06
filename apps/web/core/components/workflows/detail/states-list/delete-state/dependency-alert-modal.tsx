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

// plane imports
import { Badge } from "@plane/propel/badge";
import { Button } from "@plane/propel/button";
import { AlertIcon } from "@plane/propel/icons";
import { ModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  stateName: string;
  transitionCount: number;
  approvalCount: number;
};

export function DependencyAlertModal(props: Props) {
  const { isOpen, onClose, stateName, transitionCount, approvalCount } = props;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-start gap-1.5">
          <AlertIcon className="size-4 text-icon-danger-secondary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h5 className="text-h5-medium">Action Required: Resolve Dependencies</h5>
              <p className="text-body-sm-regular text-tertiary">
                The state <span className="font-medium text-secondary">{stateName}</span> cannot be removed while active
                dependencies exist. Please remove all associated transition and approvals to ensure workflow integrity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {transitionCount > 0 && (
                <Button variant={"secondary"} prependIcon={<Badge variant="neutral"> {transitionCount}</Badge>}>
                  Transition {transitionCount}
                </Button>
              )}
              {approvalCount > 0 && (
                <Button variant={"secondary"} prependIcon={<Badge variant="neutral"> {approvalCount}</Badge>}>
                  Approval {approvalCount}
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-subtle" />
        <div className="flex justify-end">
          <Button variant="ghost" size="lg" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
