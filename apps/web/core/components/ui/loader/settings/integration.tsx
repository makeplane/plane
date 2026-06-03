/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";

export function IntegrationsSettingsLoader() {
  return (
    <div className="animate-pulse divide-y-[0.5px] divide-subtle">
      {range(2).map((i) => (
        <div key={i} className="flex items-center justify-between gap-2 border-b border-subtle bg-surface-1 px-4 py-6">
          <div className="flex items-start gap-4">
            <span className="h-10 w-10 rounded-full bg-layer-1" />
            <div className="flex flex-col gap-1">
              <span className="h-5 w-20 rounded-sm bg-layer-1" />
              <span className="h-4 w-60 rounded-sm bg-layer-1" />
            </div>
          </div>
          <span className="h-8 w-16 rounded-sm bg-layer-1" />
        </div>
      ))}
    </div>
  );
}
