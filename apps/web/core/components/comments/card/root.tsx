"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TIssueComment, TCommentsOperations } from "@plane/types";
// plane web imports
import { CommentBlock } from "@/plane-web/components/comments";
// local imports
import { CommentQuickActions } from "../quick-actions";
import { CommentCardDisplay } from "./display";
import { CommentCardEditForm } from "./edit-form";

type TCommentCard = {
  workspaceSlug: string;
  comment: TIssueComment | undefined;
  activityOperations: TCommentsOperations;
  ends: "top" | "bottom" | undefined;
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
  disabled?: boolean;
  projectId?: string;
};

export const CommentCard: FC<TCommentCard> = observer((props) => {
  const {
    workspaceSlug,
    comment,
    activityOperations,
    ends,
    showAccessSpecifier,
    showCopyLinkOption,
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
    <CommentBlock
      comment={comment}
      quickActions={
        !disabled && (
          <CommentQuickActions
            activityOperations={activityOperations}
            comment={comment}
            setEditMode={() => setIsEditing(true)}
            showAccessSpecifier={showAccessSpecifier}
            showCopyLinkOption={showCopyLinkOption}
          />
        )
      }
      ends={ends}
    >
      {isEditing ? (
        <CommentCardEditForm
          activityOperations={activityOperations}
          comment={comment}
          isEditing
          readOnlyEditorRef={readOnlyEditorRef.current}
          setIsEditing={setIsEditing}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      ) : (
        <CommentCardDisplay
          activityOperations={activityOperations}
          comment={comment}
          disabled={disabled}
          projectId={projectId}
          readOnlyEditorRef={readOnlyEditorRef}
          showAccessSpecifier={showAccessSpecifier}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
        />
      )}
    </CommentBlock>
  );
});
