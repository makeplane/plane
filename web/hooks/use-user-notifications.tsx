import { useMemo, useState } from "react";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import type { NotificationType, NotificationCount, IMarkAllAsReadPayload } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// constant
import { UNREAD_NOTIFICATIONS_COUNT, getPaginatedNotificationKey } from "@/constants/fetch-keys";
// services
import { NotificationService } from "@/services/notification.service";

const PER_PAGE = 30;

const userNotificationServices = new NotificationService();

const useUserNotification = (): any => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [snoozed, setSnoozed] = useState<boolean>(false);
  const [archived, setArchived] = useState<boolean>(false);
  const [readNotification, setReadNotification] = useState<boolean>(false);
  const [fetchNotifications, setFetchNotifications] = useState<boolean>(false);
  const [selectedNotificationForSnooze, setSelectedNotificationForSnooze] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<NotificationType>("assigned");

  const params = useMemo(
    () => ({
      type: snoozed || archived || readNotification ? undefined : selectedTab,
      snoozed,
      archived,
      read: !readNotification ? null : false,
      per_page: PER_PAGE,
    }),
    [archived, readNotification, selectedTab, snoozed]
  );

  const {
    data: paginatedData,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate: notificationMutate,
  } = useSWRInfinite(
    fetchNotifications && workspaceSlug
      ? (index, prevData) => getPaginatedNotificationKey(index, prevData, workspaceSlug.toString(), params)
      : () => null,
    async (url: string) => await userNotificationServices.getNotifications(url)
  );

  const isLoadingMore = isLoading || (size > 0 && paginatedData && typeof paginatedData[size - 1] === "undefined");
  const isEmpty = paginatedData?.[0]?.results?.length === 0;
  const notifications = paginatedData ? paginatedData.map((d) => d.results).flat() : undefined;
  const hasMore = isEmpty || (paginatedData && paginatedData[paginatedData.length - 1].next_page_results);
  const isRefreshing = isValidating && paginatedData && paginatedData.length === size;

  const { data: notificationCount, mutate: mutateNotificationCount } = useSWR(
    workspaceSlug ? UNREAD_NOTIFICATIONS_COUNT(workspaceSlug.toString()) : null,
    () => (workspaceSlug ? userNotificationServices.getUnreadNotificationsCount(workspaceSlug.toString()) : null)
  );

  const handleReadMutation = (action: "read" | "unread") => {
    const notificationCountNumber = action === "read" ? -1 : 1;

    mutateNotificationCount((prev: any) => {
      if (!prev) return prev;

      const notificationType: keyof NotificationCount =
        selectedTab === "assigned" ? "my_issues" : selectedTab === "created" ? "created_issues" : "watching_issues";

      return {
        ...prev,
        [notificationType]: prev[notificationType] + notificationCountNumber,
      };
    }, false);
  };

  const mutateNotification = (notificationId: string, value: Object) => {
    notificationMutate((previousNotifications: any) => {
      if (!previousNotifications) return previousNotifications;

      const notificationIndex = Math.floor(
        previousNotifications
          .map((d: any) => d.results)
          .flat()
          .findIndex((notification: any) => notification.id === notificationId) / PER_PAGE
      );

      let notificationIndexInPage = previousNotifications[notificationIndex].results.findIndex(
        (notification: any) => notification.id === notificationId
      );

      if (notificationIndexInPage === -1) return previousNotifications;

      notificationIndexInPage = notificationIndexInPage === -1 ? 0 : notificationIndexInPage % PER_PAGE;

      if (notificationIndex === -1) return previousNotifications;

      if (notificationIndexInPage === -1) return previousNotifications;

      const key = Object.keys(value)[0];
      (previousNotifications[notificationIndex].results[notificationIndexInPage] as any)[key] = (value as any)[key];

      return previousNotifications;
    }, false);
  };

  const removeNotification = (notificationId: string) => {
    notificationMutate((previousNotifications: any) => {
      if (!previousNotifications) return previousNotifications;

      const notificationIndex = Math.floor(
        previousNotifications
          .map((d: any) => d.results)
          .flat()
          .findIndex((notification: any) => notification.id === notificationId) / PER_PAGE
      );

      let notificationIndexInPage = previousNotifications[notificationIndex].results.findIndex(
        (notification: any) => notification.id === notificationId
      );

      if (notificationIndexInPage === -1) return previousNotifications;

      notificationIndexInPage = notificationIndexInPage === -1 ? 0 : notificationIndexInPage % PER_PAGE;

      if (notificationIndex === -1) return previousNotifications;

      if (notificationIndexInPage === -1) return previousNotifications;

      previousNotifications[notificationIndex].results.splice(notificationIndexInPage, 1);

      return previousNotifications;
    }, false);
  };

  const markNotificationReadStatus = async (notificationId: string) => {
    if (!workspaceSlug) return;

    const isRead = notifications?.find((notification) => notification.id === notificationId)?.read_at !== null;

    handleReadMutation(isRead ? "unread" : "read");
    mutateNotification(notificationId, { read_at: isRead ? null : new Date() });

    if (readNotification) removeNotification(notificationId);

    if (isRead) {
      await userNotificationServices
        .markUserNotificationAsUnread(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          mutateNotificationCount();
        });
    } else {
      await userNotificationServices
        .markUserNotificationAsRead(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          mutateNotificationCount();
        });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!workspaceSlug) return;

    const isRead = notifications?.find((notification) => notification.id === notificationId)?.read_at !== null;

    if (isRead) return;

    mutateNotification(notificationId, { read_at: new Date() });
    handleReadMutation("read");

    await userNotificationServices.markUserNotificationAsRead(workspaceSlug.toString(), notificationId).catch(() => {
      throw new Error("Something went wrong");
    });

    mutateNotificationCount();
  };

  const markNotificationArchivedStatus = async (notificationId: string) => {
    if (!workspaceSlug) return;
    const isArchived = notifications?.find((notification) => notification.id === notificationId)?.archived_at !== null;

    if (!isArchived) {
      handleReadMutation("read");
      removeNotification(notificationId);
    } else {
      if (archived) {
        removeNotification(notificationId);
      }
    }

    if (isArchived) {
      await userNotificationServices
        .markUserNotificationAsUnarchived(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationMutate();
          mutateNotificationCount();
        });
    } else {
      await userNotificationServices
        .markUserNotificationAsArchived(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationMutate();
          mutateNotificationCount();
        });
    }
  };

  const markSnoozeNotification = async (notificationId: string, dateTime?: Date) => {
    if (!workspaceSlug) return;

    const isSnoozed = notifications?.find((notification) => notification.id === notificationId)?.snoozed_till !== null;

    mutateNotification(notificationId, { snoozed_till: isSnoozed ? null : dateTime });

    if (isSnoozed) {
      await userNotificationServices
        .patchUserNotification(workspaceSlug.toString(), notificationId, {
          snoozed_till: null,
        })
        .finally(() => {
          notificationMutate();
        });
    } else {
      await userNotificationServices
        .patchUserNotification(workspaceSlug.toString(), notificationId, {
          snoozed_till: dateTime,
        })
        .catch(() => {
          new Error("Something went wrong");
        })
        .finally(() => {
          notificationMutate();
        });
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!workspaceSlug) return;

    let markAsReadParams: IMarkAllAsReadPayload;

    if (snoozed) markAsReadParams = { archived: false, snoozed: true };
    else if (archived) markAsReadParams = { archived: true, snoozed: false };
    else markAsReadParams = { archived: false, snoozed: false, type: readNotification ? "all" : selectedTab };

    await userNotificationServices
      .markAllNotificationsAsRead(workspaceSlug.toString(), markAsReadParams)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "All Notifications marked as read.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      })
      .finally(() => {
        notificationMutate();
        mutateNotificationCount();
      });
  };

  return {
    notifications,
    notificationMutate,
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
      ? notificationCount.created_issues + notificationCount.watching_issues + notificationCount.my_issues
      : null,
    notificationCount,
    mutateNotificationCount,
    setSize,
    isLoading,
    isLoadingMore,
    hasMore,
    isRefreshing,
    setFetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
};

export default useUserNotification;
