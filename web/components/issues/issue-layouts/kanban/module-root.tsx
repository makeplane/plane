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

export interface IModuleKanBanLayout {}

export const ModuleKanBanLayout: React.FC = observer(() => {
  const {
    moduleIssue: moduleIssueStore,
    issueFilter: issueFilterStore,
    moduleIssueKanBanView: moduleIssueKanBanViewStore,
  }: RootStore = useMobxStore();

  const issues = moduleIssueStore?.getIssues;

  const sub_group_by: string | null = issueFilterStore?.userDisplayFilters?.sub_group_by || null;

  const group_by: string | null = issueFilterStore?.userDisplayFilters?.group_by || null;

  const display_properties = issueFilterStore?.userDisplayProperties || null;

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
      ? moduleIssueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : moduleIssueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const updateIssue = (sub_group_by: string | null, group_by: string | null, issue: any) => {
    moduleIssueStore.updateIssueStructure(group_by, sub_group_by, issue);
  };

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    moduleIssueKanBanViewStore.handleKanBanToggle(toggle, value);
  };

  return (
    <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90 px-3`}>
      <DragDropContext onDragEnd={onDragEnd}>
        {currentKanBanView === "default" ? (
          <KanBan
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={updateIssue}
            display_properties={display_properties}
            kanBanToggle={moduleIssueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        ) : (
          <KanBanSwimLanes
            issues={issues}
            sub_group_by={sub_group_by}
            group_by={group_by}
            handleIssues={updateIssue}
            display_properties={display_properties}
            kanBanToggle={moduleIssueKanBanViewStore?.kanBanToggle}
            handleKanBanToggle={handleKanBanToggle}
          />
        )}
      </DragDropContext>
    </div>
  );
});
