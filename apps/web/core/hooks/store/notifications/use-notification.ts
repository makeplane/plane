/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// mobx store
import type { INotification } from "@/store/notifications/notification";

export const useNotification = (notificationId: string | undefined): INotification => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useNotification must be used within StoreProvider");
  if (!notificationId) return {} as INotification;

  return context.workspaceNotification.notifications?.[notificationId] ?? {};
};
