/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { SelectRoot } from "./root";
import { SelectTrigger } from "./trigger";
import { SelectValue } from "./value";

/**
 * Generic, virtualized entity picker built on propel's Combobox. Supports sync (`getValues: () => T[]`)
 * and infinite/paginated (`getValues: (params) => Promise<TPaginatedResponse<T[]>>`) data sources,
 * single/multi selection, and exposes `Select.Trigger` / `Select.Value` for the closed-state UI.
 */
export const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Value: SelectValue,
});
