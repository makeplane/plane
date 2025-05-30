"use client";

import { FC, Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react";
// components
import { cn } from "@plane/utils";
import {
  NotificationItemReadOption,
  NotificationItemArchiveOption,
  NotificationItemSnoozeOption,
} from "@/components/workspace-notifications";
// helpers
// hooks
import { useNotification } from "@/hooks/store";

type TNotificationOption = {
  workspaceSlug: string;
  notificationId: string;
  isSnoozeStateModalOpen: boolean;
  setIsSnoozeStateModalOpen: Dispatch<SetStateAction<boolean>>;
  customSnoozeModal: boolean;
  setCustomSnoozeModal: Dispatch<SetStateAction<boolean>>;
};

export const NotificationOption: FC<TNotificationOption> = observer((props) => {
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
    <div className={cn("flex-shrink-0 hidden group-hover:block text-sm", isSnoozeStateModalOpen ? `!block` : ``)}>
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
