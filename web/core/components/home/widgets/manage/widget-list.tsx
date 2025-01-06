import {
  DragLocationHistory,
  DropTargetRecord,
  ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { useHome } from "@/hooks/store/use-home";
import { WidgetItem } from "./widget-item";
import { getInstructionFromPayload, TargetData } from "./widget.helpers";

// TODO: Replace with api data
const widgets = [
  { key: "1", name: "quick links", is_enabled: true, sort_order: 1 },
  { key: "2", name: "recents", is_enabled: true, sort_order: 2 },
  { key: "3", name: "stickies", is_enabled: true, sort_order: 3 },
];
export const WidgetList = ({ workspaceSlug }: { workspaceSlug: string }) => {
  const { reorderWidget, toggleWidget } = useHome();

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
      {widgets.map((widget, index) => (
        <WidgetItem
          key={widget.key}
          widget={widget}
          isLastChild={index === widgets.length - 1}
          handleDrop={handleDrop}
          handleToggle={toggleWidget}
        />
      ))}
    </div>
  );
};
