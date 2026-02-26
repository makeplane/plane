/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { IBaseLayoutsListItem, IBaseLayoutsListProps } from "@plane/types";
import { cn } from "@plane/ui";
import { useLayoutState } from "../hooks/use-layout-state";
import { BaseListGroup } from "./group";

export const BaseListLayout = observer(function BaseListLayout<T extends IBaseLayoutsListItem>(
  props: IBaseLayoutsListProps<T>
) {
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
    className,
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
    <div ref={containerRef} className={cn("relative size-full overflow-auto bg-surface-1", className)}>
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
