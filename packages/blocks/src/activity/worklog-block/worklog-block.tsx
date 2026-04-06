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
import { TimelineConnectorLine } from "../timeline/timeline-connector-line";
import { TimelineItemIcon } from "../timeline/timeline-item-icon";

export type WorklogBlockProps = {
  avatar: ReactNode;
  badgeIcon?: ReactNode;
  children: ReactNode;
  actionsElement?: ReactNode;
  description?: ReactNode;
  showConnector?: boolean;
  ends?: "top" | "bottom";
  highlightRef?: Ref<HTMLDivElement>;
  highlighted?: boolean;
};

export function WorklogBlock(props: WorklogBlockProps) {
  const {
    avatar,
    badgeIcon,
    children,
    actionsElement,
    description,
    showConnector = true,
    ends,
    highlightRef,
    highlighted,
  } = props;

  return (
    <div
      ref={highlightRef}
      className={cn(
        "relative flex gap-3 text-caption-sm-regular rounded-lg border border-transparent",
        description ? "items-start" : "items-center",
        ends === "top" ? "pb-2" : ends === "bottom" ? "pt-2" : "py-2",
        highlighted && "animate-highlight-fade"
      )}
    >
      {showConnector && <TimelineConnectorLine />}
      <div className="flex-shrink-0 relative z-[4]">
        <TimelineItemIcon>{avatar}</TimelineItemIcon>
        {badgeIcon && (
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex justify-center items-center bg-layer-1 border border-subtle shadow-raised-100 z-10">
            {badgeIcon}
          </div>
        )}
      </div>
      <div className="w-full space-y-1.5">
        <div className="w-full relative flex items-center">
          <div className="flex w-full truncate gap-1 text-secondary">{children}</div>
          {actionsElement && <div className="flex-shrink-0 relative">{actionsElement}</div>}
        </div>
        {description && <div className="border border-subtle-1 whitespace-pre-line rounded-sm p-2">{description}</div>}
      </div>
    </div>
  );
}
