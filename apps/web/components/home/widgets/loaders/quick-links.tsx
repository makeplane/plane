/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
// ui
import { Loader } from "@plane/blocks/skeleton";

export function QuickLinksWidgetLoader() {
  return (
    <Loader className="grid w-full grid-cols-1 gap-3 rounded-lg bg-layer-1 sm:grid-cols-2 lg:grid-cols-3">
      {range(3).map((index) => (
        <Loader.Item key={index} height="51px" width="100%" />
      ))}
    </Loader>
  );
}
