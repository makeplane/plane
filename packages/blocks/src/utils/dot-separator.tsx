/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";

export type DotSeparatorProps = { className?: string };

export function DotSeparator({ className }: DotSeparatorProps) {
  return <span className={cn("size-1 shrink-0 rounded-full bg-layer-disabled", className)} aria-hidden="true" />;
}
