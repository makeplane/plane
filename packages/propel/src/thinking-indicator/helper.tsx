/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const thinkingIndicatorVariants = cva("inline-flex items-center", {
  variants: {
    size: {
      sm: "gap-0.5",
      base: "gap-1",
      lg: "gap-1.5",
    },
  },
  defaultVariants: { size: "base" },
});

export const thinkingDotVariants = cva("rounded-full bg-accent-primary", {
  variants: {
    size: {
      sm: "size-1",
      base: "size-1.5",
      lg: "size-2",
    },
  },
  defaultVariants: { size: "base" },
});

export type TThinkingStatus = "thinking" | "typing" | "done";
export type TThinkingSize = NonNullable<VariantProps<typeof thinkingIndicatorVariants>["size"]>;

export interface ThinkingIndicatorProps {
  status?: TThinkingStatus;
  size?: TThinkingSize;
  className?: string;
}
