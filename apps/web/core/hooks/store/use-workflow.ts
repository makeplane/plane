/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IWorkflowStore } from "@/plane-web/store/workflow.store";

export const useWorkflowStore = (): IWorkflowStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkflowStore must be used within StoreProvider");
  return (context as unknown as { workflowStore: IWorkflowStore }).workflowStore;
};
