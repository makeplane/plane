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
import type { TUpdateEntityType } from "@plane/types";
import { EUpdateEntityType } from "@plane/types";
// mobx store
import { StoreContext } from "@/lib/store-context";
import type { IUpdateStore } from "@/store/work-items/epic/updates/base.store";

export const useUpdateDetail = (serviceType: TUpdateEntityType): IUpdateStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueDetail must be used within StoreProvider");
  if (serviceType === EUpdateEntityType.EPIC) return context.epicBaseStore.updatesStore;
  if (serviceType === EUpdateEntityType.INITIATIVE) return context.initiativeStore.updatesStore;
  else return context.epicBaseStore.updatesStore;
};
