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
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { WorkflowTree } from "./workflow-tree";
import { StatePill } from "./state-pill";

type Props = {
  parentStateId: string;
  typeId?: string | null;
};

export const WorkFlowEnabledMessage = observer(function WorkFlowEnabledMessage(props: Props) {
  const { parentStateId, typeId } = props;
  // store hooks
  const { getStateById } = useProjectState();
  // derived state
  const parentState = getStateById(parentStateId);

  if (!parentState) return <></>;

  return (
    <div className="relative flex max-h-[400px] w-[320px] flex-col rounded-lg bg-surface-1">
      <div className="flex items-center gap-1 p-3">
        <span className="text-caption-md-medium text-secondary">State change for items in</span>
        <StatePill stateId={parentStateId} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 vertical-scrollbar scrollbar-sm">
        <WorkflowTree parentStateId={parentStateId} typeId={typeId} />
      </div>
    </div>
  );
});
