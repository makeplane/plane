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

import { observer } from "mobx-react";
// plane imports
import type { TCommentsOperations } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { ReplyCard } from "./reply-card";
import { Button } from "@plane/propel/button";

type TRepliesList = {
  workspaceSlug: string;
  projectId: string;
  entityId: string;
  commentId: string;
  activityOperations: TCommentsOperations;
  showAccessSpecifier: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
};

export const RepliesList = observer(function RepliesList(props: TRepliesList) {
  const { workspaceSlug, projectId, entityId, commentId, activityOperations, showAccessSpecifier, setIsExpanded } =
    props;
  // store hooks
  const { comment } = useIssueDetail();
  const repliesStore = comment.replies;
  // derived values
  const replyIds = repliesStore?.getReplyIdsByCommentId(commentId);
  const commentMap = repliesStore?.repliesMap.get(commentId);

  if (!replyIds || replyIds.length === 0 || !commentMap) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {replyIds.map((replyId) => (
        <ReplyCard
          key={replyId}
          workspaceSlug={workspaceSlug}
          entityId={entityId}
          getReply={() => commentMap.get(replyId)}
          activityOperations={activityOperations}
          showAccessSpecifier={showAccessSpecifier}
          projectId={projectId}
        />
      ))}
      <div className="relative ml-2 pl-4 pt-1">
        <div className="absolute left-0 top-0 h-4 w-3 border-l border-b rounded-bl-full border-subtle-1" />
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
          Show less
        </Button>
      </div>
    </div>
  );
});
