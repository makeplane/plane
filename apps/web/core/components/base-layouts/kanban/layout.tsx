import { observer } from "mobx-react";
import type { IBaseLayoutsKanbanItem, IBaseLayoutsKanbanProps } from "@plane/types";
import { cn } from "@plane/utils";
import { useLayoutState } from "../hooks/use-layout-state";
import { BaseKanbanGroup } from "./group";

export const BaseKanbanLayout = observer(function BaseKanbanLayout<T extends IBaseLayoutsKanbanItem>(
  props: IBaseLayoutsKanbanProps<T>
) {
  const {
    items,
    groups,
    groupedItemIds,
    renderItem,
    renderGroupHeader,
    onDrop,
    canDrag,
    className,
    groupClassName,
    showEmptyGroups = true,
    enableDragDrop = false,
    loadMoreItems,
    collapsedGroups: externalCollapsedGroups,
    onToggleGroup: externalOnToggleGroup,
  } = props;

  const useExternalMode = externalCollapsedGroups !== undefined && externalOnToggleGroup !== undefined;
  const { containerRef, collapsedGroups, onToggleGroup } = useLayoutState(
    useExternalMode
      ? {
          mode: "external",
          externalCollapsedGroups,
          externalOnToggleGroup,
        }
      : {
          mode: "internal",
        }
  );

  return (
    <div ref={containerRef} className={cn("relative w-full flex gap-2 p-3 h-full overflow-x-auto", className)}>
      {groups.map((group) => {
        const itemIds = groupedItemIds[group.id] || [];
        const isCollapsed = collapsedGroups.includes(group.id);

        if (!showEmptyGroups && itemIds.length === 0) return null;

        return (
          <BaseKanbanGroup
            key={group.id}
            group={group}
            itemIds={itemIds}
            items={items}
            renderItem={renderItem}
            renderGroupHeader={renderGroupHeader}
            isCollapsed={isCollapsed}
            onToggleGroup={onToggleGroup}
            enableDragDrop={enableDragDrop}
            onDrop={onDrop}
            canDrag={canDrag}
            groupClassName={groupClassName}
            loadMoreItems={loadMoreItems}
          />
        );
      })}
    </div>
  );
});
