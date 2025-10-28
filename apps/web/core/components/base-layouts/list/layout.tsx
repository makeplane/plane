"use client";

import { observer } from "mobx-react";
import type { IBaseLayoutsListItem, IBaseLayoutsListProps } from "@plane/types";
import { useLayoutState } from "../hooks/use-layout-state";
import { BaseListGroup } from "./group";

export const BaseListLayout = observer(<T extends IBaseLayoutsListItem>(props: IBaseLayoutsListProps<T>) => {
  const {
    items,
    groupedItemIds,
    groups,
    renderItem,
    renderGroupHeader,
    enableDragDrop = false,
    onDrop,
    canDrag,
    showEmptyGroups = false,
    collapsedGroups: externalCollapsedGroups,
    onToggleGroup: externalOnToggleGroup,
    loadMoreItems,
  } = props;

  const { containerRef, collapsedGroups, onToggleGroup } = useLayoutState({
    externalCollapsedGroups,
    externalOnToggleGroup,
  });

  return (
    <div ref={containerRef} className="relative size-full overflow-auto bg-custom-background-90">
      <div className="relative size-full flex flex-col">
        {groups.map((group) => {
          const itemIds = groupedItemIds[group.id] || [];
          const isCollapsed = collapsedGroups.includes(group.id);

          if (!showEmptyGroups && itemIds.length === 0) return null;

          return (
            <BaseListGroup
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
              loadMoreItems={loadMoreItems}
            />
          );
        })}
      </div>
    </div>
  );
});
