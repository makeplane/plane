/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function MembersSettingsLoader() {
  return (
    <div className="divide-y-[0.5px] divide-subtle">
      {range(3).map((i) => (
        <div key={i} className="group grid grid-cols-5 items-center justify-evenly px-3 py-4">
          <div className="col-span-2 flex items-center gap-x-2.5">
            <span className="size-6 rounded-full bg-layer-1" />
            <span className="h-5 w-24 rounded-sm bg-layer-1" />
          </div>
          <span className="h-5 w-24 rounded-sm bg-layer-1" />
          <span className="h-5 w-20 rounded-sm bg-layer-1" />
          <span className="h-5 w-28 rounded-sm bg-layer-1" />
        </div>
      ))}
    </div>
  );
}
