/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import type { ITimelinePropagationStore } from "@/plane-web/store/timeline/timeline-propagation.store";

export const useTimelinePropagationStore = (): ITimelinePropagationStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTimelinePropagationStore must be used within StoreProvider");
  return context.timelineStore.timelinePropagationStore;
};
