import React, { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { Bell } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication } from "hooks/store";
import useUserNotification from "hooks/use-user-notifications";
// components
import { EmptyState } from "components/common";
import { SnoozeNotificationModal, NotificationCard, NotificationHeader } from "components/notifications";
import { Loader, Tooltip } from "@plane/ui";
// images
import emptyNotification from "public/empty-state/notification.svg";
// helpers
import { getNumberCount } from "helpers/string.helper";

export const NotificationPopover = observer(() => {
  // store hooks
  const { theme: themeStore } = useApplication();

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
    markNotificationAsRead,
    markSnoozeNotification,
    notificationCount,
    totalNotificationCount,
    setSize,
    isLoadingMore,
    hasMore,
    isRefreshing,
    setFetchNotifications,
    markAllNotificationsAsRead,
  } = useUserNotification();

  const isSidebarCollapsed = themeStore.sidebarCollapsed;

  return (
    <>
      <SnoozeNotificationModal
        isOpen={selectedNotificationForSnooze !== null}
        onClose={() => setSelectedNotificationForSnooze(null)}
        onSubmit={markSnoozeNotification}
        notification={notifications?.find((notification) => notification.id === selectedNotificationForSnooze) || null}
        onSuccess={() => {
          setSelectedNotificationForSnooze(null);
        }}
      />
      <Popover className="relative w-full">
        {({ open: isActive, close: closePopover }) => {
          if (isActive) setFetchNotifications(true);

          return (
            <>
              <Tooltip tooltipContent="Notifications" position="right" className="ml-2" disabled={!isSidebarCollapsed}>
                <Popover.Button
                  className={`group relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium outline-none ${
                    isActive
                      ? "bg-custom-primary-100/10 text-custom-primary-100"
                      : "text-custom-sidebar-text-200 hover:bg-custom-sidebar-background-80"
                  } ${isSidebarCollapsed ? "justify-center" : ""}`}
                >
                  <Bell className="h-4 w-4" />
                  {isSidebarCollapsed ? null : <span>Notifications</span>}
                  {totalNotificationCount && totalNotificationCount > 0 ? (
                    isSidebarCollapsed ? (
                      <span className="absolute right-3.5 top-2 h-2 w-2 rounded-full bg-custom-primary-300" />
                    ) : (
                      <span className="ml-auto rounded-full bg-custom-primary-300 px-1.5 text-xs text-white">
                        {getNumberCount(totalNotificationCount)}
                      </span>
                    )
                  ) : null}
                </Popover.Button>
              </Tooltip>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute -top-36 left-0 z-10 ml-8 flex h-[50vh] w-[20rem] flex-col rounded-xl border border-custom-border-300 bg-custom-background-100 shadow-lg md:left-full md:w-[36rem]">
                  <NotificationHeader
                    notificationCount={notificationCount}
                    notificationMutate={notificationMutate}
                    closePopover={closePopover}
                    isRefreshing={isRefreshing}
                    snoozed={snoozed}
                    archived={archived}
                    readNotification={readNotification}
                    selectedTab={selectedTab}
                    setSnoozed={setSnoozed}
                    setArchived={setArchived}
                    setReadNotification={setReadNotification}
                    setSelectedTab={setSelectedTab}
                    markAllNotificationsAsRead={markAllNotificationsAsRead}
                  />

                  {notifications ? (
                    notifications.length > 0 ? (
                      <div className="h-full overflow-y-auto">
                        <div className="divide-y divide-custom-border-100">
                          {notifications.map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              isSnoozedTabOpen={snoozed}
                              closePopover={closePopover}
                              notification={notification}
                              markNotificationArchivedStatus={markNotificationArchivedStatus}
                              markNotificationReadStatus={markNotificationAsRead}
                              markNotificationReadStatusToggle={markNotificationReadStatus}
                              setSelectedNotificationForSnooze={setSelectedNotificationForSnooze}
                              markSnoozeNotification={markSnoozeNotification}
                            />
                          ))}
                        </div>
                        {isLoadingMore && (
                          <div className="my-6 flex items-center justify-center text-sm">
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
                            className="my-6 flex w-full items-center justify-center text-sm font-medium text-custom-primary-100"
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
                      <div className="grid h-full w-full scale-75 place-items-center overflow-hidden">
                        <EmptyState
                          title="You're updated with all the notifications"
                          description="You have read all the notifications."
                          image={emptyNotification}
                        />
                      </div>
                    )
                  ) : (
                    <Loader className="space-y-4 overflow-y-auto p-5">
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
          );
        }}
      </Popover>
    </>
  );
});
