/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { ITimerStore } from "@/store/time-tracking/timer.store";

export const useTimer = (): ITimerStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTimer must be used within StoreProvider");
  return context.timer;
};
