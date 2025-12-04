import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IBaseLayoutsListItem, IBaseLayoutsListGroupProps } from "@plane/types";
import { cn, Row } from "@plane/ui";
import { useGroupDropTarget } from "../hooks/use-group-drop-target";
import { GroupHeader } from "./group-header";
import { BaseListItem } from "./item";

export const BaseListGroup = observer(function BaseListGroup<T extends IBaseLayoutsListItem>(
  props: IBaseLayoutsListGroupProps<T>
) {
  const {
    group,
    itemIds,
    items,
    isCollapsed,
    onToggleGroup,
    renderItem,
    renderGroupHeader,
    enableDragDrop = false,
    onDrop,
    canDrag,
    loadMoreItems: _loadMoreItems,
  } = props;

  const { t } = useTranslation();
  const { groupRef, isDraggingOver } = useGroupDropTarget({
    groupId: group.id,
    enableDragDrop,
    onDrop,
  });

  return (
    <div
      ref={groupRef}
      className={cn("relative flex flex-shrink-0 flex-col border-[1px] border-transparent", {
        "bg-layer-1": isDraggingOver,
      })}
    >
      {/* Group Header */}
      <Row className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle bg-surface-2 py-1">
        {renderGroupHeader ? (
          renderGroupHeader({ group, itemCount: itemIds.length, isCollapsed, onToggleGroup })
        ) : (
          <GroupHeader
            group={group}
            itemCount={itemIds.length}
            isCollapsed={isCollapsed}
            onToggleGroup={onToggleGroup}
          />
        )}
      </Row>

      {/* Group Items */}
      {!isCollapsed && (
        <div className="relative">
          {itemIds.map((itemId: string, index: number) => {
            const item = items[itemId];
            if (!item) return null;

            return (
              <BaseListItem
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
        </div>
      )}

      {isDraggingOver && enableDragDrop && (
        <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center text-13 font-medium text-tertiary rounded-sm bg-layer-1/85 border-[1px] border-strong z-[2]">
          <div className="p-3 my-8 flex flex-col rounded-sm items-center text-secondary">
            {t("common.drop_here_to_move")}
          </div>
        </div>
      )}
    </div>
  );
});
