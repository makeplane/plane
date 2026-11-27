/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: icon of the "Decisions" feature, a fork in the road: one path taken, one left.

import type { ISvgIcons } from "@plane/blocks/icons";

export function DecisionsIcon(props: ISvgIcons) {
  const { className = "", ...rest } = props;
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M8 15V9.5L3.5 5" />
      <path d="M8 9.5L12.5 5" strokeDasharray="1.6 2" />
      <path d="M2 2.5h3.5v3.5" />
      <circle cx={12.5} cy={4} r={1.5} fill="currentColor" stroke="none" opacity={0.45} />
    </svg>
  );
}
