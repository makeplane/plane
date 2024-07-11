"use client";

import React from "react";
import { observer } from "mobx-react";
// ui
import { StateGroupIcon } from "@plane/ui";
// hooks
import { useIssue, useStates } from "@/hooks/store";

type Props = {
  stateId: string;
};

export const IssueListLayoutHeader: React.FC<Props> = observer((props) => {
  const { stateId } = props;

  const { getStateById } = useStates();
  const { getGroupIssueCount } = useIssue();

  const state = getStateById(stateId);

  return (
    <div className="flex sticky top-0 items-center gap-2 p-3 bg-custom-background-90 z-[1] border-b-[1px] border-custom-border-200">
      <div className="flex h-3.5 w-3.5 items-center justify-center">
        <StateGroupIcon stateGroup={state?.group ?? "backlog"} color={state?.color} height="14" width="14" />
      </div>
      <div className="mr-1 font-medium capitalize">{state?.name}</div>
      <div className="text-sm font-medium text-custom-text-200">
        {getGroupIssueCount(stateId, undefined, false) ?? 0}
      </div>
    </div>
  );
});
