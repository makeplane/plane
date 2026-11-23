/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IWebhookStore } from "@/store/workspace/webhook.store";

export const useWebhook = (): IWebhookStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWebhook must be used within StoreProvider");
  return context.workspaceRoot.webhook;
};
