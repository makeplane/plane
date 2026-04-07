/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
import { Loader } from "@plane/ui";

// Pre-computed random widths for loader skeleton animation
const LOADER_WIDTHS = [
  "250px", "260px", "270px", "280px", "290px", "300px", "310px", "320px", "330px", "340px",
];

export function PageLoader() {
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="px-3 border-b border-subtle py-3">
        <Loader className="relative flex items-center gap-2">
          <Loader.Item width="200px" height="30px" />
          <div className="relative flex items-center gap-2 ml-auto">
            <Loader.Item width="100px" height="30px" />
            <Loader.Item width="100px" height="30px" />
          </div>
        </Loader>
      </div>
      <div>
        {range(10).map((i) => (
          <Loader key={i} className="relative flex items-center gap-2 p-3 py-4 border-b border-subtle">
            <Loader.Item width={LOADER_WIDTHS[i]} height="22px" />
            <div className="ml-auto relative flex items-center gap-2">
              <Loader.Item width="60px" height="22px" />
              <Loader.Item width="22px" height="22px" />
              <Loader.Item width="22px" height="22px" />
              <Loader.Item width="22px" height="22px" />
            </div>
          </Loader>
        ))}
      </div>
    </div>
  );
}
