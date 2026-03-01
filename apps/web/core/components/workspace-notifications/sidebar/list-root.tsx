/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// components
import { WithFeatureFlagHOC } from "@/components/feature-flags";
// local imports
import { NotificationCardWithoutStackingListRoot } from "./notification-card/without-stacking/root";
import { NotificationCardWithStackingListRoot } from "./notification-card/with-stacking/root";

export type TNotificationListRoot = {
  workspaceSlug: string;
  workspaceId: string;
  onNotificationClick?: () => void;
};

export const NotificationListRoot = observer(function NotificationListRoot(props: TNotificationListRoot) {
  const { workspaceSlug, workspaceId, onNotificationClick } = props;
  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag="INBOX_STACKING"
      fallback={
        <NotificationCardWithoutStackingListRoot
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          onNotificationClick={onNotificationClick}
        />
      }
    >
      <NotificationCardWithStackingListRoot
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        onNotificationClick={onNotificationClick}
      />
    </WithFeatureFlagHOC>
  );
});
