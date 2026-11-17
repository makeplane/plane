/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
import { DotSeparator } from "../utils/dot-separator";

/** Vertical rail joining consecutive timeline entries, centred under the 28px icon box. */
export function ActivityTimelineConnector() {
  return <div aria-hidden className="absolute top-0 bottom-0 left-[13px] w-px bg-layer-3" />;
}

export type ActivityTimelineIconProps = {
  children: ReactNode;
  /** Accent border, e.g. for an entry opened from a deep link. */
  highlighted?: boolean;
};

/** The raised square that carries an entry's glyph on the timeline rail. */
export function ActivityTimelineIcon(props: ActivityTimelineIconProps) {
  const { children, highlighted = false } = props;
  return (
    <div
      className={cn(
        "relative z-[4] shrink-0 rounded-lg border-[0.5px] border-subtle-1 bg-layer-2 p-1.5 text-tertiary shadow-raised-200 transition-[border-color] duration-500",
        { "border-accent-strong": highlighted }
      )}
    >
      <div className="flex size-3.5 items-center justify-center [&>svg]:size-3.5">{children}</div>
    </div>
  );
}

export type ActivityTimelineTimestampProps = {
  /** Relative time, e.g. "2 hours ago". */
  children: ReactNode;
  /** Absolute time shown on hover. */
  tooltip?: string;
  /** Skip the hover tooltip (touch devices). */
  disableTooltip?: boolean;
};

/** Dot separator followed by the entry's relative time. */
export function ActivityTimelineTimestamp(props: ActivityTimelineTimestampProps) {
  const { children, tooltip, disableTooltip = false } = props;
  const time = <span className="text-caption-sm-regular whitespace-nowrap text-tertiary">{children}</span>;

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 align-middle">
      <DotSeparator />
      {tooltip ? (
        <Tooltip label={tooltip} disabled={disableTooltip}>
          {time}
        </Tooltip>
      ) : (
        time
      )}
    </span>
  );
}

export type ActivityTimelineItemProps = {
  icon: ReactNode;
  /** Actor (`text-body-xs-medium`); rendered before the message. */
  actor?: ReactNode;
  /** The change description; inherits `text-body-xs-regular text-secondary`. */
  children: ReactNode;
  /** Usually an `ActivityTimelineTimestamp`. */
  timestamp?: ReactNode;
  /** Draw the rail down to the next entry. Turn off for the last one. */
  showConnector?: boolean;
  highlighted?: boolean;
  id?: string;
  className?: string;
};

/**
 * One activity entry: an icon box on the rail and a wrapping line of actor, message and time.
 * Entries are spaced by their own bottom padding so the rail runs unbroken between icons.
 */
export function ActivityTimelineItem(props: ActivityTimelineItemProps) {
  const { icon, actor, children, timestamp, showConnector = true, highlighted, id, className } = props;

  return (
    <div id={id} className={cn("relative flex items-start gap-3", { "pb-6": showConnector }, className)}>
      {showConnector && <ActivityTimelineConnector />}
      <ActivityTimelineIcon highlighted={highlighted}>{icon}</ActivityTimelineIcon>
      {/* pt-1 centres the first 18px line against the ~27px icon box. */}
      <div className="min-w-0 flex-1 pt-1 text-body-xs-regular break-words text-secondary">
        {actor && <span className="text-body-xs-medium text-primary">{actor}</span>} {children} {timestamp}
      </div>
    </div>
  );
}
