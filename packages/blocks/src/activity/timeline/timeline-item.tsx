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
import { cn } from "@plane/utils";
import { TimelineConnectorLine } from "./timeline-connector-line";

export type TimelineItemProps = {
  icon: ReactNode;
  children: ReactNode;
  timestamp?: string;
  showConnector?: boolean;
  connectorHeight?: "sm" | "md";
  className?: string;
};
import { TimelineItemIcon } from "./timeline-item-icon";
import { TimelineTimestamp } from "./timeline-timestamp";

export function TimelineItem(props: TimelineItemProps) {
  const { icon, children, timestamp, showConnector = true, connectorHeight = "md", className } = props;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3",
        showConnector && (connectorHeight === "sm" ? "pb-2" : "pb-6"),
        className
      )}
    >
      {showConnector && <TimelineConnectorLine />}
      <TimelineItemIcon className="relative z-[4]">{icon}</TimelineItemIcon>
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center gap-1.5">{children}</div>
        {timestamp && <TimelineTimestamp timestamp={timestamp} />}
      </div>
    </div>
  );
}
