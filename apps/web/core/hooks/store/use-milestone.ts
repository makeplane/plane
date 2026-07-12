/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web
import type { IMilestoneStore } from "@/plane-web/store/milestone.store";

export const useMilestone = (): IMilestoneStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useMilestone must be used within StoreProvider");
  return context.milestone;
};
