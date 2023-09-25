import React from "react";
// react beautiful dnd
import { DragDropContext } from "@hello-pangea/dnd";
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
  handleDragDrop?: (result: any) => void;
}

export const KanBanLayout: React.FC<IKanBanLayout> = observer(({}) => {
  const { issue: issueStore, issueFilter: issueFilterStore }: RootStore = useMobxStore();
  const currentKanBanView: "swimlanes" | "default" = issueFilterStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  const issues = issueStore?.getIssues;

  const onDragEnd = (result: any) => {
    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    console.log("result", result);
    // issueKanBanViewStore?.handleDragDrop(result.source, result.destination);
  };

  return (
    <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90`}>
      <DragDropContext onDragEnd={onDragEnd}>
        {currentKanBanView === "default" ? <KanBan issues={issues} /> : <KanBanSwimLanes issues={issues} />}
      </DragDropContext>
    </div>
  );
});
