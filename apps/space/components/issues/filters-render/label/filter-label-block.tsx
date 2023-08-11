"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// interfaces
import { IIssueLabel } from "store/types/issue";
// constants
import { issueGroupFilter } from "constants/data";

export const RenderIssueLabel = observer(({ label }: { label: IIssueLabel }) => {
  const store = useMobxStore();

  const removeLabelFromFilter = () => {};

  return (
    <div
      className="flex-shrink-0 relative flex items-center flex-wrap gap-1 border px-[2px] py-0.5 rounded-full select-none"
      style={{ color: label?.color, backgroundColor: `${label?.color}10`, borderColor: `${label?.color}50` }}
    >
      <div className="flex-shrink-0 w-[20px] h-[20px] flex justify-center items-center overflow-hidden rounded-full">
        <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: `${label?.color}` }} />
      </div>
      <div className="text-sm font-medium whitespace-nowrap">{label?.name}</div>
      <div
        className="flex-shrink-0 w-[20px] h-[20px] cursor-pointer flex justify-center items-center overflow-hidden rounded-full text-gray-500 hover:bg-gray-200/60 hover:text-gray-600"
        onClick={removeLabelFromFilter}
      >
        <span className="material-symbols-rounded text-[14px]">close</span>
      </div>
    </div>
  );
});
