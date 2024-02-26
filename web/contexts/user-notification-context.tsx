import { createContext, useCallback, useEffect, useReducer } from "react";

import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { NotificationService } from "services/notification.service";
// fetch-keys
import { UNREAD_NOTIFICATIONS_COUNT, USER_WORKSPACE_NOTIFICATIONS } from "constants/fetch-keys";
// type
import type { NotificationType, NotificationCount, IUserNotification } from "@plane/types";

const notificationService = new NotificationService();

export const userNotificationContext = createContext<ContextType>({} as ContextType);

type UserNotificationProps = {
  selectedTab: NotificationType;
  snoozed: boolean;
  archived: boolean;
  readNotification: boolean;
  selectedNotificationForSnooze: string | null;
};

type ReducerActionType = {
  type:
    | "READ_NOTIFICATION_COUNT"
    | "SET_SELECTED_TAB"
    | "SET_SNOOZED"
    | "SET_ARCHIVED"
    | "SET_READ_NOTIFICATION"
    | "SET_SELECTED_NOTIFICATION_FOR_SNOOZE"
    | "SET_NOTIFICATIONS";
  payload?: Partial<ContextType>;
};

type ContextType = UserNotificationProps & {
  notifications?: IUserNotification[];
  notificationCount?: NotificationCount | null;
  setSelectedTab: (tab: NotificationType) => void;
  setSnoozed: (snoozed: boolean) => void;
  setArchived: (archived: boolean) => void;
  setReadNotification: (readNotification: boolean) => void;
  setSelectedNotificationForSnooze: (notificationId: string | null) => void;
  markNotificationReadStatus: (notificationId: string) => void;
  markNotificationArchivedStatus: (notificationId: string) => void;
  markSnoozeNotification: (notificationId: string, dateTime?: Date) => void;
};

type StateType = {
  selectedTab: NotificationType;
  snoozed: boolean;
  archived: boolean;
  readNotification: boolean;
  selectedNotificationForSnooze: string | null;
};

type ReducerFunctionType = (state: StateType, action: ReducerActionType) => StateType;

export const initialState: StateType = {
  selectedTab: "assigned",
  snoozed: false,
  archived: false,
  readNotification: false,
  selectedNotificationForSnooze: null,
};

export const reducer: ReducerFunctionType = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case "READ_NOTIFICATION_COUNT":
    case "SET_SELECTED_TAB":
    case "SET_SNOOZED":
    case "SET_ARCHIVED":
    case "SET_READ_NOTIFICATION":
    case "SET_SELECTED_NOTIFICATION_FOR_SNOOZE":
    case "SET_NOTIFICATIONS": {
      return { ...state, ...payload };
    }

    default:
      return state;
  }
};

const UserNotificationContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [state, dispatch] = useReducer(reducer, initialState);

  const { selectedTab, snoozed, archived, readNotification, selectedNotificationForSnooze } = state;

  const params = {
    type: snoozed || archived || readNotification ? undefined : selectedTab,
    snoozed,
    archived,
    read: !readNotification ? undefined : false,
  };

  const { data: notifications, mutate: notificationsMutate } = useSWR(
    workspaceSlug ? USER_WORKSPACE_NOTIFICATIONS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => notificationService.getUserNotifications(workspaceSlug.toString(), params) : null
  );

  const { data: notificationCount, mutate: mutateNotificationCount } = useSWR(
    workspaceSlug ? UNREAD_NOTIFICATIONS_COUNT(workspaceSlug.toString()) : null,
    () => (workspaceSlug ? notificationService.getUnreadNotificationsCount(workspaceSlug.toString()) : null)
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

  const markNotificationReadStatus = async (notificationId: string) => {
    if (!workspaceSlug) return;
    const isRead = notifications?.find((notification) => notification.id === notificationId)?.read_at !== null;

    notificationsMutate(
      (previousNotifications: any) =>
        previousNotifications?.map((notification: any) =>
          notification.id === notificationId ? { ...notification, read_at: isRead ? null : new Date() } : notification
        ),
      false
    );

    handleReadMutation(isRead ? "unread" : "read");

    if (isRead) {
      await notificationService
        .markUserNotificationAsUnread(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
          mutateNotificationCount();
        });
    } else {
      await notificationService
        .markUserNotificationAsRead(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
          mutateNotificationCount();
        });
    }
  };

  const markNotificationArchivedStatus = async (notificationId: string) => {
    if (!workspaceSlug) return;
    const isArchived = notifications?.find((notification) => notification.id === notificationId)?.archived_at !== null;

    if (!isArchived) {
      handleReadMutation("read");
    }

    if (isArchived) {
      await notificationService
        .markUserNotificationAsUnarchived(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
          mutateNotificationCount();
        });
    } else {
      notificationsMutate(
        (prev: any) => prev?.filter((prevNotification: any) => prevNotification.id !== notificationId),
        false
      );
      await notificationService
        .markUserNotificationAsArchived(workspaceSlug.toString(), notificationId)
        .catch(() => {
          throw new Error("Something went wrong");
        })
        .finally(() => {
          notificationsMutate();
          mutateNotificationCount();
        });
    }
  };

  const markSnoozeNotification = async (notificationId: string, dateTime?: Date) => {
    if (!workspaceSlug) return;

    const isSnoozed = notifications?.find((notification) => notification.id === notificationId)?.snoozed_till !== null;

    notificationsMutate(
      (previousNotifications: any) =>
        previousNotifications?.map((notification: any) =>
          notification.id === notificationId
            ? { ...notification, snoozed_till: isSnoozed ? null : new Date(dateTime!) }
            : notification
        ) || [],
      false
    );

    if (isSnoozed) {
      await notificationService
        .patchUserNotification(workspaceSlug.toString(), notificationId, {
          snoozed_till: null,
        })
        .finally(() => {
          notificationsMutate();
        });
    } else {
      await notificationService
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

  const setSelectedTab = useCallback((tab: NotificationType) => {
    dispatch({ type: "SET_SELECTED_TAB", payload: { selectedTab: tab } });
  }, []);

  const setSnoozed = useCallback((snoozed: boolean) => {
    dispatch({ type: "SET_SNOOZED", payload: { snoozed } });
  }, []);

  const setArchived = useCallback((archived: boolean) => {
    dispatch({ type: "SET_ARCHIVED", payload: { archived } });
  }, []);

  const setReadNotification = useCallback((readNotification: boolean) => {
    dispatch({ type: "SET_READ_NOTIFICATION", payload: { readNotification } });
  }, []);

  const setSelectedNotificationForSnooze = useCallback((notificationId: string | null) => {
    dispatch({
      type: "SET_SELECTED_NOTIFICATION_FOR_SNOOZE",
      payload: { selectedNotificationForSnooze: notificationId },
    });
  }, []);

  useEffect(() => {
    dispatch({ type: "SET_NOTIFICATIONS", payload: { notifications } });
  }, [notifications]);

  useEffect(() => {
    dispatch({ type: "READ_NOTIFICATION_COUNT", payload: { notificationCount } });
  }, [notificationCount]);

  return (
    <userNotificationContext.Provider
      value={{
        ...state,
        notifications,
        notificationCount,
        setSelectedTab,
        setSnoozed,
        setArchived,
        setReadNotification,
        setSelectedNotificationForSnooze,
        markNotificationReadStatus,
        markNotificationArchivedStatus,
        markSnoozeNotification,
      }}
    >
      {children}
    </userNotificationContext.Provider>
  );
};

export default UserNotificationContextProvider;
