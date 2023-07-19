import React, { Fragment } from "react";

import { useRouter } from "next/router";

// hooks
import useTheme from "hooks/use-theme";

import { Popover, Transition } from "@headlessui/react";

// hooks
import useWorkspaceMembers from "hooks/use-workspace-members";
import useUserNotification from "hooks/use-user-notifications";

// components
import { Icon, Loader, EmptyState } from "components/ui";
import { SnoozeNotificationModal, NotificationCard } from "components/notifications";
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
    notificationsMutate,
    markNotificationArchivedStatus,
    markNotificationReadStatus,
    markSnoozeNotification,
    notificationCount,
    totalNotificationCount,
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
      unreadCount: notificationCount?.watching_notifications,
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
          notificationsMutate();
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
                  : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80 focus:bg-custom-sidebar-background-80"
              } ${sidebarCollapse ? "justify-center" : ""}`}
            >
              <Icon iconName="notifications" />
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
              <Popover.Panel className="absolute bg-custom-background-100 flex flex-col left-0 md:left-full ml-8 z-10 top-0 md:w-[36rem] w-[20rem] h-[27rem] border border-custom-border-300 shadow-lg rounded-xl">
                <div className="flex items-center justify-between px-5 pt-5">
                  <h2 className="text-xl font-semibold mb-2">Notifications</h2>
                  <div className="flex gap-x-4 justify-center items-center text-custom-text-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        notificationsMutate();

                        const target = e.target as HTMLButtonElement;
                        target?.classList.add("animate-spin");
                        setTimeout(() => {
                          target?.classList.remove("animate-spin");
                        }, 1000);
                      }}
                    >
                      <Icon iconName="refresh" />
                    </button>
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
                    <div className="divide-y divide-custom-border-100 overflow-y-auto">
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
                  ) : (
                    <div className="grid h-full w-full place-items-center overflow-hidden">
                      <EmptyState
                        title="You're updated with all the notifications"
                        description="You have read all the notifications."
                        image={emptyNotification}
                        isFullScreen={false}
                      />
                    </div>
                  )
                ) : (
                  <Loader className="p-5 space-y-4">
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
