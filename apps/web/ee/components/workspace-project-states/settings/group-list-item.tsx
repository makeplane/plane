"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Plus } from "lucide-react";
// helpers
import { cn } from "@plane/utils";
// components
import {
  ProjectStateList,
  ProjectStateIcon,
  ProjectStateCreate,
} from "@/plane-web/components/workspace-project-states";
// plane web types
import { TProjectStateGroupKey, TProjectStateIdsByGroup } from "@/plane-web/types/workspace-project-states";

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

export const ProjectStateGroupListItem: FC<TGroupItem> = observer((props) => {
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
    <div
      className="space-y-1 border border-custom-border-200 rounded bg-custom-background-90 transition-all p-2"
      ref={dropElementRef}
    >
      <div className="flex justify-between items-center gap-2">
        <div
          className="w-full flex items-center cursor-pointer py-1"
          onClick={() => (!currentStateExpanded ? handleExpand(groupKey) : handleGroupCollapse(groupKey))}
        >
          <div
            className={cn(
              "flex-shrink-0 w-5 h-5 rounded flex justify-center items-center overflow-hidden transition-all",
              {
                "rotate-0": currentStateExpanded,
                "-rotate-90": !currentStateExpanded,
              }
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
          <div className="flex-shrink-0 w-6 h-6 rounded flex justify-center items-center overflow-hidden">
            <ProjectStateIcon projectStateGroup={groupKey} width="14" height="14" />
          </div>
          <div className="text-base font-medium text-custom-text-200 capitalize px-1">{groupKey}</div>
        </div>
        <div
          className="flex-shrink-0 w-6 h-6 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-primary-100/80 hover:text-custom-primary-100"
          onClick={() => !createState && setCreateState(true)}
        >
          <Plus className="w-4 h-4" />
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
        <div className="p-3.5 bg-custom-background-100 rounded">
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
