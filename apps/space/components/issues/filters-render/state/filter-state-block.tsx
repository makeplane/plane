"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// interfaces
import { IIssueState } from "store/types/issue";
// constants
import { issueGroupFilter } from "constants/data";

export const RenderIssueState = observer(({ state }: { state: IIssueState }) => {
  const store = useMobxStore();

  const stateGroup = issueGroupFilter(state.group);

  const removeStateFromFilter = () => {};

  if (stateGroup === null) return <></>;
  return (
    <div
      className={`flex-shrink-0 relative flex items-center flex-wrap gap-1 border px-[2px] py-0.5 rounded-full select-none ${
        stateGroup.className || ``
      }`}
    >
      <div className="flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center overflow-hidden rounded-full">
        <stateGroup.icon />
      </div>
      <div className="text-sm font-medium whitespace-nowrap">{state?.name}</div>
      <div
        className="flex-shrink-0 w-[20px] h-[20px] cursor-pointer flex justify-center items-center overflow-hidden rounded-full text-gray-500 hover:bg-gray-200/60 hover:text-gray-600"
        onClick={removeStateFromFilter}
      >
        <span className="material-symbols-rounded text-[14px]">close</span>
      </div>
    </div>
  );
});
