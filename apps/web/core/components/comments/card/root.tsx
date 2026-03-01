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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
// plane web imports
import { CommentBlock } from "../comment-block";
import { CommentCardDisplay } from "./display/root";
// local imports
import { CommentQuickActions } from "../quick-actions";

type TCommentCard = {
  workspaceSlug: string;
  entityId: string;
  comment: TIssueComment | undefined;
  activityOperations: TCommentsOperations;
  ends: "top" | "bottom" | undefined;
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
  enableReplies: boolean;
  disabled?: boolean;
  projectId?: string;
};

export const CommentCard = observer(function CommentCard(props: TCommentCard) {
  const {
    workspaceSlug,
    entityId,
    comment,
    activityOperations,
    ends,
    showAccessSpecifier,
    showCopyLinkOption,
    enableReplies = false,
    disabled = false,
    projectId,
  } = props;
  // states
  const [isEditing, setIsEditing] = useState(false);
  // refs
  const readOnlyEditorRef = useRef<EditorRefApi>(null);
  // derived values
  const workspaceId = comment?.workspace;

  if (!comment || !workspaceId) return null;

  return (
    <CommentBlock comment={comment} ends={ends}>
      <CommentCardDisplay
        activityOperations={activityOperations}
        entityId={entityId}
        comment={comment}
        disabled={disabled}
        projectId={projectId}
        readOnlyEditorRef={readOnlyEditorRef}
        showAccessSpecifier={showAccessSpecifier}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        renderQuickActions={() => (
          <CommentQuickActions
            activityOperations={activityOperations}
            comment={comment}
            setEditMode={() => setIsEditing(true)}
            showAccessSpecifier={showAccessSpecifier}
            showCopyLinkOption={showCopyLinkOption}
          />
        )}
        enableReplies={enableReplies}
      />
    </CommentBlock>
  );
});
