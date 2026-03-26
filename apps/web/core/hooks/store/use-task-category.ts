/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { ITaskCategoryStore } from "@/plane-web/store/task-category.store";

export const useTaskCategory = (): ITaskCategoryStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useTaskCategory must be used within StoreProvider");
  return (context as unknown as { taskCategoryStore: ITaskCategoryStore }).taskCategoryStore;
};
