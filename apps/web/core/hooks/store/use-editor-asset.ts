/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-context";
import type { IEditorAssetStore } from "@/store/editor/asset.store";

export const useEditorAsset = (): IEditorAssetStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEditorAsset must be used within StoreProvider");
  return context.editorAssetStore;
};
