import React from "react";
// lucide icons
import { Plus, Minimize2, Maximize2, Circle } from "lucide-react";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

interface IHeaderGroupByCard {
  sub_group_by: string | null;
  group_by: string | null;
  column_id: string;
  icon?: React.ReactNode;
  title: string;
  count: number;
}

export const HeaderGroupByCard = observer(
  ({ sub_group_by, group_by, column_id, icon, title, count }: IHeaderGroupByCard) => {
    const { issueKanBanView: issueKanBanViewStore }: RootStore = useMobxStore();

    const verticalAlignPosition = issueKanBanViewStore.kanBanToggle?.groupByHeaderMinMax.includes(column_id);

    return (
      <div
        className={`flex-shrink-0 relative flex gap-2 p-1.5 ${
          verticalAlignPosition ? `flex-col items-center w-[44px]` : `flex-row items-center w-full`
        }`}
      >
        <div className="flex-shrink-0 w-[22px] h-[22px] rounded-sm overflow-hidden flex justify-center items-center">
          {icon ? icon : <Circle width={14} strokeWidth={2} />}
        </div>

        <div className={`flex items-center gap-1 ${verticalAlignPosition ? `flex-col` : `flex-row w-full`}`}>
          <div className={`font-medium line-clamp-1 ${verticalAlignPosition ? `vertical-lr` : ``}`}>{title}</div>
          <div className={verticalAlignPosition ? `` : `pl-2`}>{count || 0}</div>
        </div>

        {sub_group_by === null && (
          <div
            className="flex-shrink-0 w-[22px] h-[22px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all"
            onClick={() => issueKanBanViewStore?.handleKanBanToggle("groupByHeaderMinMax", column_id)}
          >
            {verticalAlignPosition ? (
              <Maximize2 width={14} strokeWidth={2} />
            ) : (
              <Minimize2 width={14} strokeWidth={2} />
            )}
          </div>
        )}

        {/* <div className="flex-shrink-0 w-[22px] h-[22px] rounded-sm overflow-hidden flex justify-center items-center hover:bg-custom-background-80 cursor-pointer transition-all">
          <Plus width={14} strokeWidth={2} />
        </div> */}
      </div>
    );
  }
);
