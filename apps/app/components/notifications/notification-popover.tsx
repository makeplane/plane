import React, { Fragment } from "react";

import { useRouter } from "next/router";

// hooks
import useTheme from "hooks/use-theme";

import { Popover, Transition } from "@headlessui/react";

// hooks
import useWorkspaceMembers from "hooks/use-workspace-members";
import useUserNotification from "hooks/use-user-notifications";

// components
import { Icon, Loader, EmptyState, Tooltip } from "components/ui";
import { SnoozeNotificationModal, NotificationCard } from "components/notifications";
// icons
import { NotificationsOutlined } from "@mui/icons-material";
// images
import emptyNotification from "public/empty-state/notification.svg";
// helpers
import { getNumberCount } from "helpers/string.helper";

// type
import type { NotificationType } from "types";

export const NotificationPopover = () => {
  const {
    notifications,
    archived,
    readNotification,
    selectedNotificationForSnooze,
    selectedTab,
    setArchived,
    setReadNotification,
    setSelectedNotificationForSnooze,
    setSelectedTab,
    setSnoozed,
    snoozed,
    notificationMutate,
    markNotificationArchivedStatus,
    markNotificationReadStatus,
    markSnoozeNotification,
    notificationCount,
    totalNotificationCount,
    setSize,
    isLoadingMore,
    hasMore,
    isRefreshing,
  } = useUserNotification();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { isOwner, isMember } = useWorkspaceMembers(workspaceSlug?.toString() ?? "");

  // theme context
  const { collapsed: sidebarCollapse } = useTheme();

  const notificationTabs: Array<{
    label: string;
    value: NotificationType;
    unreadCount?: number;
  }> = [
    {
      label: "My Issues",
      value: "assigned",
      unreadCount: notificationCount?.my_issues,
    },
    {
      label: "Created by me",
      value: "created",
      unreadCount: notificationCount?.created_issues,
    },
    {
      label: "Subscribed",
      value: "watching",
      unreadCount: notificationCount?.watching_issues,
    },
  ];

  return (
    <>
      <SnoozeNotificationModal
        isOpen={selectedNotificationForSnooze !== null}
        onClose={() => setSelectedNotificationForSnooze(null)}
        onSubmit={markSnoozeNotification}
        notification={
          notifications?.find(
            (notification) => notification.id === selectedNotificationForSnooze
          ) || null
        }
        onSuccess={() => {
          setSelectedNotificationForSnooze(null);
        }}
      />
      <Popover className="relative w-full">
        {({ open: isActive, close: closePopover }) => (
          <>
            <Popover.Button
              className={`group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                isActive
                  ? "bg-custom-primary-100/10 text-custom-primary-100"
                  : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
              } ${sidebarCollapse ? "justify-center" : ""}`}
            >
              <NotificationsOutlined fontSize="small" />
              {sidebarCollapse ? null : <span>Notifications</span>}
              {totalNotificationCount && totalNotificationCount > 0 ? (
                <span className="ml-auto bg-custom-primary-300 rounded-full text-xs text-white px-1.5">
                  {getNumberCount(totalNotificationCount)}
                </span>
              ) : null}
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute bg-custom-background-100 flex flex-col left-0 md:left-full ml-8 z-10 top-0 md:w-[36rem] w-[20rem] h-[50vh] border border-custom-border-300 shadow-lg rounded-xl">
                <div className="flex items-center justify-between px-5 pt-5">
                  <h2 className="text-xl font-semibold mb-2">Notifications</h2>
                  <div className="flex gap-x-4 justify-center items-center text-custom-text-200">
                    <Tooltip tooltipContent="Refresh">
                      <button
                        type="button"
                        onClick={() => {
                          notificationMutate();
                        }}
                      >
                        <Icon
                          iconName="refresh"
                          className={`${isRefreshing ? "animate-spin" : ""}`}
                        />
                      </button>
                    </Tooltip>
                    <Tooltip tooltipContent="Unread notifications">
                      <button
                        type="button"
                        onClick={() => {
                          setSnoozed(false);
                          setArchived(false);
                          setReadNotification((prev) => !prev);
                        }}
                      >
                        <Icon iconName="filter_list" />
                      </button>
                    </Tooltip>
                    <Tooltip tooltipContent="Snoozed notifications">
                      <button
                        type="button"
                        onClick={() => {
                          setArchived(false);
                          setReadNotification(false);
                          setSnoozed((prev) => !prev);
                        }}
                      >
                        <Icon iconName="schedule" />
                      </button>
                    </Tooltip>
                    <Tooltip tooltipContent="Archived notifications">
                      <button
                        type="button"
                        onClick={() => {
                          setSnoozed(false);
                          setReadNotification(false);
                          setArchived((prev) => !prev);
                        }}
                      >
                        <Icon iconName="archive" />
                      </button>
                    </Tooltip>
                    <button type="button" onClick={() => closePopover()}>
                      <Icon iconName="close" />
                    </button>
                  </div>
                </div>
                <div className="border-b border-custom-border-300 w-full px-5 mt-5">
                  {snoozed || archived || readNotification ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSnoozed(false);
                        setArchived(false);
                        setReadNotification(false);
                      }}
                    >
                      <h4 className="flex items-center gap-2 pb-4">
                        <Icon iconName="arrow_back" />
                        <span className="ml-2 font-medium">
                          {snoozed
                            ? "Snoozed Notifications"
                            : readNotification
                            ? "Unread Notifications"
                            : "Archived Notifications"}
                        </span>
                      </h4>
                    </button>
                  ) : (
                    <nav className="flex space-x-5 overflow-x-auto" aria-label="Tabs">
                      {notificationTabs.map((tab) =>
                        tab.value === "created" ? (
                          isMember || isOwner ? (
                            <button
                              type="button"
                              key={tab.value}
                              onClick={() => setSelectedTab(tab.value)}
                              className={`whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium outline-none ${
                                tab.value === selectedTab
                                  ? "border-custom-primary-100 text-custom-primary-100"
                                  : "border-transparent text-custom-text-200"
                              }`}
                            >
                              {tab.label}
                              {tab.unreadCount && tab.unreadCount > 0 ? (
                                <span
                                  className={`ml-2 rounded-full text-xs px-2 py-0.5 ${
                                    tab.value === selectedTab
                                      ? "bg-custom-primary-100 text-white"
                                      : "bg-custom-background-80 text-custom-text-200"
                                  }`}
                                >
                                  {getNumberCount(tab.unreadCount)}
                                </span>
                              ) : null}
                            </button>
                          ) : null
                        ) : (
                          <button
                            type="button"
                            key={tab.value}
                            onClick={() => setSelectedTab(tab.value)}
                            className={`whitespace-nowrap border-b-2 pb-4 px-1 text-sm font-medium ${
                              tab.value === selectedTab
                                ? "border-custom-primary-100 text-custom-primary-100"
                                : "border-transparent text-custom-text-200"
                            }`}
                          >
                            {tab.label}
                            {tab.unreadCount && tab.unreadCount > 0 ? (
                              <span
                                className={`ml-2 rounded-full text-xs px-2 py-0.5 ${
                                  tab.value === selectedTab
                                    ? "bg-custom-primary-100 text-white"
                                    : "bg-custom-background-80 text-custom-text-200"
                                }`}
                              >
                                {getNumberCount(tab.unreadCount)}
                              </span>
                            ) : null}
                          </button>
                        )
                      )}
                    </nav>
                  )}
                </div>

                {notifications ? (
                  notifications.length > 0 ? (
                    <div className="h-full overflow-y-auto">
                      <div className="divide-y divide-custom-border-100">
                        {notifications.map((notification) => (
                          <NotificationCard
                            key={notification.id}
                            notification={notification}
                            markNotificationArchivedStatus={markNotificationArchivedStatus}
                            markNotificationReadStatus={markNotificationReadStatus}
                            setSelectedNotificationForSnooze={setSelectedNotificationForSnooze}
                            markSnoozeNotification={markSnoozeNotification}
                          />
                        ))}
                      </div>
                      {isLoadingMore && (
                        <div className="mt-6 flex justify-center items-center text-sm">
                          <div role="status">
                            <svg
                              aria-hidden="true"
                              className="mr-2 h-6 w-6 animate-spin fill-blue-600 text-custom-text-200"
                              viewBox="0 0 100 101"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                fill="currentColor"
                              />
                              <path
                                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                fill="currentFill"
                              />
                            </svg>
                            <span className="sr-only">Loading...</span>
                          </div>
                          <p>Loading notifications</p>
                        </div>
                      )}
                      {hasMore && !isLoadingMore && (
                        <button
                          type="button"
                          className="text-custom-primary-100 mt-6 flex justify-center items-center w-full text-sm font-medium"
                          disabled={isLoadingMore}
                          onClick={() => {
                            setSize((prev) => prev + 1);
                          }}
                        >
                          Load More
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid h-full w-full place-items-center overflow-hidden scale-75">
                      <EmptyState
                        title="You're updated with all the notifications"
                        description="You have read all the notifications."
                        image={emptyNotification}
                        isFullScreen={false}
                      />
                    </div>
                  )
                ) : (
                  <Loader className="p-5 space-y-4 overflow-y-auto">
                    <Loader.Item height="50px" />
                    <Loader.Item height="50px" />
                    <Loader.Item height="50px" />
                    <Loader.Item height="50px" />
                    <Loader.Item height="50px" />
                  </Loader>
                )}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  );
};
