/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// lib
import { StoreContext } from "@/lib/store-provider";
// store
import type { PublishStore } from "@/store/publish/publish.store";

export const usePublish = (anchor: string): PublishStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePublish must be used within StoreProvider");
  return context.publishList.publishMap?.[anchor] ?? {};
};
