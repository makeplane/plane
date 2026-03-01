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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { InfoIcon, ChevronDownIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { Switch } from "@plane/propel/switch";
import type { IState } from "@plane/types";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";
// components
import { StateItemTitle } from "@/components/project-states/state-item-title";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { StateItemContent } from "./state-item-content";
import { StateTransitionCount } from "./state-transition-count";

export type StateItemChildProps = {
  workspaceSlug: string;
  projectId: string;
  stateCount: number;
  state: IState;
};

export const StateItemChild = observer(function StateItemChild(props: StateItemChildProps) {
  const { workspaceSlug, projectId, stateCount, state } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(true);
  // store hooks
  const {
    stateTransitionMap,
    getNextAvailableTransitionStateId,
    toggleAllowWorkItemCreationLogic,
    getIsWorkItemCreationAllowedForState,
  } = useProjectState();
  // derived state
  const isDefaultState = state.default;
  const isIssueCreationAllowedForState = getIsWorkItemCreationAllowedForState(state.id);
  const currentTransitionMap = stateTransitionMap[state.id];
  const shouldEnableAddition = !!getNextAvailableTransitionStateId(projectId, state.id);
  const currentTransitionIds = Object.keys(currentTransitionMap ?? {});

  const handleToggleAllowWorkItemCreation = async () => {
    await toggleAllowWorkItemCreationLogic(workspaceSlug, state.id);
  };

  return (
    <div className="flex flex-col w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger className="w-full">
          <div className="flex w-full items-center gap-2 py-2.5 px-3 bg-layer-1">
            <div className="w-fit flex-shrink-0">
              <StateItemTitle
                setUpdateStateModal={() => {}}
                stateCount={stateCount}
                disabled
                state={state}
                shouldShowDescription={false}
              />
            </div>
            <div className="flex grow items-center justify-between w-full">
              <StateTransitionCount currentTransitionMap={currentTransitionMap} />
              <div className="flex w-full items-center justify-end gap-3">
                <div className="flex gap-1.5">
                  <span className="text-11 text-placeholder font-medium">
                    {isDefaultState ? (
                      <Tooltip position="left" tooltipContent={t("workflows.workflow_states.default_state")}>
                        <InfoIcon className="flex-shrink-0 size-4 text-placeholder hover:text-tertiary cursor-help" />
                      </Tooltip>
                    ) : (
                      <>{t("workflows.workflow_states.work_item_creation")}</>
                    )}
                  </span>
                  {!isDefaultState && (
                    <Switch
                      value={isIssueCreationAllowedForState}
                      onChange={() => handleToggleAllowWorkItemCreation()}
                      label={t("workflows.workflow_states.work_item_creation")}
                      disabled={isDefaultState}
                    />
                  )}
                </div>
                <ChevronDownIcon
                  strokeWidth={2}
                  className={cn("transition-all size-4 text-placeholder hover:text-tertiary", {
                    "rotate-180 text-secondary": isOpen,
                  })}
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <StateItemContent
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            disabled
            state={state}
            transitionIds={currentTransitionIds}
            shouldEnableNewTransitionAddition={shouldEnableAddition}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
