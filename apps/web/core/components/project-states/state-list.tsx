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
import type { IState, TStateGroups, TStateOperationsCallbacks } from "@plane/types";
// components
import { StateItem } from "@/components/project-states";

type TStateList = {
  groupKey: TStateGroups;
  groupedStates: Record<string, IState[]>;
  states: IState[];
  stateOperationsCallbacks: TStateOperationsCallbacks;
  shouldTrackEvents: boolean;
  stateItemClassName?: string;
  permissions: {
    canEdit: (stateId: string) => boolean;
    canDelete: (stateId: string) => boolean;
    canMarkAsDefault: (stateId: string) => boolean;
    canDragAndDrop: (stateId: string) => boolean;
  };
};

export const StateList = observer(function StateList(props: TStateList) {
  const {
    groupKey,
    groupedStates,
    states,
    stateOperationsCallbacks,
    shouldTrackEvents,
    permissions,
    stateItemClassName,
  } = props;

  return (
    <>
      {states.map((state: IState) => (
        <StateItem
          key={state?.name}
          groupKey={groupKey}
          groupedStates={groupedStates}
          totalStates={states.length || 0}
          state={state}
          permissions={permissions}
          stateOperationsCallbacks={stateOperationsCallbacks}
          shouldTrackEvents={shouldTrackEvents}
          stateItemClassName={stateItemClassName}
        />
      ))}
    </>
  );
});
