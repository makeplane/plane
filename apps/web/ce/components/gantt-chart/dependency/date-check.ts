/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IGanttBlock } from "@plane/types";

/**
 * Schedule-consistency check for a precedence edge.
 *
 * Given the canonical "source blocks target" direction, a conflict exists when
 * `source.target_date > target.start_date` — i.e. the predecessor is
 * scheduled to finish after its successor has already started. The relation
 * is still creatable; this only drives the visual warning.
 *
 * Returns `false` when either endpoint is missing a date, because the handle
 * is only offered on fully-dated blocks but the target's dates may be
 * optimistic (in flight) or cleared elsewhere.
 */
export function hasBlockingDateConflict(source: IGanttBlock, target: IGanttBlock): boolean {
  const sourceEnd = source.target_date;
  const targetStart = target.start_date;
  if (!sourceEnd || !targetStart) return false;
  // ISO-8601 / YYYY-MM-DD strings compare lexicographically, but parse to Date
  // to cover the full ISO datetime shape the API occasionally returns.
  return new Date(sourceEnd).getTime() > new Date(targetStart).getTime();
}
