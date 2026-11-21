/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Loader } from "@plane/blocks/skeleton";

const LOADER_GROUP_KEYS = ["group-1", "group-2", "group-3"];
const LOADER_STATE_KEYS = ["state-1", "state-2"];

export function ProjectStateLoader() {
  return (
    <Loader className="w-full space-y-4">
      {LOADER_GROUP_KEYS.map((groupKey) => (
        <div key={groupKey} className="rounded-lg border border-subtle bg-layer-1 p-3">
          {/* group header */}
          <div className="flex items-center gap-1 py-1">
            <Loader.Item height="24px" width="24px" />
            <Loader.Item height="20px" width="20px" />
            <Loader.Item height="16px" width="96px" />
          </div>
          {/* group states */}
          <div className="mt-2 space-y-1.5">
            {LOADER_STATE_KEYS.map((stateKey) => (
              <div key={stateKey} className="rounded-lg border border-subtle bg-layer-2 p-3">
                <Loader.Item height="20px" width="40%" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Loader>
  );
}
