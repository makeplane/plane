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

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { ACTIVITY_HIGHLIGHT_TIMEOUT } from "@plane/constants";
import { CommentReplyIcon } from "@plane/propel/icons";
import type { TIssueComment } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";

type TCommentBlock = {
  comment: TIssueComment;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
};

export const CommentBlock = observer(function CommentBlock(props: TCommentBlock) {
  const { comment, ends, children } = props;
  const commentBlockRef = useRef<HTMLDivElement>(null);
  // store hooks
  const { higlightedActivityIds, setHighlightedActivityIds } = useWorkspaceNotifications();

  useEffect(() => {
    if (higlightedActivityIds.length > 0 && higlightedActivityIds[0] === comment.id) {
      if (commentBlockRef.current) {
        commentBlockRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        // reset highlighted activity ids after 5 seconds
        setTimeout(() => {
          setHighlightedActivityIds([]);
        }, ACTIVITY_HIGHLIGHT_TIMEOUT);
      }
    }
  }, [higlightedActivityIds, comment.id, setHighlightedActivityIds]);

  if (!comment) return null;
  return (
    <div
      id={comment.id}
      className={`relative flex gap-3 ${ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`}`}
      ref={commentBlockRef}
    >
      <div
        className="absolute left-[13px] top-0 bottom-0 w-px transition-border duration-1000 bg-layer-3"
        aria-hidden
      />
      <div
        className={cn(
          "flex-shrink-0 relative w-7 h-7  rounded-lg transition-border duration-1000 flex justify-center items-center z-[3] uppercase shadow-raised-100 bg-layer-2 border border-subtle",
          higlightedActivityIds.includes(comment.id) ? "border-2 border-accent-strong" : ""
        )}
      >
        <CommentReplyIcon width={14} height={14} className="text-secondary" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-3 truncate flex-grow">
        <div className="text-body-sm-regular mb-2 bg-layer-2 border border-subtle shadow-raised-100 rounded-lg p-3">
          {children}
        </div>
      </div>
    </div>
  );
});
