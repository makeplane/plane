import React from "react";
// react beautiful dnd
import { DragDropContext } from "@hello-pangea/dnd";
// mobx
import { observer } from "mobx-react-lite";
// components
import { KanBanSwimLanes } from "./swimlanes";
import { KanBan } from "./default";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IKanBanLayout {}

export const KanBanLayout: React.FC = observer(() => {
  const {
    issue: issueStore,
    issueFilter: issueFilterStore,
    issueKanBanView: issueKanBanViewStore,
  }: RootStore = useMobxStore();

  const issues = issueStore?.getIssues;

  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const currentKanBanView: "swimlanes" | "default" = issueFilterStore?.userDisplayFilters?.sub_group_by
    ? "swimlanes"
    : "default";

  const onDragEnd = (result: any) => {
    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    currentKanBanView === "default"
      ? issueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : issueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  return (
    <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90`}>
      <DragDropContext onDragEnd={onDragEnd}>
        {currentKanBanView === "default" ? (
          <KanBan issues={issues} sub_group_by={sub_group_by} group_by={group_by} />
        ) : (
          <KanBanSwimLanes issues={issues} sub_group_by={sub_group_by} group_by={group_by} />
        )}
      </DragDropContext>
    </div>
  );
});
