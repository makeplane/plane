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

import { useRef, useState } from "react";
import { observer } from "mobx-react";

import { PlusIcon, ChevronDownIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
// components
import { ProjectStateList, ProjectStateIcon, ProjectStateCreate } from "@/components/workspace-project-states";
// plane web types
import type { TProjectStateGroupKey, TProjectStateIdsByGroup } from "@/types/workspace-project-states";

type TGroupItem = {
  workspaceSlug: string;
  workspaceId: string;
  groupProjectStates: TProjectStateIdsByGroup;
  groupKey: TProjectStateGroupKey;
  groupStateIds: string[];
  groupsExpanded: Partial<TProjectStateGroupKey>[];
  handleGroupCollapse: (groupKey: TProjectStateGroupKey) => void;
  handleExpand: (groupKey: TProjectStateGroupKey) => void;
};

export const ProjectStateGroupListItem = observer(function ProjectStateGroupListItem(props: TGroupItem) {
  const {
    workspaceSlug,
    workspaceId,
    groupProjectStates,
    groupKey,
    groupStateIds,
    groupsExpanded,
    handleGroupCollapse,
    handleExpand,
  } = props;
  // state
  const [createState, setCreateState] = useState(false);
  // derived values
  const currentStateExpanded = groupsExpanded.includes(groupKey);
  // refs
  const dropElementRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="space-y-1 border border-subtle rounded-lg bg-layer-1 transition-all p-2" ref={dropElementRef}>
      <div className="flex justify-between items-center gap-2">
        <div
          className="w-full flex items-center cursor-pointer py-1"
          onClick={() => (!currentStateExpanded ? handleExpand(groupKey) : handleGroupCollapse(groupKey))}
        >
          <div
            className={cn(
              "flex-shrink-0 w-5 h-5 rounded-sm flex justify-center items-center overflow-hidden transition-all",
              {
                "rotate-0": currentStateExpanded,
                "-rotate-90": !currentStateExpanded,
              }
            )}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </div>
          <div className="flex-shrink-0 w-6 h-6 rounded-sm flex justify-center items-center overflow-hidden">
            <ProjectStateIcon projectStateGroup={groupKey} width="14" height="14" />
          </div>
          <div className="text-14 font-medium text-secondary capitalize px-1">{groupKey}</div>
        </div>
        <div
          className="flex-shrink-0 w-6 h-6 rounded-sm flex justify-center items-center overflow-hidden transition-colors hover:bg-layer-1 cursor-pointer text-accent-primary/80 hover:text-accent-primary"
          onClick={() => !createState && setCreateState(true)}
        >
          <PlusIcon className="w-4 h-4" />
        </div>
      </div>

      {groupStateIds && groupStateIds.length > 0 && currentStateExpanded && (
        <div id="group-droppable-container">
          <ProjectStateList
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            groupProjectStates={groupProjectStates}
            groupKey={groupKey}
            groupStateIds={groupStateIds}
          />
        </div>
      )}

      {createState && (
        <div className="p-3.5 bg-surface-1 rounded">
          <ProjectStateCreate
            workspaceSlug={workspaceSlug}
            groupKey={groupKey}
            handleClose={() => setCreateState(false)}
          />
        </div>
      )}
    </div>
  );
});
