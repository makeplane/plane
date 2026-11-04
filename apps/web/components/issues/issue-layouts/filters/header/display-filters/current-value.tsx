/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";

/** The current value of a display setting, shown at the end of the row that opens its submenu. */
export function DisplayFilterCurrentValue({ children }: { children: ReactNode }) {
  return <span className="truncate text-caption-md-regular text-tertiary">{children}</span>;
}
