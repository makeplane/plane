import React from "react";

// mobx
import { observer } from "mobx-react-lite";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { KanBanSwimLanes } from "./swinlanes";
import { KanBan } from "./default";

export interface IKanBanLayout {
  issues?: any;
  handleIssues?: () => void;
  handleDragDrop?: () => void;
}

export const KanBanLayout: React.FC<IKanBanLayout> = observer(({}) => {
  const { issue: issueStore }: RootStore = useMobxStore();

  console.log("---");
  console.log("issues", issueStore?.getIssues);
  console.log("---");

  return (
    <div className="border border-red-500 relative w-full h-full overflow-hidden">
      {"swinlanes" === "swinlanes" ? <KanBanSwimLanes /> : <KanBan />}
    </div>
  );
});
