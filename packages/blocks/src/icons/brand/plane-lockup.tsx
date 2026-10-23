/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import {
  XPLICATION_LOCKUP_MARK_SRC,
  XPLICATION_LOCKUP_SIZE,
  XPLICATION_LOCKUP_TEXT_MASK_SRC,
} from "./xplication-assets";

export type PlaneLockupProps = React.ComponentPropsWithoutRef<"svg">;

const { width: LOCKUP_WIDTH, height: LOCKUP_HEIGHT } = XPLICATION_LOCKUP_SIZE;

/**
 * Xplication lockup: the X mark in brand colors plus the "XPLICATION" wordmark, which
 * is filled with `color` (currentColor by default) so it follows the surrounding text
 * color in light and dark themes. Keeps the upstream name so call sites stay unchanged.
 * Left-aligned inside wider boxes, matching where the upstream lockup started.
 */
export function PlaneLockup({
  width = Math.round((53 * LOCKUP_WIDTH) / LOCKUP_HEIGHT),
  height = "53",
  className,
  color = "currentColor",
}: PlaneLockupProps) {
  const maskId = React.useId();
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${LOCKUP_WIDTH} ${LOCKUP_HEIGHT}`}
      preserveAspectRatio="xMinYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Xplication"
    >
      <mask id={maskId}>
        <image href={XPLICATION_LOCKUP_TEXT_MASK_SRC} width={LOCKUP_WIDTH} height={LOCKUP_HEIGHT} />
      </mask>
      <rect width={LOCKUP_WIDTH} height={LOCKUP_HEIGHT} fill={color} mask={`url(#${maskId})`} />
      <image href={XPLICATION_LOCKUP_MARK_SRC} width={LOCKUP_WIDTH} height={LOCKUP_HEIGHT} />
    </svg>
  );
}
