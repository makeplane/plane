/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader } from "@plane/ui";

/** Skeleton rows for tables and lists. */
export function TimeTrackingRowsLoader({ rows = 6 }: { rows?: number }) {
  return (
    <Loader className="flex w-full flex-col gap-2 p-1">
      {Array.from({ length: rows }, (_, index) => (
        <Loader.Item key={index} height="36px" width="100%" />
      ))}
    </Loader>
  );
}

/** Skeleton for a chart or card block. */
export function TimeTrackingBlockLoader({ height = "240px" }: { height?: string }) {
  return (
    <Loader className="w-full">
      <Loader.Item height={height} width="100%" />
    </Loader>
  );
}
