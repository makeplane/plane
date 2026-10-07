/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useRef } from "react";
import { observer } from "mobx-react";

import { Collapsible } from "@makeplane/propel/components/collapsible";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { AddOutline, ChevronDownOutline } from "@makeplane/propel/icons";
// plane imports
import { StateGroupIcon } from "@plane/blocks/icons";
import { EIconSize } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
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

  const isCreateDisabled = !isEditable || createState;

  return (
    <div
      className={cn("rounded-sm border border-subtle bg-surface-2 transition-all", groupItemClassName)}
      ref={dropElementRef}
    >
      <Collapsible
        open={currentStateExpanded}
        onOpenChange={(open) => (open ? handleExpand(groupKey) : handleGroupCollapse(groupKey))}
        indicator={false}
        icon={
          <Icon
            icon={
              <ChevronDownOutline
                className={cn("transition-transform", {
                  "rotate-0": currentStateExpanded,
                  "-rotate-90": !currentStateExpanded,
                })}
              />
            }
          />
        }
        trigger={
          <span className="flex w-full items-center gap-1">
            <StateGroupIcon stateGroup={groupKey} size={EIconSize.XL} className="shrink-0" />
            <span className="px-1 text-14 font-medium text-secondary capitalize">{groupKey}</span>
          </span>
        }
        trailing={
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t("common.add")}
            disabled={isCreateDisabled}
            onClick={() => {
              if (!createState) {
                handleExpand(groupKey);
                setCreateState(true);
              }
            }}
            icon={
              <Icon
                icon={<AddOutline className={isCreateDisabled ? "text-placeholder" : "text-accent-primary/80"} />}
              />
            }
          />
        }
      >
        {shouldShowEmptyState && (
          <div className="flex h-full flex-col items-center justify-center py-4 text-13 text-tertiary">
            <div>{t("project_settings.states.empty_state.title", { groupKey })}</div>
            {isEditable && <div>{t("project_settings.states.empty_state.description")}</div>}
          </div>
        )}

        <div id="group-droppable-container">
          <StateList
            groupKey={groupKey}
            groupedStates={groupedStates}
            states={states}
            disabled={!isEditable}
            stateOperationsCallbacks={stateOperationsCallbacks}
            stateItemClassName={stateItemClassName}
          />
        </div>
      </Collapsible>

      {/* Rendered outside the collapsible panel (as in legacy) so the create form, and whatever the user typed
          into it, survives collapsing the group — the panel unmounts its children when closed. */}
      {isEditable && createState && (
        <div className="mt-1">
          <StateCreate
            groupKey={groupKey}
            handleClose={() => setCreateState(false)}
            createStateCallback={stateOperationsCallbacks.createState}
          />
        </div>
      )}
    </div>
  );
});
