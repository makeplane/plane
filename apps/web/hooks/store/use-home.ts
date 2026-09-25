/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IHomeStore } from "@/store/workspace/home";

export const useHome = (): IHomeStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useDashboard must be used within StoreProvider");
  return context.workspaceRoot.home;
};
