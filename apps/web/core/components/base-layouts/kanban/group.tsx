import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IBaseLayoutsKanbanItem, IBaseLayoutsKanbanGroupProps } from "@plane/types";
import { cn } from "@plane/utils";
import { useGroupDropTarget } from "../hooks/use-group-drop-target";
import { GroupHeader } from "./group-header";
import { BaseKanbanItem } from "./item";

export const BaseKanbanGroup = observer(<T extends IBaseLayoutsKanbanItem>(props: IBaseLayoutsKanbanGroupProps<T>) => {
  const {
    group,
    itemIds,
    items,
    renderItem,
    renderGroupHeader,
    isCollapsed,
    onToggleGroup,
    enableDragDrop = false,
    onDrop,
    canDrag,
    groupClassName,
    loadMoreItems: _loadMoreItems,
  } = props;

  const { t } = useTranslation();
  const { groupRef, isDraggingOver } = useGroupDropTarget({
    groupId: group.id,
    enableDragDrop,
    onDrop,
  });

  const handleToggle = () => {
    onToggleGroup(group.id);
  };

  return (
    <div
      ref={groupRef}
      className={cn(
        "relative flex flex-shrink-0 flex-col w-[350px] border-[1px] border-transparent p-2 pt-0 max-h-full overflow-y-auto bg-custom-background-90 rounded-md",
        {
          "bg-custom-background-80": isDraggingOver,
        },
        groupClassName
      )}
    >
      {/* Group Header */}
      <div
        className="sticky top-0 z-[2] w-full flex-shrink-0 bg-custom-background-90 px-1 py-2 cursor-pointer"
        onClick={handleToggle}
      >
        {renderGroupHeader ? (
          renderGroupHeader(group, itemIds.length)
        ) : (
          <GroupHeader
            group={group}
            count={itemIds.length}
            isCollapsed={isCollapsed}
            onToggle={() => onToggleGroup(group.id)}
          />
        )}
      </div>

      {/* Group Items */}
      {!isCollapsed && (
        <div className="flex flex-col gap-2 py-2">
          {itemIds.map((itemId, index) => {
            const item = items[itemId];
            if (!item) return null;

            return (
              <BaseKanbanItem
                key={itemId}
                item={item}
                index={index}
                groupId={group.id}
                renderItem={renderItem}
                enableDragDrop={enableDragDrop}
                canDrag={canDrag}
                onDrop={onDrop}
                isLast={index === itemIds.length - 1}
              />
            );
          })}

          {itemIds.length === 0 && (
            <div className="flex items-center justify-center py-8 text-sm text-custom-text-300">
              {t("common.no_items_in_this_group")}
            </div>
          )}
        </div>
      )}

      {isDraggingOver && enableDragDrop && (
        <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center text-sm font-medium text-custom-text-300 rounded bg-custom-background-80/85 border-[1px] border-custom-border-300 z-[2]">
          <div className="p-3 my-8 flex flex-col rounded items-center text-custom-text-200">
            {t("common.drop_here_to_move")}
          </div>
        </div>
      )}
    </div>
  );
});
