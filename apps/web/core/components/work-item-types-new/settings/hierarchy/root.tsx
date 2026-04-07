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
// plane imports
import { Loader } from "@plane/ui";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";
// local imports
import { WorkItemTypeHierarchyVacantLevel } from "./vacant-level";
import { WorkItemTypeHierarchyLevelItem } from "./level-item";

type Props = {
  workspaceSlug: string;
};

export const WorkItemTypeHierarchyLevelsRoot = observer(function WorkItemTypeHierarchyLevelsRoot({
  workspaceSlug,
}: Props) {
  // store hooks
  const { canCreate, getActiveWorkItemTypesByWorkspaceSlugGroupedByLevel, getLoaderByWorkspaceSlug } =
    useWorkspaceWorkItemTypes();
  const { featuresByWorkspaceSlug } = useWorkspaceFeatures();
  // derived values
  const workItemTypesByLevel = getActiveWorkItemTypesByWorkspaceSlugGroupedByLevel(workspaceSlug);
  const isLoading = getLoaderByWorkspaceSlug(workspaceSlug) === "init-loader";
  const canAddLevel = canCreate(workspaceSlug);
  const maxLevel = workItemTypesByLevel.size > 0 ? Math.max(...workItemTypesByLevel.keys()) : -1;
  const defaultLevel = workspaceSlug ? (featuresByWorkspaceSlug(workspaceSlug)?.work_item_type_default_level ?? 0) : 0;

  if (isLoading)
    return (
      <Loader className="w-full flex flex-col gap-4">
        <Loader.Item height="56px" width="100%" />
        <Loader.Item height="56px" width="100%" />
        <Loader.Item height="56px" width="100%" />
        <Loader.Item height="56px" width="100%" />
      </Loader>
    );

  return (
    <div className="bg-surface-2 rounded-2xl p-4">
      {canAddLevel && (
        <>
          <WorkItemTypeHierarchyVacantLevel defaultLevel={defaultLevel} hideQuickActions level={maxLevel + 1} />
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
          <WorkItemTypeHierarchyLevelItem
            canAddLevel={canAddLevel}
            defaultLevel={defaultLevel}
            level={level}
            workItemTypes={workItemTypes}
          />
        </Fragment>
      ))}
    </div>
  );
});
