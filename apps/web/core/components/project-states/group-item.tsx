/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef } from "react";
import { observer } from "mobx-react";

// plane imports
import { EIconSize, STATE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlusIcon, StateGroupIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
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

export const GroupItem = observer(function GroupItem(props: TGroupItem) {
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
      className={cn("space-y-1 rounded-sm border border-subtle bg-surface-2 p-2 transition-all", groupItemClassName)}
      ref={dropElementRef}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex w-full cursor-pointer items-center py-1"
          onClick={() => (!currentStateExpanded ? handleExpand(groupKey) : handleGroupCollapse(groupKey))}
        >
          <div
            className={cn(
              "flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm transition-all",
              {
                "rotate-0": currentStateExpanded,
                "-rotate-90": !currentStateExpanded,
              }
            )}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </div>
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm">
            <StateGroupIcon stateGroup={groupKey} size={EIconSize.XL} />
          </div>
          <div className="px-1 text-14 font-medium text-secondary capitalize">{groupKey}</div>
        </div>
        <button
          type="button"
          data-ph-element={STATE_TRACKER_ELEMENTS.STATE_GROUP_ADD_BUTTON}
          className={cn(
            "flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm text-accent-primary/80 transition-colors hover:bg-layer-1 hover:text-accent-primary",
            (!isEditable || createState) && "cursor-not-allowed text-placeholder hover:text-placeholder"
          )}
          onClick={() => {
            if (!createState) {
              handleExpand(groupKey);
              setCreateState(true);
            }
          }}
          disabled={!isEditable || createState}
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {shouldShowEmptyState && (
        <div className="flex h-full flex-col items-center justify-center py-4 text-13 text-tertiary">
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
