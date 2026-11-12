/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";
import type { SelectContextValue } from "./types";

// Lets Select.Trigger / Select.Value read the current selection + renderers from the root.
export const SelectContext = createContext<SelectContextValue<unknown> | null>(null);

export function useSelectContext(): SelectContextValue<unknown> {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error("Select.Trigger / Select.Value must be rendered inside <Select>.");
  return ctx;
}
