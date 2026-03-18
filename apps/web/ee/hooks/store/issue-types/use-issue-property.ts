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
// plane imports
import type { EIssuePropertyType, IIssueProperty } from "@plane/types";
// context
import { StoreContext } from "@/lib/store-context";

export const useIssueProperty = <T extends EIssuePropertyType>(
  typeId: string,
  propertyId: string | null | undefined
): IIssueProperty<T> | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueProperty must be used within StoreProvider");
  if (!propertyId) {
    return undefined;
  }
  const issueProperty = context.workItemTypeBridge.data?.[typeId]?.getPropertyById<T>(propertyId);
  return issueProperty;
};
