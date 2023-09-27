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

interface IIssueVisibility {
  kanban: string[];
  swimlanes: string[];
}

export const KanBanLayout: React.FC<IKanBanLayout> = observer(({}) => {
  const [issueVisiility, setIssueVisibility] = React.useState<IIssueVisibility>({
    kanban: [],
    swimlanes: [],
  });
  const handleIssueVisibility = (key: "kanban" | "swimlanes", value: string) => {
    setIssueVisibility((prevState: IIssueVisibility) => ({
      ...prevState,
      [key]: prevState[key].includes(value)
        ? prevState[key].filter((item) => item !== value)
        : [...prevState[key], value],
    }));
  };

  const {
    issue: issueStore,
    issueFilter: issueFilterStore,
    issueKanBanView: issueKanBanViewStore,
  }: RootStore = useMobxStore();
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

    currentKanBanView === "default"
      ? issueKanBanViewStore?.handleDragDrop(result.source, result.destination)
      : issueKanBanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  return (
    // <div className={`relative min-w-full w-max h-full bg-custom-background-90`}>
    <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90`}>
      <DragDropContext onDragEnd={onDragEnd}>
        {currentKanBanView === "default" ? <KanBan issues={issues} /> : <KanBanSwimLanes issues={issues} />}
      </DragDropContext>
    </div>
  );
});
