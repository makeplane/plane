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
// plane imports
import type { IState } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { AddStateTransition } from "./add-state-transition";
import { StateTransitionItem } from "./state-transition-item";

export type StateItemContentProps = {
  workspaceSlug: string;
  projectId: string;
  disabled: boolean;
  state: IState;
  transitionIds: string[];
  shouldEnableNewTransitionAddition: boolean;
};

export const StateItemContent = observer(function StateItemContent(props: StateItemContentProps) {
  const { workspaceSlug, projectId, disabled, state, transitionIds, shouldEnableNewTransitionAddition } = props;

  return (
    <div className="flex flex-col w-full gap-1.5 p-2">
      <div className={cn("flex flex-col gap-4 px-3", transitionIds.length > 0 && "py-2")}>
        {transitionIds.map((transitionId) => (
          <StateTransitionItem
            key={transitionId}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            disabled={disabled}
            parentStateId={state.id}
            transitionId={transitionId}
          />
        ))}
      </div>
      {shouldEnableNewTransitionAddition && (
        <AddStateTransition workspaceSlug={workspaceSlug} projectId={projectId} parentStateId={state.id} />
      )}
    </div>
  );
});
