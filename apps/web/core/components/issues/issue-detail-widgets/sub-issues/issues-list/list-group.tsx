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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { CircleDashed } from "lucide-react";
import { ALL_ISSUES } from "@plane/constants";
import { ChevronRightIcon } from "@plane/propel/icons";
import type { IGroupByColumn, TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";
import { SubIssuesListItem } from "./list-item";

interface TSubIssuesListGroupProps {
  workItemIds: string[];
  projectId: string;
  workspaceSlug: string;
  group: IGroupByColumn;
  serviceType: TIssueServiceType;
  canEdit: boolean;
  parentIssueId: string;
  rootIssueId: string;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  storeType?: EIssuesStoreType;
  spacingLeft?: number;
}

export const SubIssuesListGroup = observer(function SubIssuesListGroup(props: TSubIssuesListGroupProps) {
  const {
    group,
    serviceType,
    canEdit,
    parentIssueId,
    rootIssueId,
    projectId,
    workspaceSlug,
    handleIssueCrudState,
    subIssueOperations,
    workItemIds,
    storeType = EIssuesStoreType.PROJECT,
    spacingLeft = 0,
  } = props;

  const isAllIssues = group.id === ALL_ISSUES;

  // states
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(true);

  if (!workItemIds.length) return null;
  return (
    <>
      <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
        {!isAllIssues && (
          <CollapsibleTrigger className={cn("hidden", !isAllIssues && "block")}>
            <div className="flex items-center gap-2 p-3">
              <ChevronRightIcon
                className={cn("size-3.5 transition-all text-placeholder", {
                  "rotate-90": isCollapsibleOpen,
                })}
                strokeWidth={2.5}
              />
              <div className="flex-shrink-0 grid place-items-center overflow-hidden">
                {group.icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
              </div>
              <span className="text-13 text-primary font-medium">{group.name}</span>
              <span className="text-13 text-placeholder">{workItemIds.length}</span>
            </div>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          {workItemIds?.map((workItemId) => (
            <SubIssuesListItem
              key={workItemId}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              parentIssueId={parentIssueId}
              rootIssueId={rootIssueId}
              issueId={workItemId}
              canEdit={canEdit}
              handleIssueCrudState={handleIssueCrudState}
              subIssueOperations={subIssueOperations}
              issueServiceType={serviceType}
              spacingLeft={spacingLeft}
              storeType={storeType}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
});
