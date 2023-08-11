"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { RenderIssueLabel } from "./filter-label-block";
// interfaces
import { IIssueLabel } from "store/types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

const IssueLabelFilter = observer(() => {
  const store: RootStore = useMobxStore();

  const clearLabelFilters = () => {};

  return (
    <>
      <div className="flex items-center gap-2 border border-gray-300 px-2 py-1 pr-1 rounded">
        <div className="flex-shrink-0 font-medium">Labels</div>
        <div className="relative flex flex-wrap items-center gap-1">
          {store?.issue?.labels &&
            store?.issue?.labels.map((_label: IIssueLabel, _index: number) => <RenderIssueLabel label={_label} />)}
        </div>
        <div
          className="flex-shrink-0 w-[20px] h-[20px] cursor-pointer flex justify-center items-center overflow-hidden rounded-sm text-gray-500 hover:bg-gray-200/60 hover:text-gray-600"
          onClick={clearLabelFilters}
        >
          <span className="material-symbols-rounded text-[16px]">close</span>
        </div>
      </div>
    </>
  );
});

export default IssueLabelFilter;
