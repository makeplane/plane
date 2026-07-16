/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
//
import { cn } from "@plane/utils";

type TCountChip = {
  count: string | number;
} & React.HTMLAttributes<HTMLDivElement>;

export const CountChip = React.forwardRef<HTMLDivElement, TCountChip>(function CountChip(props, ref) {
  const { count, className = "", ...rest } = props;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-shrink-0 items-center justify-center rounded-xl bg-accent-primary/20 px-2.5 py-0.5 text-caption-sm-semibold text-accent-primary",
        className
      )}
      {...rest}
    >
      {count}
    </div>
  );
});
CountChip.displayName = "CountChip";
