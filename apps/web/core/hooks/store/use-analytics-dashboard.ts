/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IAnalyticsDashboardStore } from "@/store/analytics-dashboard.store";

export const useAnalyticsDashboard = (): IAnalyticsDashboardStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAnalyticsDashboard must be used within StoreProvider");
  return context.analyticsDashboard;
};
