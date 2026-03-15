/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { UserX } from "lucide-react";
// plane imports
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { Tooltip, cn } from "@plane/ui";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { AssigneeAvatarFilter } from "./assignee-avatar-filter";
import { useQuickFilters } from "./use-quick-filters";

type TQuickFiltersBarProps = {
  filter: IWorkItemFilterInstance | undefined;
  projectId: string;
};

const MAX_VISIBLE_MEMBERS = 20;

export const QuickFiltersBar = observer(function QuickFiltersBar(props: TQuickFiltersBarProps) {
  const { filter, projectId } = props;

  // hooks
  const {
    project: { getProjectMemberIds },
  } = useMember();
    // Get member IDs for the project
  const memberIds = useMemo(() => getProjectMemberIds(projectId, false) ?? [], [getProjectMemberIds, projectId]);

  const { hasActiveFilter, isUnassignedActive, isMemberVisible, toggleMemberVisibility, toggleUnassigned } =
    useQuickFilters(memberIds, filter);


  // Split into visible and overflow members
  const visibleMemberIds = useMemo(() => memberIds.slice(0, MAX_VISIBLE_MEMBERS), [memberIds]);
  const overflowCount = useMemo(() => Math.max(0, memberIds.length - MAX_VISIBLE_MEMBERS), [memberIds]);

  // Handler that passes all member IDs to the toggle function
  const handleToggle = useCallback(
    (memberId: string) => {
      toggleMemberVisibility(memberId, memberIds);
    },
    [toggleMemberVisibility, memberIds]
  );

  if (!filter || memberIds.length === 0) return null;

  return (
    <div className="flex items-center gap-1 border-r border-subtle pr-3 mr-1">
      {visibleMemberIds.map((memberId) => (
        <AssigneeAvatarFilter
          key={memberId}
          memberId={memberId}
          isVisible={isMemberVisible(memberId)}
          hasActiveFilter={hasActiveFilter}
          onToggle={handleToggle}
        />
      ))}
      {overflowCount > 0 && (
        <Tooltip tooltipContent={`+${overflowCount} more members`}>
          <div
            className={cn(
              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
              "bg-layer-2 text-11 font-medium text-typography-muted"
            )}
          >
            +{overflowCount}
          </div>
        </Tooltip>
      )}
      <Tooltip tooltipContent="Unassigned">
        <button
          onClick={toggleUnassigned}
          className={cn(
            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all",
            "bg-layer-2 text-typography-muted",
            // When there's an active filter, show ring on visible (selected) state
            hasActiveFilter && isUnassignedActive && "z-10 ring-2 ring-offset-1 ring-primary",
            // Visibility styles: bright when visible, dim when hidden
            isUnassignedActive ? "hover:bg-layer-3" : "opacity-40 hover:opacity-100"
          )}
        >
          <UserX className="size-3" />
        </button>
      </Tooltip>
    </div>
  );
});
