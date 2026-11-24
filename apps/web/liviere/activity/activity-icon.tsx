/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: icon of the "Activity" feature, a small heatmap.

import type { ISvgIcons } from "@plane/propel/icons";

const CELLS = [
  [0, 0, 0.35],
  [1, 0, 1],
  [2, 0, 0.6],
  [0, 1, 1],
  [1, 1, 0.35],
  [2, 1, 1],
  [0, 2, 0.6],
  [1, 2, 1],
  [2, 2, 0.35],
];

export function ActivityIcon(props: ISvgIcons) {
  // `percentage` belongs to progress icons only and is not an SVG attribute
  const { className = "", percentage: _percentage, ...rest } = props;
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true" {...rest}>
      {CELLS.map(([x, y, opacity]) => (
        <rect key={`${x}-${y}`} x={1 + x * 5} y={1 + y * 5} width={4} height={4} rx={1} opacity={opacity} />
      ))}
    </svg>
  );
}
