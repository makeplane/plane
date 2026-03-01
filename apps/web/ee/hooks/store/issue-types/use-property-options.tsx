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
// plane web context
import type { TWorkItemPropertyOptionsContext } from "@/lib/context/work-item-property-option";
import { WorkItemPropertyOptionContext } from "@/lib/context/work-item-property-option";

export const usePropertyOptions = (): TWorkItemPropertyOptionsContext => {
  const context = useContext(WorkItemPropertyOptionContext);
  if (context === undefined) throw new Error("usePropertyOptions must be used within WorkItemPropertyOptionsProvider");
  return context;
};
