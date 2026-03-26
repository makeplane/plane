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

import type { Ref } from "react";
import { cn } from "@plane/utils";
import type { ActivityItemData } from "../types";
import { TimelineItem } from "../timeline/timeline-item";
import { TimelineTimestamp } from "../timeline/timeline-timestamp";

export type ActivityListItemProps = {
  data: ActivityItemData;
  ends?: "top" | "bottom";
  highlightRef?: Ref<HTMLDivElement>;
  highlighted?: boolean;
};

export function ActivityListItem(props: ActivityListItemProps) {
  const { data, ends, highlightRef, highlighted } = props;
  const { actor, timestamp, tooltipTimestamp, icon, customContent } = data;

  return (
    <div
      ref={highlightRef}
      className={cn("border border-transparent transition-border duration-1000", highlighted && "border-accent-strong")}
    >
      <TimelineItem
        icon={icon}
        showConnector={ends !== "bottom"}
        connectorHeight="md"
        className="text-caption-sm-regular"
      >
        <span className="flex gap-1.5 w-full truncate text-secondary">
          {actor}
          <span> {customContent} </span>
          {timestamp && <TimelineTimestamp timestamp={timestamp} tooltipContent={tooltipTimestamp} />}
        </span>
      </TimelineItem>
    </div>
  );
}
