import React from "react";
// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { KanBanSwimLanes } from "./swimlanes";
import { KanBan } from "./default";

export interface IKanBanLayout {
  issues?: any;
  handleIssues?: () => void;
  handleDragDrop?: () => void;
}

export const KanBanLayout: React.FC<IKanBanLayout> = observer(({}) => {
  const { issueFilter: issueFilterStore }: RootStore = useMobxStore();
  const currentKanBanView: "swimlanes" | "default" = issueFilterStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  return (
    <div className="relative w-full h-full bg-custom-background-90">
      {currentKanBanView === "default" ? <KanBan /> : <KanBanSwimLanes />}
    </div>
  );
});
