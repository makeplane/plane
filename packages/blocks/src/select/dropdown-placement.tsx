/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";

/** Placement for Select-backed Combobox popups nested inside another panel (e.g. overflow menu). */
export type SelectDropdownPlacement = {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

// Mirrors select/context.ts: export context + hook only (no Provider component) so
// react(only-export-components) stays quiet under pre-commit --deny-warnings.
export const SelectDropdownPlacementContext = createContext<SelectDropdownPlacement | null>(null);

export function useSelectDropdownPlacement(): SelectDropdownPlacement | null {
  return useContext(SelectDropdownPlacementContext);
}
