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
      notificationsMutate(
        (prev) =>
          prev?.map((prevNotification) => {
            if (prevNotification.id === notificationId) {
              return {
                ...prevNotification,
                read_at: null,
              };
            }
            return prevNotification;
          }),
        false
      );
      await userNotificationServices
        .markUserNotificationAsUnread(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
        });
    } else {
      notificationsMutate(
        (prev) =>
          prev?.map((prevNotification) => {
            if (prevNotification.id === notificationId) {
              return {
                ...prevNotification,
                read_at: new Date(),
              };
            }
            return prevNotification;
          }),
        false
      );
      await userNotificationServices
        .markUserNotificationAsRead(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
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
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
        });
    } else {
      notificationsMutate(
        (prev) => prev?.filter((prevNotification) => prevNotification.id !== notificationId),
        false
      );
      await userNotificationServices
        .markUserNotificationAsArchived(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
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
        .finally(() => {
          notificationsMutate();
        });
    } else {
      notificationsMutate(
        (prevData) => prevData?.filter((prev) => prev.id !== notificationId) || [],
        false
      );
      await userNotificationServices
        .patchUserNotification(workspaceSlug.toString(), notificationId, {
          snoozed_till: dateTime,
        })
        .catch(() => {
          new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
        });
    }
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
