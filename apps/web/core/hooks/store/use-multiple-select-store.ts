/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";

export const useMultipleSelectStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMultipleSelectStore must be used within StoreProvider");
  return context.multipleSelect;
};
