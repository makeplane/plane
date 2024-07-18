"use client";

import { observer } from "mobx-react";
// ui
import { StateGroupIcon } from "@plane/ui";
// hooks
import { useIssue, useStates } from "@/hooks/store";

type Props = {
  stateId: string;
};

export const IssueKanBanHeader: React.FC<Props> = observer((props) => {
  const { stateId } = props;

  const { getStateById } = useStates();
  const { getGroupIssueCount } = useIssue();

  const state = getStateById(stateId);

  return (
    <div className="flex items-center gap-2 px-2 pb-2">
      <div className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
        <StateGroupIcon stateGroup={state?.group ?? "backlog"} color={state?.color} height="14" width="14" />
      </div>
      <div className="mr-1 truncate font-medium capitalize text-custom-text-200">{state?.name ?? "State"}</div>
      <span className="flex-shrink-0 rounded-full text-custom-text-300">
        {getGroupIssueCount(stateId, undefined, false) ?? 0}
      </span>
    </div>
  );
});
