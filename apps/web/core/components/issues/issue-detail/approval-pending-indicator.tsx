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

import { observer } from "mobx-react";
import { InfoIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type TWorkItemApprovalPendingIndicatorProps = {
  className?: string;
};

export const WorkItemApprovalPendingIndicator = observer(function WorkItemApprovalPendingIndicator({
  className,
}: TWorkItemApprovalPendingIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-background-secondary px-2.5 py-1 text-secondary",
        className
      )}
    >
      <InfoIcon className="size-3.5 shrink-0 text-tertiary" />
      <span className="text-tertiary text-caption-md-medium">Approval pending</span>
    </div>
  );
});
