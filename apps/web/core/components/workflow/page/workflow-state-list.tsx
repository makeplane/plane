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

import type { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import type { IState } from "@plane/types";
// local imports
import { WorkflowStateItem } from "./workflow-state-item";

type TStateList = {
  workspaceSlug: string;
  projectId: string;
  states: IState[];
};

export const WorkflowStateList = observer(function WorkflowStateList(props: TStateList) {
  const { workspaceSlug, projectId, states } = props;

  return (
    <div className="flex flex-col gap-4">
      {states.map((state: IState) => (
        <WorkflowStateItem
          key={state?.name}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          totalStates={states.length || 0}
          state={state}
        />
      ))}
    </div>
  );
});
