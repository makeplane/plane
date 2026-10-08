/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
export function MembersLayoutLoader() {
  return (
    <div className="flex gap-5 overflow-x-auto py-1.5">
      {range(5).map((columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-3">
          <div className={`flex h-9 items-center justify-between ${columnIndex === 0 ? "w-80" : "w-36"}`}>
            <span className="h-6 w-24 animate-pulse rounded-sm bg-layer-1" />
          </div>
          {range(2).map((cardIndex) => (
            <span className="h-8 w-full animate-pulse rounded-sm bg-layer-1" key={cardIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}
