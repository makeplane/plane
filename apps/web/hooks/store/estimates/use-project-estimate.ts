/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import type { IProjectEstimateStore } from "@/store/estimates/project-estimate.store";

export const useProjectEstimates = (): IProjectEstimateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPage must be used within StoreProvider");

  return context.projectEstimate;
};
