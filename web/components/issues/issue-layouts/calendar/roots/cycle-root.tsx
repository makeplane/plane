import { observer } from "mobx-react-lite";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CalendarChart } from "components/issues";
// types
import { IIssueGroupedStructure } from "store/issue";

export const CycleCalendarLayout: React.FC = observer(() => {
  const { cycleIssue: cycleIssueStore, issueFilter: issueFilterStore } = useMobxStore();

  // TODO: add drag and drop functionality
  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    // issueKanBanViewStore?.handleDragDrop(result.source, result.destination);
  };

  const issues = cycleIssueStore.getIssues;

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <CalendarChart
          issues={issues as IIssueGroupedStructure | null}
          layout={issueFilterStore.userDisplayFilters.calendar?.layout}
        />
      </DragDropContext>
    </div>
  );
});
