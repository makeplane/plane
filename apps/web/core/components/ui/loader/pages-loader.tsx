/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function PagesLoader() {
  return (
    <div className="flex h-full flex-col space-y-5 overflow-hidden p-6">
      <div className="flex justify-between gap-4">
        <h3 className="text-20 font-semibold text-primary">Pages</h3>
      </div>
      <div className="flex items-center gap-3">
        {range(5).map((i) => (
          <span key={i} className="h-8 w-20 rounded-full bg-layer-1" />
        ))}
      </div>
      <div className="divide-y divide-subtle-1">
        {range(5).map((i) => (
          <div key={i} className="flex h-12 w-full items-center justify-between px-3">
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-sm bg-layer-1" />
              <span className="h-5 w-20 rounded-sm bg-layer-1" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-16 rounded-sm bg-layer-1" />
              <span className="h-5 w-5 rounded-sm bg-layer-1" />
              <span className="h-5 w-5 rounded-sm bg-layer-1" />
              <span className="h-5 w-5 rounded-sm bg-layer-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
