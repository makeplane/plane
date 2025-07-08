"use client";

import { FC, useState, useRef } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Plus } from "lucide-react";
// plane imports
import { EIconSize, STATE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
import { StateGroupIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StateList, StateCreate } from "@/components/project-states";

type TGroupItem = {
  groupKey: TStateGroups;
  groupsExpanded: Partial<TStateGroups>[];
  groupedStates: Record<string, IState[]>;
  states: IState[];
  stateOperationsCallbacks: TStateOperationsCallbacks;
  isEditable: boolean;
  shouldTrackEvents: boolean;
  groupItemClassName?: string;
  stateItemClassName?: string;
  handleGroupCollapse: (groupKey: TStateGroups) => void;
  handleExpand: (groupKey: TStateGroups) => void;
};

export const GroupItem: FC<TGroupItem> = observer((props) => {
  const {
    groupKey,
    groupedStates,
    states,
    groupsExpanded,
    isEditable,
    stateOperationsCallbacks,
    shouldTrackEvents,
    groupItemClassName,
    stateItemClassName,
    handleExpand,
    handleGroupCollapse,
  } = props;
  // refs
  const dropElementRef = useRef<HTMLDivElement | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // state
  const [createState, setCreateState] = useState(false);
  // derived values
  const currentStateExpanded = groupsExpanded.includes(groupKey);
  const shouldShowEmptyState = states.length === 0 && currentStateExpanded && !createState;

  return (
    <div
      className={cn(
        "space-y-1 border border-custom-border-200 rounded bg-custom-background-90 transition-all p-2",
        groupItemClassName
      )}
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
            <StateGroupIcon stateGroup={groupKey} size={EIconSize.XL} />
          </div>
          <div className="text-base font-medium text-custom-text-200 capitalize px-1">{groupKey}</div>
        </div>
        <button
          type="button"
          data-ph-element={STATE_TRACKER_ELEMENTS.STATE_GROUP_ADD_BUTTON}
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-primary-100/80 hover:text-custom-primary-100",
            (!isEditable || createState) && "cursor-not-allowed text-custom-text-400 hover:text-custom-text-400"
          )}
          onClick={() => {
            if (!createState) {
              handleExpand(groupKey);
              setCreateState(true);
            }
          }}
          disabled={!isEditable || createState}
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
            groupKey={groupKey}
            groupedStates={groupedStates}
            states={states}
            disabled={!isEditable}
            stateOperationsCallbacks={stateOperationsCallbacks}
            shouldTrackEvents={shouldTrackEvents}
            stateItemClassName={stateItemClassName}
          />
        </div>
      )}

      {isEditable && createState && (
        <div className="">
          <StateCreate
            groupKey={groupKey}
            handleClose={() => setCreateState(false)}
            createStateCallback={stateOperationsCallbacks.createState}
            shouldTrackEvents={shouldTrackEvents}
          />
        </div>
      )}
    </div>
  );
});
