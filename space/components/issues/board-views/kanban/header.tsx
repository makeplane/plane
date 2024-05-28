"use client";
// mobx react lite
import { observer } from "mobx-react-lite";
// ui
import { StateGroupIcon } from "@plane/ui";
// constants
import { issueGroupFilter } from "@/constants/issue";
// mobx hook
// import { useIssue } from "@/hooks/store";
// interfaces
import { IIssueState } from "@/types/issue";

export const IssueKanBanHeader = observer(({ state }: { state: IIssueState }) => {
  // const { getCountOfIssuesByState } = useIssue();
  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;

  return (
    <div className="flex items-center gap-2 px-2 pb-2">
      <div className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="14" width="14" />
      </div>
      <div className="mr-1 truncate font-semibold capitalize text-custom-text-200">{state?.name}</div>
      {/* <span className="flex-shrink-0 rounded-full text-custom-text-300">{getCountOfIssuesByState(state.id)}</span> */}
    </div>
  );
});
