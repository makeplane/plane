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
// plane web stores
import type { IIssueType } from "@plane/types";
// context
import { StoreContext } from "@/lib/store-context";

export const useIssueType = (typeId: string | null | undefined): IIssueType | undefined => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIssueType must be used within StoreProvider");
  if (!typeId) {
    return undefined;
  }
  const issueType = context.workItemTypeBridge.getIssueTypeById(typeId);
  return issueType;
};
