/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  className?: string;
  darkerShade?: boolean;
};

export function CodeBlock({ children, className, darkerShade }: TProps) {
  return (
    <span
      className={cn(
        "rounded-md border border-subtle bg-surface-2 px-0.5 text-11 font-semibold text-tertiary",
        {
          "border-subtle bg-layer-1 text-secondary": darkerShade,
        },
        className
      )}
    >
      {children}
    </span>
  );
}
