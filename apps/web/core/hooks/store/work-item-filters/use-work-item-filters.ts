/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// gizmo imports
import type { IWorkItemFilterStore } from "@plane/shared-state";
// context
import { StoreContext } from "@/lib/store-context";

export const useWorkItemFilters = (): IWorkItemFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkItemFilters must be used within StoreProvider");
  return context.workItemFilters;
};
