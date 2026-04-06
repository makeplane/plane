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

import type { ReactNode, Ref } from "react";
import { cn } from "@plane/utils";
import { CommentFillIcon } from "@plane/propel/icons";
import type { ReactionChip, ThreadSummary, CommentSource } from "../types";
import { TimelineConnectorLine } from "../timeline/timeline-connector-line";
import { TimelineItemIcon } from "../timeline/timeline-item-icon";
import { CommentSourceHeader } from "./comment-source-header";
import { CommentHeader } from "./comment-header";
import { CommentActions } from "./comment-actions";
import { CommentThreadSummary } from "./comment-thread-summary";

export type CommentBlockProps = {
  avatar: ReactNode;
  authorName: string;
  action?: string;
  timestamp: string;
  visibilityIcon?: ReactNode;
  body: ReactNode;
  reactions?: ReactionChip[];
  onReply?: () => void;
  onAddReaction?: () => void;
  threadSummary?: ThreadSummary;
  source?: CommentSource;
  showConnector?: boolean;
  isEdited?: boolean;
  headerActionsElement?: ReactNode;
  footerElement?: ReactNode;
  highlightRef?: Ref<HTMLDivElement>;
  highlighted?: boolean;
};

export function CommentBlock(props: CommentBlockProps) {
  const {
    avatar,
    authorName,
    action = "commented",
    timestamp,
    visibilityIcon,
    body,
    reactions,
    onReply,
    onAddReaction,
    threadSummary,
    source,
    showConnector = true,
    isEdited,
    headerActionsElement,
    footerElement,
    highlightRef,
    highlighted,
  } = props;

  return (
    <div
      ref={highlightRef}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-lg border border-transparent",
        showConnector && "pb-6",
        highlighted && "animate-highlight-fade"
      )}
    >
      {/* Continuous connector line behind icon and card */}
      {showConnector && <TimelineConnectorLine />}

      {/* Left column: icon */}
      <div className="shrink-0 relative z-[4]">
        <TimelineItemIcon>
          <CommentFillIcon className="size-3.5 text-tertiary" />
        </TimelineItemIcon>
      </div>

      {/* Right column: card */}
      <div className="flex-1 overflow-hidden rounded-xl border border-subtle bg-layer-2 p-0.5 shadow-raised-100">
        {/* Source header (e.g., Slack) */}
        {source && <CommentSourceHeader source={source} timestamp={timestamp} />}

        {/* Comment content */}
        <div className={cn("rounded-xl px-3 pt-3", !source && !threadSummary && "pb-3")}>
          <div className="flex items-start gap-3">
            <div className="flex size-4 shrink-0 items-center justify-center overflow-clip rounded-full">{avatar}</div>
            <div className="flex flex-1 flex-col gap-3">
              {/* Header + Body group (gap-2 = 8px) */}
              <div className="flex flex-col gap-2">
                <CommentHeader
                  authorName={authorName}
                  action={action}
                  timestamp={source ? "" : timestamp}
                  visibilityIcon={visibilityIcon}
                  isEdited={isEdited}
                  actionsElement={headerActionsElement}
                />
                <div className="text-body-xs-regular text-primary">{body}</div>
              </div>
              {/* Actions (separated by gap-3 = 12px from header+body group) */}
              {(onReply || reactions?.length || onAddReaction) && (
                <CommentActions onReply={onReply} reactions={reactions} onAddReaction={onAddReaction} />
              )}
              {/* Footer element */}
              {footerElement && <div>{footerElement}</div>}
            </div>
          </div>
        </div>

        {/* Thread summary with connector */}
        {threadSummary && (
          <>
            <div className="px-3">
              <div className="flex h-5 w-4 justify-center">
                <div className="h-full w-px bg-layer-3" />
              </div>
            </div>
            <CommentThreadSummary summary={threadSummary} />
          </>
        )}
      </div>
    </div>
  );
}
