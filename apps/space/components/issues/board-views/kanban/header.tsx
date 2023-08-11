"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// interfaces
import { IIssueState } from "store/types/issue";
// constants
import { issueGroupFilter } from "constants/data";

export const IssueListHeader = observer(({ state }: { state: IIssueState }) => {
  const store: any = useMobxStore();

  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;

  return (
    <div className="py-2 flex items-center gap-2">
      <div className="w-[28px] h-[28px] flex justify-center items-center">
        <stateGroup.icon />
      </div>
      <div className="font-medium capitalize">{stateGroup?.title}</div>
      <div className="bg-gray-200/50 text-gray-700 font-medium text-xs w-full max-w-[26px] h-[20px] flex justify-center items-center rounded-full">
        {store.issue.getCountOfIssuesByState(state.id)}
      </div>
    </div>
  );
});
