/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import type { IRecurringWorkItemStore } from "@/store/recurring-work-items/base.store";

export const useRecurringWorkItems = (): IRecurringWorkItemStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useRecurringWorkItems must be used within StoreProvider");
  return context.recurringWorkItemsRoot.recurringWorkItems;
};
