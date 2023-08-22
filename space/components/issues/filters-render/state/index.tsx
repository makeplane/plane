"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { RenderIssueState } from "./filter-state-block";
// interfaces
import { IIssueState } from "store/types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const IssueStateFilter = observer(() => {
  const store: RootStore = useMobxStore();

  const clearStateFilters = () => {};

  return (
    <>
      <div className="flex items-center gap-2 border border-gray-300 px-2 py-1 pr-1 rounded">
        <div className="flex-shrink-0 font-medium">State</div>
        <div className="relative flex flex-wrap items-center gap-1">
          {store?.issue?.states &&
            store?.issue?.states.map((_state: IIssueState, _index: number) => <RenderIssueState state={_state} />)}
        </div>
        <div
          className="flex-shrink-0 w-[20px] h-[20px] cursor-pointer flex justify-center items-center overflow-hidden rounded-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-600"
          onClick={clearStateFilters}
        >
          <span className="material-symbols-rounded text-[16px]">close</span>
        </div>
      </div>
    </>
  );
});

export default IssueStateFilter;
