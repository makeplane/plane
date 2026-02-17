/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
export function MembersLayoutLoader() {
  return (
    <div className="flex gap-5 py-1.5 overflow-x-auto">
      {range(5).map((columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-3">
          <div className={`flex items-center justify-between h-9 ${columnIndex === 0 ? "w-80" : "w-36"}`}>
            <span className="h-6 w-24 bg-layer-1 rounded-sm animate-pulse" />
          </div>
          {range(2).map((cardIndex) => (
            <span className="h-8 w-full bg-layer-1 rounded-sm animate-pulse" key={cardIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}
