/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IWorkflowStore } from "@/plane-web/store/workflow.store";

export const useWorkflow = (): IWorkflowStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkflow must be used within StoreProvider");
  return context.workflow;
};
