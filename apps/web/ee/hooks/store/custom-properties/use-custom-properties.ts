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
import type { CustomPropertyType, RootCustomPropertiesStoreSchema } from "@plane/types";
import { StoreContext } from "@/lib/store-context";

export const useCustomProperties = (): RootCustomPropertiesStoreSchema<CustomPropertyType> => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useCustomProperties must be used within StoreProvider");

  return context.customPropertiesRootStore;
};
