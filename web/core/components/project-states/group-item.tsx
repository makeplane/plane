"use client";

import { FC, useState, useRef } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Plus } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IState, TStateGroups } from "@plane/types";
import { StateGroupIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StateList, StateCreate } from "@/components/project-states";
// hooks
import { useUserPermissions } from "@/hooks/store";

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
  // refs
  const dropElementRef = useRef<HTMLDivElement | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // state
  const [createState, setCreateState] = useState(false);
  // derived values
  const currentStateExpanded = groupsExpanded.includes(groupKey);
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const shouldShowEmptyState = states.length === 0 && currentStateExpanded && !createState;

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
        <button
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-primary-100/80 hover:text-custom-primary-100",
            !isEditable && "cursor-not-allowed text-custom-text-400 hover:text-custom-text-400"
          )}
          onClick={() => !createState && setCreateState(true)}
          disabled={!isEditable}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {shouldShowEmptyState && (
        <div className="flex flex-col justify-center items-center h-full py-4 text-sm text-custom-text-300">
          <div>{t("project_settings.states.empty_state.title", { groupKey })}</div>
          {isEditable && <div>{t("project_settings.states.empty_state.description")}</div>}
        </div>
      )}

      {currentStateExpanded && (
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
