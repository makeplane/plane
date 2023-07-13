import { useCallback, useState } from "react";

import { useRouter } from "next/router";

// swr
import useSWR from "swr";

// services
import userNotificationServices from "services/notifications.service";

// fetch-keys
import { USER_WORKSPACE_NOTIFICATIONS } from "constants/fetch-keys";

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

  const { data: notifications, mutate: notificationsMutate } = useSWR(
    workspaceSlug
      ? USER_WORKSPACE_NOTIFICATIONS(workspaceSlug.toString(), {
          type: selectedTab,
          snoozed,
          archived,
          read: readNotification,
        })
      : null,
    workspaceSlug
      ? () =>
          userNotificationServices.getUserNotifications(workspaceSlug.toString(), {
            type: selectedTab,
            snoozed,
            archived,
            read: readNotification,
          })
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

  return {
    notifications,
    notificationsMutate,
    markNotificationReadStatus,
    markNotificationArchivedStatus,
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
  };
};

export default useUserNotification;
