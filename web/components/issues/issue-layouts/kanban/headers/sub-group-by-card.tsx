import React from "react";
// lucide icons
import { Circle, ChevronDown, ChevronUp } from "lucide-react";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

interface IHeaderSubGroupByCard {
  icon?: React.ReactNode;
  title: string;
  count: number;
  column_id: string;
}

export const HeaderSubGroupByCard = observer(({ icon, title, count, column_id }: IHeaderSubGroupByCard) => {
  const { issueKanBanView: issueKanBanViewStore }: RootStore = useMobxStore();

  return (
    <div className={`flex-shrink-0 relative flex gap-2 rounded-sm flex-row items-center w-full p-1.5`}>
      <div
        className="flex-shrink-0 w-[22px] h-[22px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all"
        onClick={() => issueKanBanViewStore?.handleKanBanToggle("subgroupByIssuesVisibility", column_id)}
      >
        {issueKanBanViewStore.kanBanToggle?.subgroupByIssuesVisibility.includes(column_id) ? (
          <ChevronDown width={14} strokeWidth={2} />
        ) : (
          <ChevronUp width={14} strokeWidth={2} />
        )}
      </div>

      <div className="flex-shrink-0 w-[14px] h-[14px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all">
        {icon ? icon : <Circle width={14} strokeWidth={2} />}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 text-sm">
        <div className="line-clamp-1 text-custom-text-100">{title}</div>
        <div className="pl-2 text-sm font-medium text-custom-text-300">{count || 0}</div>
      </div>
    </div>
  );
});
