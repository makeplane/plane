/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import type { TChecklistOperations } from "../../issue-detail-widgets/checklist/helper";
import { computeChecklistItemSortOrder } from "./checklist-order";
import { ChecklistAddItem } from "./checklist-add-item";
import { ChecklistItem } from "./checklist-item";

type Props = {
  issueId: string;
  checklistOperations: TChecklistOperations;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

const EMPTY_CHECKLIST_ITEM_IDS: string[] = [];

export const ChecklistList = observer(function ChecklistList(props: Props) {
  const { issueId, checklistOperations, disabled = false, issueServiceType } = props;
  // hooks
  const {
    checklist: { getChecklistItemIdsByIssueId, getChecklistItemById },
  } = useIssueDetail(issueServiceType);

  const checklistItemIds = getChecklistItemIdsByIssueId(issueId) ?? EMPTY_CHECKLIST_ITEM_IDS;
  const isDraggable = checklistItemIds.length > 1;

  const handleReorder = useCallback(
    (sourceId: string, targetId: string, edge: "top" | "bottom") => {
      if (sourceId === targetId) return;
      const orderedItems = checklistItemIds
        .map((id) => getChecklistItemById(id))
        .filter((item): item is NonNullable<typeof item> => !!item);
      const sortOrder = computeChecklistItemSortOrder(orderedItems, targetId, edge);
      checklistOperations.reorder(sourceId, sortOrder);
    },
    [checklistItemIds, getChecklistItemById, checklistOperations]
  );

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {checklistItemIds.map((checklistItemId) => (
        <ChecklistItem
          key={checklistItemId}
          checklistItemId={checklistItemId}
          isDraggable={isDraggable}
          checklistOperations={checklistOperations}
          onReorder={handleReorder}
          disabled={disabled}
          issueServiceType={issueServiceType}
        />
      ))}
      <ChecklistAddItem
        issueId={issueId}
        checklistOperations={checklistOperations}
        disabled={disabled}
        issueServiceType={issueServiceType}
      />
    </div>
  );
});
