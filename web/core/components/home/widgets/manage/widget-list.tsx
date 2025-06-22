import {
  DragLocationHistory,
  DropTargetRecord,
  ElementDragPayload,
} from "@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { useHome } from "@/hooks/store/use-home";
import { WidgetItem } from "./widget-item";
import { getInstructionFromPayload, TargetData } from "./widget.helpers";

export const WidgetList = observer(({ workspaceSlug }: { workspaceSlug: string }) => {
  const { orderedWidgets, reorderWidget, toggleWidget } = useHome();
  const { t } = useTranslation();

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
      reorderWidget(workspaceSlug, sourceData.id, droppedId, instruction)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("home.widget.reordered_successfully"),
          });
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("home.widget.reordering_failed"),
          });
        });
    }
  };

  return (
    <div className="my-4">
      {orderedWidgets.map((widget, index) => (
        <WidgetItem
          key={widget}
          widgetId={widget}
          isLastChild={index === orderedWidgets.length - 1}
          handleDrop={handleDrop}
          handleToggle={toggleWidget}
        />
      ))}
    </div>
  );
});
