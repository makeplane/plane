/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { TransferWorkItemOutline, WarningCircleOutline } from "@makeplane/propel/icons";
// ui
import { Button } from "@plane/propel/button";

type Props = {
  handleClick: () => void;
  canTransferIssues?: boolean;
  disabled?: boolean;
};

export function TransferIssues(props: Props) {
  const { handleClick, canTransferIssues = false, disabled = false } = props;
  return (
    <div className="-mt-2 mb-4 flex items-center justify-between px-4 pt-6">
      <div className="flex items-center gap-2 text-13 text-secondary">
        <WarningCircleOutline className="h-3.5 w-3.5 text-secondary" />
        <span>Completed cycles are not editable.</span>
      </div>

      {canTransferIssues && (
        <div>
          <Button
            variant="primary"
            size="lg"
            prependIcon={<TransferWorkItemOutline />}
            onClick={handleClick}
            disabled={disabled}
          >
            Transfer work items
          </Button>
        </div>
      )}
    </div>
  );
}
