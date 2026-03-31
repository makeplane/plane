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
import { useEntityEvent } from "./root";

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
    stateDuration: KeyedMutator<void>;
  };
};

export const useWorkItemDetailRevalidation = ({
  workItemId,
  entityType,
  mutateFn,
}: TUseWorkItemDetailRevalidationProps) =>
  useEntityEvent(entityType, workItemId, (data) => {
    const isCommentEvent = data.event_type.includes(".comment.");
    const isRelationEvent = data.event_type.includes(".relation.");

    // Revalidate detail for direct entity changes (not comments or relations)
    if (!isCommentEvent && !isRelationEvent) {
      void mutateFn.detail();
    }

    // Revalidate comments for comment events
    if (isCommentEvent) {
      if (data.parent_comment_id) {
        void mutateFn.commentReplies?.(data.parent_comment_id);
      }
      void mutateFn.comments();
    }

    // Revalidate relations for relation events
    if (isRelationEvent) {
      void mutateFn.relations();
    }

    // TODO: Update this once sub work item events are implemented
    void mutateFn.subWorkItems();

    // Always revalidate activity and state duration
    void mutateFn.activity();
    void mutateFn.stateDuration();
  });
