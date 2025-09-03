"use client";

import { FC, Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react";
// components
// helpers
import { cn } from "@plane/utils";
import { INotification } from "@/store/notifications/notification";
import { NotificationItemArchiveOption } from "./archive";
import { NotificationItemReadOption } from "./read";
import { NotificationItemSnoozeOption } from "./snooze";

type TNotificationOption = {
  workspaceSlug: string;
  notificationList: INotification[];
  issueId: string;
  unreadCount: number;
  isSnoozeStateModalOpen: boolean;
  setIsSnoozeStateModalOpen: Dispatch<SetStateAction<boolean>>;
  customSnoozeModal: boolean;
  setCustomSnoozeModal: Dispatch<SetStateAction<boolean>>;
};

export const NotificationOption: FC<TNotificationOption> = observer((props) => {
  const {
    workspaceSlug,
    notificationList,
    issueId,
    unreadCount,
    isSnoozeStateModalOpen,
    setIsSnoozeStateModalOpen,
    customSnoozeModal,
    setCustomSnoozeModal,
  } = props;

  return (
    <div className={cn("flex-shrink-0 hidden group-hover:block text-sm", isSnoozeStateModalOpen ? `!block` : ``)}>
      <div className="relative flex justify-center items-center gap-2">
        {/* read */}
        <NotificationItemReadOption
          workspaceSlug={workspaceSlug}
          notificationList={notificationList}
          unreadCount={unreadCount}
          issueId={issueId}
        />

        {/* archive */}
        <NotificationItemArchiveOption
          workspaceSlug={workspaceSlug}
          notificationList={notificationList}
          issueId={issueId}
        />

        {/* snooze notification */}
        <NotificationItemSnoozeOption
          workspaceSlug={workspaceSlug}
          notificationList={notificationList}
          setIsSnoozeStateModalOpen={setIsSnoozeStateModalOpen}
          customSnoozeModal={customSnoozeModal}
          setCustomSnoozeModal={setCustomSnoozeModal}
        />
      </div>
    </div>
  );
});
