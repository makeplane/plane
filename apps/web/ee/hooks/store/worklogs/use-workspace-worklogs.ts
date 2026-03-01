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
// mobx store
import { StoreContext } from "@/lib/store-context";
// plane web store
import type { IWorklogStore } from "@/store/worklog/worklog.store";

export const useWorkspaceWorklogs = (): IWorklogStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceWorklogs must be used within StoreProvider");

  return context.workspaceWorklogs ?? {};
};
