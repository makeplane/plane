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

import * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "../utils";

interface SeparatorProps extends React.ComponentProps<typeof SeparatorPrimitive> {
  /**
   * The orientation of the separator
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

const Separator = React.forwardRef(function Separator(
  { orientation = "horizontal", className, ...props }: SeparatorProps,
  ref: React.ForwardedRef<React.ElementRef<typeof SeparatorPrimitive>>
) {
  return (
    <SeparatorPrimitive
      ref={ref}
      orientation={orientation}
      data-slot="separator"
      data-orientation={orientation}
      {...props}
      className={cn("bg-subtle-1", "shrink-0", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
    />
  );
});

Separator.displayName = "Separator";

export { Separator };
export type { SeparatorProps };
