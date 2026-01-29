/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import type { IStateStore } from "@/store/state.store";

export const useStates = (): IStateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useState must be used within StoreProvider");
  return context.state;
};
