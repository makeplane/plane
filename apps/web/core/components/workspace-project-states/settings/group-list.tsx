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
// plane web components
import { ProjectStateGroupListItem } from "@/components/workspace-project-states";
// plane web types
import type { TProjectStateGroupKey, TProjectStateIdsByGroup } from "@/types/workspace-project-states";
import { EProjectStateGroup } from "@/types/workspace-project-states";

type TGroupList = {
  workspaceSlug: string;
  workspaceId: string;
  groupProjectStates: TProjectStateIdsByGroup;
};

export const ProjectStateGroupList = observer(function ProjectStateGroupList(props: TGroupList) {
  const { workspaceSlug, workspaceId, groupProjectStates } = props;
  // states
  const [groupsExpanded, setGroupsExpanded] = useState<Partial<TProjectStateGroupKey>[]>([
    EProjectStateGroup.DRAFT,
    EProjectStateGroup.PLANNING,
    EProjectStateGroup.EXECUTION,
    EProjectStateGroup.MONITORING,
    EProjectStateGroup.COMPLETED,
    EProjectStateGroup.CANCELLED,
  ]);

  const handleGroupCollapse = (groupKey: TProjectStateGroupKey) => {
    setGroupsExpanded((prev) => {
      if (prev.includes(groupKey)) {
        return prev.filter((key) => key !== groupKey);
      }
      return prev;
    });
  };

  const handleExpand = (groupKey: TProjectStateGroupKey) => {
    setGroupsExpanded((prev) => {
      console.log(prev, groupKey);
      if (prev.includes(groupKey)) {
        console.log("contains");
        return prev;
      }
      return [...prev, groupKey];
    });
  };

  return (
    <div className="flex flex-col gap-y-4">
      {Object.entries(groupProjectStates).map(([key, value]) => {
        const groupKey = key as TProjectStateGroupKey;
        const groupStateIds = value;
        return (
          <ProjectStateGroupListItem
            key={groupKey}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            groupProjectStates={groupProjectStates}
            groupKey={groupKey}
            groupStateIds={groupStateIds}
            groupsExpanded={groupsExpanded}
            handleGroupCollapse={handleGroupCollapse}
            handleExpand={handleExpand}
          />
        );
      })}
    </div>
  );
});
