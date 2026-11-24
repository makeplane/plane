/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { ChatOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";
import { ActivityTimelineConnector, ActivityTimelineIcon } from "./timeline";

export type ActivityCommentHeaderProps = {
  author: ReactNode;
  /** Verb after the author, e.g. "commented". */
  action?: ReactNode;
  /** Small glyph after the action, e.g. a public/private visibility icon. */
  visibilityIcon?: ReactNode;
  /** Usually an `ActivityTimelineTimestamp` (dot + relative time). */
  timestamp?: ReactNode;
  /** Trailing controls such as reactions and the overflow menu. */
  actions?: ReactNode;
};

/** Author line of a comment: name, verb, optional visibility glyph, time and trailing actions. */
export function ActivityCommentHeader(props: ActivityCommentHeaderProps) {
  const { author, action, visibilityIcon, timestamp, actions } = props;

  return (
    <div className="flex min-h-6 min-w-0 items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-body-xs-medium text-primary">{author}</span>
          {action && <span className="shrink-0 text-body-xs-regular whitespace-nowrap text-tertiary">{action}</span>}
          {visibilityIcon && (
            <span className="flex size-3.5 shrink-0 items-center justify-center text-tertiary">{visibilityIcon}</span>
          )}
        </div>
        {timestamp}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

export type ActivityCommentCardProps = {
  /** A 16px avatar; the body is indented past it. */
  avatar: ReactNode;
  /** Usually an `ActivityCommentHeader`. */
  header: ReactNode;
  /** The comment body (read-only editor or edit form). */
  children: ReactNode;
  /** Below the body, e.g. reactions. */
  footer?: ReactNode;
  /** Glyph in the rail's icon box; defaults to a chat bubble. */
  icon?: ReactNode;
  /** Draw the rail down to the next entry. Turn off for the last one. */
  showConnector?: boolean;
  /** Accent border on the card and icon, e.g. when opened from a deep link. */
  highlighted?: boolean;
  id?: string;
};

/**
 * A comment on the activity timeline: the rail icon on the left and a raised card holding the
 * avatar column, the author line, the body and an optional footer.
 */
export function ActivityCommentCard(props: ActivityCommentCardProps) {
  const { avatar, header, children, footer, icon, showConnector = true, highlighted = false, id } = props;

  return (
    <div id={id} className={cn("relative flex w-full items-start gap-3", { "pb-6": showConnector })}>
      {showConnector && <ActivityTimelineConnector />}
      <ActivityTimelineIcon highlighted={highlighted}>{icon ?? <ChatOutline />}</ActivityTimelineIcon>
      <div
        className={cn(
          "min-w-0 flex-1 overflow-hidden rounded-xl border border-subtle bg-layer-2 p-0.5 shadow-raised-100 transition-[border-color] duration-500",
          { "border-accent-strong": highlighted }
        )}
      >
        <div className="flex items-start gap-3 rounded-xl p-3">
          <div className="flex h-6 w-4 shrink-0 items-center justify-center [&>*]:flex">{avatar}</div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-col gap-2">
              {header}
              <div className="min-w-0 text-body-xs-regular text-primary">{children}</div>
            </div>
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
