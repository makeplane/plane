/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
// ui
import { Loader } from "@plane/blocks/skeleton";

export function RecentActivityWidgetLoader() {
  return (
    <Loader className="space-y-0 rounded-md">
      {range(6).map((index) => (
        <div key={index} className="flex h-[38px] items-center gap-2 px-2">
          <Loader.Item height="16px" width="16px" />
          <Loader.Item height="14px" width="70%" />
        </div>
      ))}
    </Loader>
  );
}
