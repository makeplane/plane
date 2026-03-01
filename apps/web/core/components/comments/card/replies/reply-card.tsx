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

import { useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TCommentsOperations, TIssueComment } from "@plane/types";
// hooks
import { useUser } from "@/hooks/store/user";
// plane web imports
import { CommentCardDisplay } from "@/components/comments/card/display/root";
// local imports
import { ReplyQuickActions } from "./reply-quick-actions";

type Props = {
  workspaceSlug: string;
  entityId: string;
  getReply: () => TIssueComment | undefined;
  activityOperations: TCommentsOperations;
  showAccessSpecifier: boolean;
  projectId?: string;
};

export const ReplyCard = observer(function ReplyCard(props: Props) {
  const { workspaceSlug, entityId, getReply, activityOperations, showAccessSpecifier, projectId } = props;
  // states
  const [isEditing, setIsEditing] = useState(false);
  // refs
  const readOnlyEditorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const reply = getReply();

  // Create wrapper operations that route updateComment to updateReply for replies
  const replyActivityOperations: TCommentsOperations = useMemo(
    () => ({
      ...activityOperations,
      updateComment: async (commentId: string, data: Partial<TIssueComment>) => {
        // Route to reply update operation
        if (activityOperations.replyOperations?.updateReply) {
          await activityOperations.replyOperations.updateReply(commentId, data);
        }
      },
    }),
    [activityOperations]
  );

  if (!reply) return null;

  return (
    <CommentCardDisplay
      activityOperations={replyActivityOperations}
      entityId={entityId}
      comment={reply}
      disabled={false}
      projectId={projectId}
      readOnlyEditorRef={readOnlyEditorRef}
      showAccessSpecifier={showAccessSpecifier}
      workspaceSlug={workspaceSlug}
      workspaceId={reply.workspace}
      enableReplies={false}
      isReply
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      renderQuickActions={() => {
        if (!activityOperations.replyOperations || reply.actor !== currentUser?.id) return null;
        return (
          <ReplyQuickActions
            handleDelete={async () => {
              await activityOperations.replyOperations?.deleteReply(reply.id);
            }}
            reply={reply}
            setEditMode={() => setIsEditing(true)}
          />
        );
      }}
    />
  );
});
