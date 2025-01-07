"use client";

import { FC, useState, useRef } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Plus } from "lucide-react";
import { IState, TStateGroups } from "@plane/types";
// components
import { StateGroupIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { StateList, StateCreate } from "@/components/project-states";
// hooks
import { useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type TGroupItem = {
  workspaceSlug: string;
  projectId: string;
  groupKey: TStateGroups;
  groupsExpanded: Partial<TStateGroups>[];
  handleGroupCollapse: (groupKey: TStateGroups) => void;
  handleExpand: (groupKey: TStateGroups) => void;
  groupedStates: Record<string, IState[]>;
  states: IState[];
};

export const GroupItem: FC<TGroupItem> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    groupKey,
    groupedStates,
    states,
    groupsExpanded,
    handleExpand,
    handleGroupCollapse,
  } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // state
  const [createState, setCreateState] = useState(false);

  // derived values
  const currentStateExpanded = groupsExpanded.includes(groupKey);
  // refs
  const dropElementRef = useRef<HTMLDivElement | null>(null);

  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

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
            <StateGroupIcon stateGroup={groupKey} height="16px" width="16px" />
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

      {groupedStates[groupKey].length > 0 && currentStateExpanded && (
        <div id="group-droppable-container">
          <StateList
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            groupKey={groupKey}
            groupedStates={groupedStates}
            states={states}
            disabled={!isEditable}
          />
        </div>
      )}

      {isEditable && createState && (
        <div className="">
          <StateCreate
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            groupKey={groupKey}
            handleClose={() => setCreateState(false)}
          />
        </div>
      )}
    </div>
  );
});
