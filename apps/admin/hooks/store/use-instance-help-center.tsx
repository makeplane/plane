/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// store
import { StoreContext } from "@/providers/store.provider";
import type { IInstanceHelpCenterStore } from "@/store/instance-help-center.store";

export const useInstanceHelpCenter = (): IInstanceHelpCenterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInstanceHelpCenter must be used within StoreProvider");
  return context.instanceHelpCenter;
};
