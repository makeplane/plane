import { useState } from "react";

import { useRouter } from "next/router";

// swr
import useSWR from "swr";

// services
import userNotificationServices from "services/notifications.service";

// fetch-keys
import { UNREAD_NOTIFICATIONS_COUNT, USER_WORKSPACE_NOTIFICATIONS } from "constants/fetch-keys";

// type
import type { NotificationType } from "types";

const useUserNotification = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [snoozed, setSnoozed] = useState<boolean>(false);
  const [archived, setArchived] = useState<boolean>(false);
  const [readNotification, setReadNotification] = useState<boolean>(false);
  const [selectedNotificationForSnooze, setSelectedNotificationForSnooze] = useState<string | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState<NotificationType>("assigned");

  const params = {
    type: snoozed || archived || readNotification ? undefined : selectedTab,
    snoozed,
    archived,
    read: !readNotification ? undefined : false,
  };

  const { data: notifications, mutate: notificationsMutate } = useSWR(
    workspaceSlug ? USER_WORKSPACE_NOTIFICATIONS(workspaceSlug.toString(), params) : null,
    workspaceSlug
      ? () => userNotificationServices.getUserNotifications(workspaceSlug.toString(), params)
      : null
  );

  const { data: notificationCount, mutate: mutateNotificationCount } = useSWR(
    workspaceSlug ? UNREAD_NOTIFICATIONS_COUNT(workspaceSlug.toString()) : null,
    () =>
      workspaceSlug
        ? userNotificationServices.getUnreadNotificationsCount(workspaceSlug.toString())
        : null
  );

  const markNotificationReadStatus = async (notificationId: string) => {
    if (!workspaceSlug) return;
    const isRead =
      notifications?.find((notification) => notification.id === notificationId)?.read_at !== null;

    if (isRead) {
      await userNotificationServices
        .markUserNotificationAsUnread(workspaceSlug.toString(), notificationId)
        .then(() => {
          notificationsMutate((prev) =>
            prev?.map((prevNotification) => {
              if (prevNotification.id === notificationId) {
                return {
                  ...prevNotification,
                  read_at: null,
                };
              }
              return prevNotification;
            })
          );
          mutateNotificationCount();
        })
        .catch(() => {
          throw new Error("Something went wrong");
        });
    } else {
      await userNotificationServices
        .markUserNotificationAsRead(workspaceSlug.toString(), notificationId)
        .then(() => {
          notificationsMutate((prev) =>
            prev?.map((prevNotification) => {
              if (prevNotification.id === notificationId) {
                return {
                  ...prevNotification,
                  read_at: new Date(),
                };
              }
              return prevNotification;
            })
          );
          mutateNotificationCount();
        })
        .catch(() => {
          throw new Error("Something went wrong");
        });
    }
  };

  const markNotificationArchivedStatus = async (notificationId: string) => {
    if (!workspaceSlug) return;
    const isArchived =
      notifications?.find((notification) => notification.id === notificationId)?.archived_at !==
      null;

    if (isArchived) {
      await userNotificationServices
        .markUserNotificationAsUnarchived(workspaceSlug.toString(), notificationId)
        .then(() => {
          notificationsMutate();
        })
        .catch(() => {
          throw new Error("Something went wrong");
        });
    } else {
      await userNotificationServices
        .markUserNotificationAsArchived(workspaceSlug.toString(), notificationId)
        .then(() => {
          notificationsMutate((prev) =>
            prev?.filter((prevNotification) => prevNotification.id !== notificationId)
          );
        })
        .catch(() => {
          throw new Error("Something went wrong");
        });
    }
  };

  const markSnoozeNotification = async (notificationId: string, dateTime?: Date) => {
    if (!workspaceSlug) return;

    const isSnoozed =
      notifications?.find((notification) => notification.id === notificationId)?.snoozed_till !==
      null;

    if (isSnoozed) {
      await userNotificationServices
        .patchUserNotification(workspaceSlug.toString(), notificationId, {
          snoozed_till: null,
        })
        .then(() => {
          notificationsMutate();
        });
    } else
      await userNotificationServices
        .patchUserNotification(workspaceSlug.toString(), notificationId, {
          snoozed_till: dateTime,
        })
        .then(() => {
          notificationsMutate(
            (prevData) => prevData?.filter((prev) => prev.id !== notificationId) || []
          );
        });
  };

  return {
    notifications,
    notificationsMutate,
    markNotificationReadStatus,
    markNotificationArchivedStatus,
    markSnoozeNotification,
    snoozed,
    setSnoozed,
    archived,
    setArchived,
    readNotification,
    setReadNotification,
    selectedNotificationForSnooze,
    setSelectedNotificationForSnooze,
    selectedTab,
    setSelectedTab,
    totalNotificationCount: notificationCount
      ? notificationCount.created_issues +
        notificationCount.watching_issues +
        notificationCount.my_issues
      : null,
    notificationCount,
    mutateNotificationCount,
  };
};

export default useUserNotification;
