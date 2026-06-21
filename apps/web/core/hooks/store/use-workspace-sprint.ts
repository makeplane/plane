/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IWorkspaceSprintStore } from "@/store/workspace-sprint.store";

export const useWorkspaceSprint = (): IWorkspaceSprintStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceSprint must be used within StoreProvider");
  return context.workspaceSprint;
};
