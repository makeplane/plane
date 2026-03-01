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

import type { Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// hooks
import { useNotification } from "@/hooks/store/notifications/use-notification";
// local imports
import { NotificationItemArchiveOption } from "./archive";
import { NotificationItemReadOption } from "./read";
import { NotificationItemSnoozeOption } from "./snooze";

type TNotificationOption = {
  workspaceSlug: string;
  notificationId: string;
  isSnoozeStateModalOpen: boolean;
  setIsSnoozeStateModalOpen: Dispatch<SetStateAction<boolean>>;
  customSnoozeModal: boolean;
  setCustomSnoozeModal: Dispatch<SetStateAction<boolean>>;
};

export const NotificationOption = observer(function NotificationOption(props: TNotificationOption) {
  const {
    workspaceSlug,
    notificationId,
    isSnoozeStateModalOpen,
    setIsSnoozeStateModalOpen,
    customSnoozeModal,
    setCustomSnoozeModal,
  } = props;
  // hooks
  const notification = useNotification(notificationId);

  return (
    <div
      className={cn("flex-shrink-0 hidden group-hover:block text-body-xs-medium", {
        block: isSnoozeStateModalOpen,
      })}
    >
      <div className="relative flex justify-center items-center gap-2">
        {/* read */}
        <NotificationItemReadOption workspaceSlug={workspaceSlug} notification={notification} />

        {/* archive */}
        <NotificationItemArchiveOption workspaceSlug={workspaceSlug} notification={notification} />

        {/* snooze notification */}
        <NotificationItemSnoozeOption
          workspaceSlug={workspaceSlug}
          notification={notification}
          setIsSnoozeStateModalOpen={setIsSnoozeStateModalOpen}
          customSnoozeModal={customSnoozeModal}
          setCustomSnoozeModal={setCustomSnoozeModal}
        />
      </div>
    </div>
  );
});
