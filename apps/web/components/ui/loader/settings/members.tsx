/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function MembersSettingsLoader() {
  return (
    <div className="divide-y divide-subtle overflow-hidden rounded-lg border border-subtle bg-surface-1">
      <div className="h-11 bg-layer-1" />
      {range(3).map((i) => (
        <div key={i} className="grid h-11 grid-cols-5 items-center bg-layer-2">
          <div className="col-span-2 flex min-w-0 items-center gap-2.5 px-3 py-2">
            <span className="size-6 shrink-0 rounded-full bg-layer-1" />
            <span className="h-5 w-full max-w-60 min-w-0 rounded-sm bg-layer-1" />
          </div>
          <div className="min-w-0 px-3 py-2">
            <span className="block h-5 w-full max-w-24 rounded-sm bg-layer-1" />
          </div>
          <div className="min-w-0 px-3 py-2">
            <span className="block h-5 w-full max-w-20 rounded-sm bg-layer-1" />
          </div>
          <div className="min-w-0 px-3 py-2">
            <span className="block h-5 w-full max-w-28 rounded-sm bg-layer-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
