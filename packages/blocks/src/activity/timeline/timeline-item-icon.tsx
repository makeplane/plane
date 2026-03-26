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

export type TimelineItemIconProps = {
  children: ReactNode;
  className?: string;
};

export function TimelineItemIcon(props: TimelineItemIconProps) {
  const { children, className } = props;

  return (
    <div
      className={cn(
        "shrink-0 overflow-clip rounded-lg border-[0.5px] border-subtle-1 bg-layer-2 p-1.5 shadow-raised-200",
        className
      )}
    >
      <div className="flex size-3.5 items-center justify-center">{children}</div>
    </div>
  );
}
