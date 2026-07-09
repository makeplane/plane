/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import type { IProjectPageStore } from "@/store/pages/project-page.store";
import type { IWorkspacePageStore } from "@/store/pages/workspace-page.store";

export enum EPageStoreType {
  PROJECT = "PROJECT_PAGE",
  WORKSPACE = "WORKSPACE_PAGE",
}

export type TReturnType = {
  [EPageStoreType.PROJECT]: IProjectPageStore;
  [EPageStoreType.WORKSPACE]: IWorkspacePageStore;
};

export const usePageStore = <T extends EPageStoreType>(storeType: T): TReturnType[T] => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePageStore must be used within StoreProvider");

  if (storeType === EPageStoreType.PROJECT) {
    return context.projectPages as TReturnType[T];
  }

  if (storeType === EPageStoreType.WORKSPACE) {
    return context.workspacePages as TReturnType[T];
  }

  throw new Error(`Invalid store type: ${storeType}`);
};
