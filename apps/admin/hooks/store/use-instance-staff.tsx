/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// store
import { StoreContext } from "@/providers/store.provider";
import type { IInstanceStaffStore } from "@/store/instance-staff.store";

export const useInstanceStaff = (): IInstanceStaffStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useInstanceStaff must be used within StoreProvider");
  return context.instanceStaff;
};
