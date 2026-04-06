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

import { cn } from "@plane/utils";
import { Tooltip } from "@plane/propel/tooltip";
import { DotSeparator } from "../../utils/dot-separator";

export type TimelineTimestampProps = {
  timestamp: string;
  tooltipContent?: string;
  isMobile?: boolean;
  className?: string;
};

export function TimelineTimestamp(props: TimelineTimestampProps) {
  const { timestamp, tooltipContent, isMobile, className } = props;

  const timestampText = <span className="text-caption-sm-regular text-tertiary whitespace-nowrap">{timestamp}</span>;

  return (
    <span className={cn("flex shrink-0 items-center gap-1.5 text-caption-sm-regular text-tertiary", className)}>
      <DotSeparator />
      {tooltipContent ? (
        <Tooltip tooltipContent={tooltipContent} isMobile={isMobile}>
          {timestampText}
        </Tooltip>
      ) : (
        timestampText
      )}
    </span>
  );
}
