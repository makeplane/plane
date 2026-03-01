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

import type { KeyedMutator } from "swr";
// plane imports
import type { TIssue, TIssueActivity, TIssueComment, TIssueRelation, TIssueSubIssues } from "@plane/types";
// local imports
import { useSocketEvent } from "./root";

type TUseWorkItemDetailRevalidationProps = {
  workItemId: string | undefined;
  entityType: "workitem" | "epic";
  mutateFn: {
    detail: KeyedMutator<TIssue>;
    comments: KeyedMutator<TIssueComment[]>;
    commentReplies: ((commentId: string) => Promise<void>) | undefined;
    relations: KeyedMutator<TIssueRelation>;
    subWorkItems: KeyedMutator<TIssueSubIssues>;
    activity: KeyedMutator<TIssueActivity[]>;
  };
};

export const useWorkItemDetailRevalidation = ({
  workItemId,
  entityType,
  mutateFn,
}: TUseWorkItemDetailRevalidationProps) =>
  useSocketEvent("work-item:updated", (data) => {
    // Guard clauses
    if (!workItemId || !data.entity_id) return;
    if (!data.event_type?.startsWith(entityType + ".")) return;
    if (data.entity_id !== workItemId) return;

    // Revalidate detail for main entity changes
    if (
      [
        `${entityType}.created`,
        `${entityType}.updated`,
        `${entityType}.deleted`,
        `${entityType}.state.updated`,
        `${entityType}.assignee.added`,
        `${entityType}.assignee.removed`,
        `${entityType}.module.added`,
        `${entityType}.module.removed`,
        `${entityType}.label.added`,
        `${entityType}.label.removed`,
        `${entityType}.cycle.added`,
        `${entityType}.cycle.removed`,
        `${entityType}.link.added`,
        `${entityType}.link.updated`,
        `${entityType}.link.removed`,
      ].includes(data.event_type)
    ) {
      void mutateFn.detail();
    }

    // Revalidate comments for comment events
    if (data.event_type?.startsWith(`${entityType}.comment.`)) {
      const parentCommentId =
        data.payload?.data && "comment" in data.payload.data ? data.payload.data.comment?.parent_id : undefined;
      // It's a comment reply if there is a parent comment id
      if (parentCommentId) {
        void mutateFn.commentReplies?.(parentCommentId);
      }
      // Always revalidate comments to update reply counts and comment list
      void mutateFn.comments();
    }

    // Revalidate relations for relation events
    if (data.event_type?.startsWith(`${entityType}.relation.`)) {
      void mutateFn.relations();
    }

    // TODO: (TEMP) Update this once sub work item events are implemented
    void mutateFn.subWorkItems();

    // Always revalidate activity
    void mutateFn.activity();
  });
