/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { NotificationCardListRoot } from "./notification-card/root";

export type TNotificationListRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export function NotificationListRoot(props: TNotificationListRoot) {
  return <NotificationCardListRoot {...props} />;
}
