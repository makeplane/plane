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

import { AlertCircle } from "lucide-react";
// ui
import { Button } from "@plane/propel/button";
import { TransferIcon } from "@plane/propel/icons";

type Props = {
  handleClick: () => void;
  canTransferWorkItems: boolean;
};

export function TransferIssues(props: Props) {
  const { handleClick, canTransferWorkItems } = props;
  return (
    <div className="-mt-2 mb-4 flex items-center justify-between px-4 pt-6">
      <div className="flex items-center gap-2 text-13 text-secondary">
        <AlertCircle className="h-3.5 w-3.5 text-secondary" />
        <span>Completed cycles are not editable.</span>
      </div>

      {canTransferWorkItems && (
        <div className="shrink-0">
          <Button variant="primary" size="lg" prependIcon={<TransferIcon />} onClick={handleClick}>
            Transfer work items
          </Button>
        </div>
      )}
    </div>
  );
}
