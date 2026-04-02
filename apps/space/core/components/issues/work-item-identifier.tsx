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
import { Tooltip } from "@plane/propel/tooltip";
import { cn, formatProjectWorkItemIdentifierForDisplay } from "@plane/utils";
import { useWorkItemType } from "@/hooks/store/use-work-item-type";
import type { IIssue } from "@/types/issue";
import { WorkItemTypeLogo } from "./work-item-type-logo";

type Props = {
  workItem: Pick<IIssue, "sequence_id" | "type_id">;
  projectIdentifier: string;
  className?: string;
  identifierClassName?: string;
  size?: "xs" | "sm";
  showTypeName?: boolean;
};

// TODO-@plane/blocks WorkItemIdentifier
export const WorkItemIdentifier = observer(function WorkItemIdentifier({
  workItem,
  projectIdentifier,
  className,
  identifierClassName,
  size = "sm",
  showTypeName = false,
}: Props) {
  const { getWorkItemTypeById } = useWorkItemType();
  const workItemType = workItem.type_id ? getWorkItemTypeById(workItem.type_id) : undefined;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {workItemType && (
        <Tooltip tooltipContent={workItemType.name} disabled={!workItemType.name} position="top-start">
          <div className="flex shrink-0">
            <WorkItemTypeLogo
              logoProps={workItemType.logo_props}
              name={workItemType.name}
              size={size}
              showName={showTypeName}
            />
          </div>
        </Tooltip>
      )}
      <span className={identifierClassName}>
        {formatProjectWorkItemIdentifierForDisplay(projectIdentifier || "", workItem.sequence_id)}
      </span>
    </div>
  );
});
