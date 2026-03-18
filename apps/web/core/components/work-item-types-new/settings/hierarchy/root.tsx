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

import { Fragment } from "react";
import { MoveDown } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane web imports
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
// local imports
import { WorkItemTypeHierarchyAddToLevelButton } from "./add-to-level-button";
import { WorkItemTypeHierarchyLevelItem } from "./level-item";

export const WorkItemTypeHierarchyLevelsRoot = observer(function WorkItemTypeHierarchyLevelsRoot() {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { canCreate, getWorkItemTypesByWorkspaceSlugGroupedByLevel } = useWorkspaceWorkItemTypes();
  // derived values
  const workItemTypesByLevel = workspaceSlug ? getWorkItemTypesByWorkspaceSlugGroupedByLevel(workspaceSlug) : new Map();
  const canAddLevel = !!workspaceSlug && canCreate(workspaceSlug);

  return (
    <div className="bg-surface-2 rounded-2xl p-4">
      {canAddLevel && (
        <>
          <WorkItemTypeHierarchyAddToLevelButton />
          <div className="h-8 py-1 pl-4">
            <MoveDown className="size-6 text-tertiary stroke-1" />
          </div>
        </>
      )}
      {Array.from(workItemTypesByLevel.entries()).map(([level, workItemTypes], index) => (
        <Fragment key={level}>
          {index > 0 && (
            <div className="h-8 py-1 pl-4">
              <MoveDown className="size-6 text-tertiary stroke-1" />
            </div>
          )}
          <WorkItemTypeHierarchyLevelItem canAddLevel={canAddLevel} level={level} workItemTypes={workItemTypes} />
        </Fragment>
      ))}
    </div>
  );
});
