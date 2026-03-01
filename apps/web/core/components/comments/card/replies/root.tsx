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

import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { uniq } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { Button } from "@plane/propel/button";
import type { TCommentsOperations } from "@plane/types";
import { Avatar, AvatarGroup } from "@plane/ui";
import { calculateTimeAgo, cn, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { RepliesList } from "./replies-list";
import { ReplyCreate } from "./reply-create";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  entityId: string;
  activityOperations: TCommentsOperations;
  commentId: string;
  repliesCount: number;
  repliedUserIds: string[];
  lastReplyAt: string | null;
  showAccessSpecifier: boolean;
};

export type CommentRepliesRootHandle = {
  showReplyEditor: () => void;
};

export const CommentRepliesRoot = observer(
  forwardRef<CommentRepliesRootHandle, Props>(function CommentRepliesRoot(props, ref) {
    const {
      editorRef,
      workspaceSlug,
      projectId,
      entityId,
      activityOperations,
      commentId,
      repliesCount,
      repliedUserIds,
      lastReplyAt,
      showAccessSpecifier,
    } = props;
    // states
    const [isExpanded, setIsExpanded] = useState(false);
    // store hooks
    const { getUserDetails } = useMember();
    // Expose method to show editor - expands and shows editor
    useImperativeHandle(ref, () => ({
      showReplyEditor: () => {
        if (!isExpanded) {
          setIsExpanded(true);
        }
        editorRef.current?.focus("end");
      },
    }));
    // Fetch replies when expanded and has replies
    useEffect(() => {
      if (isExpanded && repliesCount > 0) {
        activityOperations.replyOperations?.fetchReplies(commentId).catch((error) => {
          console.error("Failed to fetch replies:", error);
        });
      }
    }, [isExpanded, repliesCount, commentId, activityOperations.replyOperations]);

    return (
      <div className="flex flex-col">
        {repliesCount > 0 && (
          <>
            {!isExpanded && (
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)} className="relative ml-2 w-fit">
                <div className="flex items-center gap-2 text-caption-sm-medium">
                  {repliedUserIds.length > 0 && (
                    <AvatarGroup size="sm" max={2} showTooltip={false}>
                      {uniq(repliedUserIds).map((userId) => {
                        const userDetails = getUserDetails(userId);
                        if (!userDetails) return null;
                        return (
                          <Avatar
                            key={userId}
                            name={userDetails.display_name}
                            src={userDetails.avatar_url ? getFileURL(userDetails.avatar_url) : undefined}
                          />
                        );
                      })}
                    </AvatarGroup>
                  )}
                  <span>
                    {repliesCount} {repliesCount === 1 ? "reply" : "replies"}
                  </span>
                  <div className="size-1 rounded-full bg-layer-1-active" />
                  {lastReplyAt && (
                    <div className="flex gap-1">
                      <span className="text-placeholder">Last reply</span>
                      <span className="text-placeholder">{calculateTimeAgo(lastReplyAt)}</span>
                    </div>
                  )}
                  <div className="absolute left-0 top-0 h-4 w-2 border-l border-b rounded-bl-full border-subtle-1" />
                </div>
              </Button>
            )}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <RepliesList
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  entityId={entityId}
                  commentId={commentId}
                  activityOperations={activityOperations}
                  showAccessSpecifier={showAccessSpecifier}
                  setIsExpanded={setIsExpanded}
                />
              </div>
            </div>
          </>
        )}
        {
          <div
            className={cn({
              hidden: !isExpanded,
            })}
          >
            <ReplyCreate
              editorRef={editorRef}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              entityId={entityId}
              commentId={commentId}
              activityOperations={activityOperations}
            />
          </div>
        }
      </div>
    );
  })
);
