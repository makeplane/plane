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
import type { IProjectState } from "@/store/workspace-project-states";

export const useProjectState = (projectStateId: string | undefined): IProjectState => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectState must be used within StoreProvider");
  if (!projectStateId) return {} as IProjectState;

  return context.workspaceProjectStates.projectStates[projectStateId];
};
