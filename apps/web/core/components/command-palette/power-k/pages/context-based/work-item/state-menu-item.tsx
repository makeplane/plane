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
import type { IState } from "@plane/types";
// components
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";
// hooks
import { useUser } from "@/hooks/store/user";
import { useWorkflows } from "@/hooks/store/use-workflows";

export type TPowerKProjectStatesMenuItemsProps = {
  handleSelect: (stateId: string) => void;
  projectId: string | undefined;
  typeId?: string | null;
  selectedStateId: string | undefined;
  states: IState[];
  workspaceSlug: string;
};

export const PowerKProjectStatesMenuItems = observer(function PowerKProjectStatesMenuItems(
  props: TPowerKProjectStatesMenuItemsProps
) {
  const { handleSelect, projectId, typeId, selectedStateId, states, workspaceSlug } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const { isWorkflowsEnabled, getAllowedTransitionStateIds, isApprovalPending } = useWorkflows();
  // derived values
  const isWorkflowEnabled = workspaceSlug && projectId ? isWorkflowsEnabled(workspaceSlug, projectId) : false;
  const availableStateIdMap =
    isWorkflowEnabled && projectId
      ? getAllowedTransitionStateIds(workspaceSlug, projectId, typeId, selectedStateId, currentUser?.id)
      : {};
  const isApproval =
    isWorkflowEnabled && projectId && selectedStateId
      ? isApprovalPending(workspaceSlug, projectId, typeId, selectedStateId)
      : false;

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
        const isDisabled = isApproval || (state.id !== selectedStateId && !availableStateIdMap[state.id]);
        const isSelected = state.id === selectedStateId;
        if (isDisabled) return null;
        return (
          <StateMenuItem
            key={state.id}
            state={state}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onSelect={() => handleSelect(state.id)}
          />
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
