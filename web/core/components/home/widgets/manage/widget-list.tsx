import {
  DragLocationHistory,
  DropTargetRecord,
  ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { useHome } from "@/hooks/store/use-home";
import { WidgetItem } from "./widget-item";
import { getInstructionFromPayload, TargetData } from "./widget.helpers";

const WIDGETS_LIST = [
  { id: 1, title: "quick links" },
  { id: 2, title: "recents" },
  { id: 3, title: "stickies" },
];
export const WidgetList = ({ workspaceSlug }: { workspaceSlug: string }) => {
  const { reorderWidget } = useHome();

  const handleDrop = (self: DropTargetRecord, source: ElementDragPayload, location: DragLocationHistory) => {
    const dropTargets = location?.current?.dropTargets ?? [];
    if (!dropTargets || dropTargets.length <= 0) return;
    const dropTarget =
      dropTargets.length > 1 ? dropTargets.find((target: DropTargetRecord) => target?.data?.isChild) : dropTargets[0];

    const dropTargetData = dropTarget?.data as TargetData;

    if (!dropTarget || !dropTargetData) return;
    const instruction = getInstructionFromPayload(dropTarget, source, location);
    const droppedId = dropTargetData.id;
    const sourceData = source.data as TargetData;

    if (!sourceData.id) return;
    if (droppedId) {
      reorderWidget(workspaceSlug, sourceData.id, droppedId, instruction); /** sequence */
    }
  };

  return (
    <div className="my-4">
      {WIDGETS_LIST.map((widget, index) => (
        <WidgetItem
          key={widget.id}
          widget={widget}
          isLastChild={index === WIDGETS_LIST.length - 1}
          handleDrop={handleDrop}
        />
      ))}
    </div>
  );
};
