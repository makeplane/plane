"use client";
import { observer } from "mobx-react-lite";
// ui
import { StateGroupIcon } from "@plane/ui";
// constants
import { issueGroupFilter } from "@/constants/issue";
// mobx hook
// import { useIssue } from "@/hooks/store";
// types
import { IIssueState } from "@/types/issue";

export const IssueListHeader = observer(({ state }: { state: IIssueState }) => {
  // const { getCountOfIssuesByState } = useIssue();
  const stateGroup = issueGroupFilter(state.group);
  // const count = getCountOfIssuesByState(state.id);

  if (stateGroup === null) return <></>;

  return (
    <div className="flex items-center gap-2 p-3">
      <div className="flex h-3.5 w-3.5 items-center justify-center">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="14" width="14" />
      </div>
      <div className="mr-1 font-medium capitalize">{state?.name}</div>
      {/* <div className="text-sm font-medium text-custom-text-200">{count}</div> */}
    </div>
  );
});
