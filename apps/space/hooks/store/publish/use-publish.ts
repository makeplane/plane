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

/**
 * Reads the publish settings for a route anchor.
 *
 * The anchor is optional because callers read it from `useParams()`, which types route params as
 * `string | undefined` — and a hook argument is evaluated before a component can guard on it. A
 * missing anchor simply finds no entry in the map, which the empty-object fallback already covers.
 */
export const usePublish = (anchor: string | undefined): PublishStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePublish must be used within StoreProvider");
  if (!anchor) return {} as PublishStore;
  return context.publishList.publishMap?.[anchor] ?? {};
};
