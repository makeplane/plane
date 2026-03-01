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

import { observer } from "mobx-react";
// plane types
import { StateGroupIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { IState } from "@plane/types";
// components
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web imports
import { WorkFlowDisabledMessage } from "@/components/workflow/workflow-tree/workflow-disabled-message";

export type TPowerKProjectStatesMenuItemsProps = {
  handleSelect: (stateId: string) => void;
  projectId: string | undefined;
  selectedStateId: string | undefined;
  states: IState[];
  workspaceSlug: string;
};

export const PowerKProjectStatesMenuItems = observer(function PowerKProjectStatesMenuItems(
  props: TPowerKProjectStatesMenuItemsProps
) {
  const { handleSelect, projectId, selectedStateId, states, workspaceSlug } = props;
  // store hooks
  const { getIsWorkflowEnabled, getAvailableProjectStateIdMap } = useProjectState();
  // derived values
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug, projectId);
  const availableStateIdMap = getAvailableProjectStateIdMap(projectId, selectedStateId);

  if (!isWorkflowEnabled) {
    return (
      <>
        {states.map((state) => (
          <StateMenuItem
            key={state.id}
            state={state}
            isSelected={state.id === selectedStateId}
            isDisabled={false}
            onSelect={() => handleSelect(state.id)}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {states.map((state) => {
        const isDisabled = state.id !== selectedStateId && !availableStateIdMap[state.id];
        const isSelected = state.id === selectedStateId;
        return (
          <Tooltip
            key={state.id}
            tooltipContent={selectedStateId ? <WorkFlowDisabledMessage parentStateId={selectedStateId} /> : undefined}
            position="right-start"
            className="border-[0.5px] border-subtle-1 mx-0.5 shadow-lg"
            disabled={!isDisabled}
          >
            <div>
              <StateMenuItem
                state={state}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onSelect={() => handleSelect(state.id)}
              />
            </div>
          </Tooltip>
        );
      })}
    </>
  );
});

type TStateMenuItemProps = {
  state: IState;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
};

const StateMenuItem = (props: TStateMenuItemProps) => {
  const { state, isSelected, isDisabled, onSelect } = props;
  return (
    <PowerKModalCommandItem
      key={state.id}
      iconNode={<StateGroupIcon stateGroup={state.group} color={state.color} className="shrink-0 size-3.5" />}
      label={state.name}
      isSelected={isSelected}
      isDisabled={isDisabled}
      onSelect={onSelect}
    />
  );
};
