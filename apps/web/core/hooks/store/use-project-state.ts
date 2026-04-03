/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// Plane-web
import type { IStateStore } from "@/plane-web/store/state.store";

export const useProjectState = (): IStateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectState must be used within StoreProvider");
  return context.state;
};
