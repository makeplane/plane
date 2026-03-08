/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
import type { IStickyStore } from "@/store/sticky/sticky.store";
// plane web stores

export const useSticky = (): IStickyStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useSticky must be used within StoreProvider");
  return context.stickyStore;
};
