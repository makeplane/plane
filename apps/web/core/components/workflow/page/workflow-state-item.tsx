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
import { cn } from "@plane/utils";
// local imports
import { StateItemChild } from "../state";

type TStateItem = {
  workspaceSlug: string;
  projectId: string;
  totalStates: number;
  state: IState;
};

export const WorkflowStateItem = observer(function WorkflowStateItem(props: TStateItem) {
  const { workspaceSlug, projectId, totalStates, state } = props;

  return (
    <div className={cn("relative border border-subtle rounded-sm group")}>
      <StateItemChild workspaceSlug={workspaceSlug} projectId={projectId} stateCount={totalStates} state={state} />
    </div>
  );
});
