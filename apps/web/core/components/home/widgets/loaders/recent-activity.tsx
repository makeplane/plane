/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
// ui
import { Loader } from "@plane/ui";

export function RecentActivityWidgetLoader() {
  return (
    <Loader className="space-y-6 rounded-xl px-2">
      {range(5).map((index) => (
        <div key={index} className="flex items-start gap-3.5">
          <div className="flex-shrink-0">
            <Loader.Item height="32px" width="32px" />
          </div>
          <div className="my-auto w-full flex-shrink-0 space-y-3">
            <Loader.Item height="15px" width="70%" />
          </div>
        </div>
      ))}
    </Loader>
  );
}
