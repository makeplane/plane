/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { XPLICATION_MARK_SIZE, XPLICATION_MARK_SRC } from "./xplication-assets";

export type PlaneLogoProps = React.ComponentPropsWithoutRef<"svg">;

const { width: MARK_WIDTH, height: MARK_HEIGHT } = XPLICATION_MARK_SIZE;

/**
 * Xplication X mark. Keeps the upstream name so call sites stay unchanged; the mark
 * is drawn in its brand colors, so `color` has no effect.
 */
export function PlaneLogo({
  width = Math.round((52 * MARK_WIDTH) / MARK_HEIGHT),
  height = "52",
  className,
}: PlaneLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Xplication"
    >
      <image href={XPLICATION_MARK_SRC} width={MARK_WIDTH} height={MARK_HEIGHT} />
    </svg>
  );
}
