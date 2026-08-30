/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";
import { formatCountdown } from "./helper";

type Props = {
  seconds: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

export const PomodoroCountdown = ({ seconds, size = "md", className }: Props) => (
  <span className={cn("font-semibold tracking-tight text-primary tabular-nums", SIZE_CLASSES[size], className)}>
    {formatCountdown(seconds)}
  </span>
);
