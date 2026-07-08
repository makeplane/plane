/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// store
import type { IFileLibraryStore } from "@/store/file-library.store";

export const useFileLibrary = (): IFileLibraryStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFileLibrary must be used within StoreProvider");
  return context.fileLibrary;
};
