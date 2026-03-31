/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { EIssueServiceType } from "@plane/types";
import type { TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

const MAX_NESTING_LEVEL = 3;

type UseTimelineSubIssuesReturn = {
  enrichedBlockIds: string[];
  nestingLevelMap: Map<string, number>;
  expandedIds: Set<string>;
  toggleExpand: (issueId: string) => void;
  isExpansionEnabled: boolean;
};

/**
 * Hook that manages expand/collapse state for sub-issues in the timeline layout.
 * Returns enriched blockIds (with children inserted after expanded parents),
 * a nesting level map, and a toggle function.
 */
export const useTimelineSubIssues = (
  blockIds: string[],
  options: { isEpic?: boolean; showSubIssues?: boolean } = {}
): UseTimelineSubIssuesReturn => {
  const { isEpic = false, showSubIssues = false } = options;
  // When the "Show sub-issues" display filter is on, sub-issues already appear
  // as top-level items in the flat list — disable expand/indentation in that case.
  const isExpansionDisabled = isEpic || showSubIssues;
  const { workspaceSlug } = useParams();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const serviceType: TIssueServiceType = isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES;
  const { subIssues: subIssuesStore, issue: issueStore } = useIssueDetail(serviceType);

  const toggleExpand = useCallback(
    (issueId: string) => {
      const isCurrentlyExpanded = expandedIds.has(issueId);

      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(issueId)) next.delete(issueId);
        else next.add(issueId);
        return next;
      });

      // Fetch sub-issues on first expand (outside setState to avoid side effects in updater)
      if (!isCurrentlyExpanded) {
        const issueDetail = issueStore.getIssueById(issueId);
        if (workspaceSlug && issueDetail?.project_id) {
          void subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issueDetail.project_id, issueId);
        }
      }
    },
    [expandedIds, workspaceSlug, issueStore, subIssuesStore]
  );

  // Compute enriched blockIds and nesting level map
  // This is intentionally computed during render (not in useMemo) so that
  // MobX observables accessed here are tracked by the parent observer component
  const enrichedBlockIds: string[] = [];
  const nestingLevelMap = new Map<string, number>();

  if (isExpansionDisabled) {
    // Expansion disabled (epics or sub-issues shown as top-level) — return blockIds as-is
    for (const id of blockIds) {
      enrichedBlockIds.push(id);
      nestingLevelMap.set(id, 0);
    }
  } else {
    const insertChildren = (parentIds: string[], level: number) => {
      for (const id of parentIds) {
        enrichedBlockIds.push(id);
        nestingLevelMap.set(id, level);

        if (level < MAX_NESTING_LEVEL && expandedIds.has(id)) {
          const childIds = subIssuesStore.subIssuesByIssueId(id);
          if (childIds && childIds.length > 0) {
            insertChildren(childIds, level + 1);
          }
        }
      }
    };
    insertChildren(blockIds, 0);
  }

  return {
    enrichedBlockIds,
    nestingLevelMap,
    expandedIds,
    toggleExpand,
    isExpansionEnabled: !isExpansionDisabled,
  };
};
