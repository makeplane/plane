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

import type { IWorkspaceCommentEnhancedSearchResult } from "@plane/constants";
import { Avatar } from "@plane/ui";
import { getFileURL, sanitizeHTML } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";

export function CommentItem({ comment }: { comment: IWorkspaceCommentEnhancedSearchResult }) {
  const { getUserDetails } = useMember();
  const userDetails = getUserDetails(comment.actor_id);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex gap-2 items-center truncate">
          <span className="text-secondary font-semibold">{userDetails?.display_name}</span>
          <span>commented on</span>
          <div className="flex gap-2 truncate">
            <IssueIdentifier
              projectIdentifier={comment.project_identifier}
              projectId={comment.project_id}
              issueTypeId={comment.issue_type_id}
              issueSequenceId={comment.issue_sequence_id}
              size="xs"
            />
            <span className="text-secondary truncate">{comment.issue_name}</span>
          </div>
        </div>
      </div>
      <div className="text-secondary border-l border-strong-1 pl-2">{sanitizeHTML(comment.comment)}</div>
    </div>
  );
}

export function ActorAvatar({ actorId, size = "sm" }: { actorId: string; size?: "sm" | "md" | "lg" }) {
  const { getUserDetails } = useMember();
  const userDetails = getUserDetails(actorId);
  return (
    <div className="pt-1">
      <Avatar
        src={userDetails?.avatar_url ? getFileURL(userDetails?.avatar_url) : ""}
        name={userDetails?.display_name}
        size={size}
      />
    </div>
  );
}
