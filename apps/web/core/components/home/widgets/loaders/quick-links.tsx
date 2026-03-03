/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { range } from "lodash-es";
// ui
import { Loader } from "@plane/ui";

export function QuickLinksWidgetLoader() {
  return (
    <Loader className="flex flex-wrap gap-2 rounded-xl bg-surface-1">
      {range(4).map((index) => (
        <Loader.Item key={index} height="56px" width="230px" />
      ))}
    </Loader>
  );
}
