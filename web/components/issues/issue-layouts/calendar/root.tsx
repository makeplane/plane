import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// components
import { CalendarChart } from "components/issues";

type Props = {};

export const CalendarLayout: React.FC<Props> = (props) => {
  const {} = props;

  const onDragEnd = (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    // issueKanBanViewStore?.handleDragDrop(result.source, result.destination);
  };

  return (
    <div className="h-full w-full pt-4 bg-custom-background-100 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <CalendarChart />
      </DragDropContext>
    </div>
  );
};
